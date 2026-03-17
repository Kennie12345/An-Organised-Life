// Sync engine: local IndexedDB → Supabase
// Reads sync_queue, writes to Supabase, clears queue on success
// Also handles session-start conflict detection
// See /docs/06-tech-stack.md (Sync strategy)

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

// Tables that participate in sync (all Supabase tables except loot_drop_catalog which is read-only seed)
const SYNC_TABLES = [
  'users', 'stats', 'habits', 'habit_stat_weights', 'habit_streaks',
  'habit_maturity', 'habit_logs', 'goals', 'goal_metric_targets',
  'goal_milestones', 'goal_steps', 'goal_habit_links', 'tasks',
  'logbook_metrics', 'logbook_entries', 'scratch_pad_items', 'loot_drops',
  'xp_events', 'daily_plans', 'sessions', 'notification_schedules',
  'notification_log', 'user_integrations', 'templates',
] as const

type SyncTableName = typeof SYNC_TABLES[number]

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
      const { error } = await supabase.from(item.table_name).upsert(payload)
      if (error) {
        return { status: 'error', conflicts: [], pushedCount, errorMessage: error.message }
      }
    } else if (item.operation === 'delete') {
      const { error } = await supabase.from(item.table_name).delete().eq('id', item.record_id)
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
  tableName: SyncTableName,
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
 * Compares local updated_at vs remote updated_at for the current user's records.
 * Returns a list of conflicts (records where remote is ahead of local).
 */
export async function detectConflicts(userId: string): Promise<ConflictRecord[]> {
  const supabase = createClient()
  const conflicts: ConflictRecord[] = []

  for (const tableName of SYNC_TABLES) {
    // Get local records for this user that have been synced at least once
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const localTable = (db as any)[tableName] as ReturnType<typeof db.table>
    if (!localTable) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let localRecords: Array<any> = []
    try {
      localRecords = await localTable.where('user_id').equals(userId).toArray()
    } catch {
      // Table may not have user_id index (e.g. habit_stat_weights)
      try {
        localRecords = await localTable.toArray()
      } catch {
        continue
      }
    }

    if (localRecords.length === 0) continue

    const localIds = localRecords.map((r) => r.id)

    const { data: remoteRecords } = await supabase
      .from(tableName)
      .select('id, updated_at')
      .in('id', localIds)

    if (!remoteRecords) continue

    const remoteMap = new Map(remoteRecords.map((r: { id: string; updated_at: string }) => [r.id, r.updated_at]))

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
 * Returns status and any conflicts detected.
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
 * Overwrite local records with remote data for resolved conflicts.
 * Used when user chooses "use remote" in conflict resolution.
 */
export async function resolveConflictUseRemote(conflict: ConflictRecord): Promise<void> {
  const supabase = createClient()
  const { data } = await supabase
    .from(conflict.tableName)
    .select('*')
    .eq('id', conflict.recordId)
    .single()

  if (!data) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localTable = (db as any)[conflict.tableName]
  if (!localTable) return

  await localTable.put({ ...data, synced_at: new Date().toISOString() })
}
