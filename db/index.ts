// Dexie.js database instance
// All row types derived from Tables<> — Supabase is the source of truth.
// Each synced store adds a `synced_at` column for offline sync tracking.
// See /docs/02-schema.md

import Dexie, { type Table } from 'dexie'
import type { Tables } from '@/lib/supabase/database.types'

// ---- Dexie row types: Supabase Row + synced_at ----

type WithSyncedAt<T> = T & { synced_at?: string }

export type DbUser                 = WithSyncedAt<Tables<'users'>>
export type DbStat                 = WithSyncedAt<Tables<'stats'>>
export type DbHabit                = WithSyncedAt<Tables<'habits'>>
export type DbHabitStatWeight      = WithSyncedAt<Tables<'habit_stat_weights'>>
export type DbHabitStreak          = WithSyncedAt<Tables<'habit_streaks'>>
export type DbHabitMaturity        = WithSyncedAt<Tables<'habit_maturity'>>
export type DbHabitLog             = WithSyncedAt<Tables<'habit_logs'>>
export type DbGoal                 = WithSyncedAt<Tables<'goals'>>
export type DbGoalMetricTarget     = WithSyncedAt<Tables<'goal_metric_targets'>>
export type DbGoalMilestone        = WithSyncedAt<Tables<'goal_milestones'>>
export type DbGoalStep             = WithSyncedAt<Tables<'goal_steps'>>
export type DbGoalStakeEffect      = WithSyncedAt<Tables<'goal_stake_effects'>>
export type DbGoalHabitLink        = WithSyncedAt<Tables<'goal_habit_links'>>
export type DbTask                 = WithSyncedAt<Tables<'tasks'>>
export type DbLogbookMetric        = WithSyncedAt<Tables<'logbook_metrics'>>
export type DbLogbookEntry         = WithSyncedAt<Tables<'logbook_entries'>>
export type DbScratchPadItem       = WithSyncedAt<Tables<'scratch_pad_items'>>
export type DbLootDropCatalog      = Tables<'loot_drop_catalog'> // read-only seed, no synced_at needed
export type DbLootDrop             = WithSyncedAt<Tables<'loot_drops'>>
export type DbXpEvent              = WithSyncedAt<Tables<'xp_events'>>
export type DbDailyPlan            = WithSyncedAt<Tables<'daily_plans'>>
export type DbSession              = WithSyncedAt<Tables<'sessions'>>
export type DbNotificationSchedule = WithSyncedAt<Tables<'notification_schedules'>>
export type DbNotificationLog      = WithSyncedAt<Tables<'notification_log'>>
export type DbUserIntegration      = WithSyncedAt<Tables<'user_integrations'>>
export type DbTemplate             = WithSyncedAt<Tables<'templates'>>

// ---- Sync queue (local only — not in Supabase) ----

export interface DbSyncQueueItem {
  id?: number // auto-increment
  table_name: string
  record_id: string
  operation: 'upsert' | 'delete'
  payload: string // JSON
  queued_at: string
}

// ---- Database class ----

export class OrganisedLifeDb extends Dexie {
  users!: Table<DbUser>
  stats!: Table<DbStat>
  habits!: Table<DbHabit>
  habit_stat_weights!: Table<DbHabitStatWeight>
  habit_streaks!: Table<DbHabitStreak>
  habit_maturity!: Table<DbHabitMaturity>
  habit_logs!: Table<DbHabitLog>
  goals!: Table<DbGoal>
  goal_metric_targets!: Table<DbGoalMetricTarget>
  goal_milestones!: Table<DbGoalMilestone>
  goal_steps!: Table<DbGoalStep>
  goal_stake_effects!: Table<DbGoalStakeEffect>
  goal_habit_links!: Table<DbGoalHabitLink>
  tasks!: Table<DbTask>
  logbook_metrics!: Table<DbLogbookMetric>
  logbook_entries!: Table<DbLogbookEntry>
  scratch_pad_items!: Table<DbScratchPadItem>
  loot_drop_catalog!: Table<DbLootDropCatalog>
  loot_drops!: Table<DbLootDrop>
  xp_events!: Table<DbXpEvent>
  daily_plans!: Table<DbDailyPlan>
  sessions!: Table<DbSession>
  notification_schedules!: Table<DbNotificationSchedule>
  notification_log!: Table<DbNotificationLog>
  user_integrations!: Table<DbUserIntegration>
  templates!: Table<DbTemplate>
  sync_queue!: Table<DbSyncQueueItem>

  constructor() {
    super('organised_life')

    this.version(1).stores({
      users:                  'id, email, updated_at, synced_at',
      stats:                  'id, user_id, sequence_order, updated_at, synced_at',
      habits:                 'id, user_id, time_block, sequence_order, updated_at, synced_at',
      habit_stat_weights:     'id, habit_id, stat_id, updated_at, synced_at',
      habit_streaks:          'id, habit_id, user_id, updated_at, synced_at',
      habit_maturity:         'id, habit_id, user_id, updated_at, synced_at',
      habit_logs:             'id, habit_id, user_id, completed_at, synced_at',
      goals:                  'id, user_id, status, updated_at, synced_at',
      goal_metric_targets:    'id, goal_id, logbook_metric_id, updated_at, synced_at',
      goal_milestones:        'id, goal_id, sequence_order, updated_at, synced_at',
      goal_steps:             'id, milestone_id, sequence_order, updated_at, synced_at',
      goal_habit_links:       'id, goal_id, habit_id, synced_at',
      tasks:                  'id, user_id, goal_id, completed_at, updated_at, synced_at',
      logbook_metrics:        'id, user_id, stat_id, updated_at, synced_at',
      logbook_entries:        'id, metric_id, user_id, logged_at, synced_at',
      scratch_pad_items:      'id, user_id, status, auto_archive_at, updated_at, synced_at',
      loot_drop_catalog:      'id, type, rarity',
      loot_drops:             'id, user_id, catalog_id, awarded_at, acknowledged, synced_at',
      xp_events:              'id, user_id, source_type, created_at, synced_at',
      daily_plans:            'id, user_id, plan_date, updated_at, synced_at',
      sessions:               'id, user_id, started_at, synced_at',
      notification_schedules: 'id, user_id, type, is_active, updated_at, synced_at',
      notification_log:       'id, user_id, schedule_id, sent_at, synced_at',
      user_integrations:      'id, user_id, provider, updated_at, synced_at',
      templates:              'id, author_user_id, is_public, updated_at, synced_at',
      sync_queue:             '++id, table_name, record_id, queued_at',
    })

    this.version(2).stores({
      goal_stake_effects:     'id, goal_id, stat_id, updated_at, synced_at',
    })
  }
}

export const db = new OrganisedLifeDb()
