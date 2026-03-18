// Sync engine: local IndexedDB → Supabase
// Reads sync_queue, writes to Supabase, clears queue on success
// Also handles session-start conflict detection
// See /docs/06-tech-stack.md (Sync strategy)

import type { Table } from 'dexie'
import { db } from '@/db'
import { createClient } from '@/lib/supabase/client'

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'syncing' | 'error'

export interface ConflictRecord {
  tableName: string
  recordId: string
  localUpdatedAt: string
  remoteUpdatedAt: string
}

export interface SyncResult {
  status: SyncStatus
  conflicts: ConflictRecord[]
  pushedCount: number
  errorMessage?: string
}

// Minimum shape needed for conflict detection
type SyncableRow = { id: string; updated_at?: string; synced_at?: string }

// Typed lookup so we can access tables by name without `any`
const SYNC_TABLE_MAP: Record<string, Table<SyncableRow>> = {
  users:                  db.users                  as Table<SyncableRow>,
  stats:                  db.stats                  as Table<SyncableRow>,
  habits:                 db.habits                 as Table<SyncableRow>,
  habit_stat_weights:     db.habit_stat_weights     as Table<SyncableRow>,
  habit_streaks:          db.habit_streaks          as Table<SyncableRow>,
  habit_maturity:         db.habit_maturity         as Table<SyncableRow>,
  habit_logs:             db.habit_logs             as Table<SyncableRow>,
  goals:                  db.goals                  as Table<SyncableRow>,
  goal_metric_targets:    db.goal_metric_targets    as Table<SyncableRow>,
  goal_milestones:        db.goal_milestones        as Table<SyncableRow>,
  goal_steps:             db.goal_steps             as Table<SyncableRow>,
  goal_stake_effects:     db.goal_stake_effects     as Table<SyncableRow>,
  goal_habit_links:       db.goal_habit_links       as Table<SyncableRow>,
  tasks:                  db.tasks                  as Table<SyncableRow>,
  logbook_metrics:        db.logbook_metrics        as Table<SyncableRow>,
  logbook_entries:        db.logbook_entries        as Table<SyncableRow>,
  scratch_pad_items:      db.scratch_pad_items      as Table<SyncableRow>,
  loot_drops:             db.loot_drops             as Table<SyncableRow>,
  xp_events:              db.xp_events              as Table<SyncableRow>,
  daily_plans:            db.daily_plans            as Table<SyncableRow>,
  sessions:               db.sessions               as Table<SyncableRow>,
  notification_schedules: db.notification_schedules as Table<SyncableRow>,
  notification_log:       db.notification_log       as Table<SyncableRow>,
  user_integrations:      db.user_integrations      as Table<SyncableRow>,
  templates:              db.templates              as Table<SyncableRow>,
}

const SYNC_TABLE_NAMES = Object.keys(SYNC_TABLE_MAP)

/**
 * Push all pending local writes to Supabase.
 * Reads sync_queue, upserts/deletes records in Supabase, clears queue on success.
 */
export async function pushLocalChanges(): Promise<SyncResult> {
  const supabase = createClient()
  const queue = await db.sync_queue.orderBy('queued_at').toArray()

  if (queue.length === 0) {
    return { status: 'synced', conflicts: [], pushedCount: 0 }
  }

  let pushedCount = 0

  for (const item of queue) {
    const payload = JSON.parse(item.payload)

    if (item.operation === 'upsert') {
      const { error } = await supabase.from(item.table_name as never).upsert(payload)
      if (error) {
        return { status: 'error', conflicts: [], pushedCount, errorMessage: error.message }
      }
    } else if (item.operation === 'delete') {
      const { error } = await supabase.from(item.table_name as never).delete().eq('id', item.record_id)
      if (error) {
        return { status: 'error', conflicts: [], pushedCount, errorMessage: error.message }
      }
    }

    await db.sync_queue.delete(item.id!)
    pushedCount++
  }

  return { status: 'synced', conflicts: [], pushedCount }
}

/**
 * Queue a local write for later sync to Supabase.
 * Call this instead of writing to Supabase directly when offline.
 */
export async function queueWrite(
  tableName: keyof typeof SYNC_TABLE_MAP,
  recordId: string,
  operation: 'upsert' | 'delete',
  payload: Record<string, unknown>,
): Promise<void> {
  await db.sync_queue.add({
    table_name: tableName,
    record_id: recordId,
    operation,
    payload: JSON.stringify(payload),
    queued_at: new Date().toISOString(),
  })
}

/**
 * Session-start conflict detection.
 * Compares local updated_at vs remote updated_at per record.
 * Returns conflicts where remote is ahead of local.
 */
export async function detectConflicts(userId: string): Promise<ConflictRecord[]> {
  const supabase = createClient()
  const conflicts: ConflictRecord[] = []

  for (const tableName of SYNC_TABLE_NAMES) {
    const localTable = SYNC_TABLE_MAP[tableName]

    let localRecords: SyncableRow[] = []
    try {
      // Most tables have user_id; fall back to full scan for junction tables
      localRecords = await localTable.where('user_id').equals(userId).toArray()
    } catch {
      try {
        localRecords = await localTable.toArray()
      } catch {
        continue
      }
    }

    if (localRecords.length === 0) continue

    const localIds = localRecords.map((r) => r.id)

    const { data: remoteRecords } = await supabase
      .from(tableName as never)
      .select('id, updated_at')
      .in('id', localIds)

    if (!remoteRecords) continue

    const remoteMap = new Map(
      (remoteRecords as Array<{ id: string; updated_at: string }>)
        .map((r) => [r.id, r.updated_at])
    )

    for (const local of localRecords) {
      if (!local.updated_at) continue
      const remoteUpdatedAt = remoteMap.get(local.id)
      if (!remoteUpdatedAt) continue

      if (new Date(remoteUpdatedAt) > new Date(local.updated_at)) {
        conflicts.push({
          tableName,
          recordId: local.id,
          localUpdatedAt: local.updated_at,
          remoteUpdatedAt,
        })
      }
    }
  }

  return conflicts
}

/**
 * Full session-start sync check.
 */
export async function sessionStartSync(userId: string): Promise<SyncResult> {
  const pendingCount = await db.sync_queue.count()
  const conflicts = await detectConflicts(userId)

  if (conflicts.length > 0) {
    return { status: 'conflict', conflicts, pushedCount: 0 }
  }
  if (pendingCount > 0) {
    return { status: 'pending', conflicts: [], pushedCount: 0 }
  }
  return { status: 'synced', conflicts: [], pushedCount: 0 }
}

/**
 * Overwrite local record with remote data for a resolved conflict.
 */
export async function resolveConflictUseRemote(conflict: ConflictRecord): Promise<void> {
  const supabase = createClient()
  const { data } = await supabase
    .from(conflict.tableName as never)
    .select('*')
    .eq('id', conflict.recordId)
    .single()

  if (!data) return

  const localTable = SYNC_TABLE_MAP[conflict.tableName]
  if (!localTable) return

  await localTable.put({ ...(data as SyncableRow), synced_at: new Date().toISOString() })
}
