// Dexie.js database instance
// Schema mirrors Supabase tables — see /docs/02-schema.md
// Each store includes a `synced_at` column for offline sync tracking

import Dexie, { type Table } from 'dexie'

// ---- Types ----

export interface DbUser {
  id: string
  email: string
  name: string
  pet_name: string
  level: number
  current_xp: number
  lifetime_xp: number
  peak_level: number
  created_at: string
  updated_at: string
  synced_at?: string
}

export interface DbStat {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  description?: string
  current_value: number
  decay_grace_days: number
  decay_rate: number
  sequence_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  synced_at?: string
}

export interface DbHabit {
  id: string
  user_id: string
  name: string
  description?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  time_block: 'morning' | 'afternoon' | 'evening' | 'anytime'
  sequence_order: number
  completion_type: 'boolean' | 'numeric' | 'categorical' | 'scale' | 'time_range' | 'text' | 'composite'
  completion_config?: string // JSON
  xp_min: number
  xp_max: number
  loot_drop_eligible: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  synced_at?: string
}

export interface DbHabitStatWeight {
  id: string
  habit_id: string
  stat_id: string
  base_weight: number
  min_weight: number
  max_weight: number
  current_weight: number
  growth_rate: number
  decay_rate: number
  updated_at: string
  synced_at?: string
}

export interface DbHabitStreak {
  id: string
  habit_id: string
  user_id: string
  current_streak: number
  best_streak: number
  last_completed_date?: string
  updated_at: string
  synced_at?: string
}

export interface DbHabitMaturity {
  id: string
  habit_id: string
  user_id: string
  stage: 'fragile' | 'building' | 'established' | 'mastered'
  consistent_days: number
  last_stage_changed_at: string
  updated_at: string
  synced_at?: string
}

export interface DbHabitLog {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  completion_value: string
  sequence_multiplier: number
  xp_base: number
  xp_final: number
  loot_drop_id?: string
  llm_prompt_shown: boolean
  llm_response?: string
  bonus_xp_awarded?: number
  notes?: string
  metadata?: string // JSON
  synced_at?: string
}

export interface DbGoal {
  id: string
  user_id: string
  name: string
  why: string
  primary_stat_id: string
  status: 'scratch_pad' | 'committed' | 'active' | 'paused' | 'completed' | 'archived'
  stake_type: 'in_game' | 'personal_forfeit' | 'accountability'
  stake_description?: string
  commitment_score?: number
  committed_at?: string
  target_date?: string
  scratch_pad_expires_at: string
  created_at: string
  updated_at: string
  synced_at?: string
}

export interface DbGoalMetricTarget {
  id: string
  goal_id: string
  logbook_metric_id: string
  start_value: number
  target_value: number
  target_revised_at?: string
  previous_target?: number
  updated_at: string
  synced_at?: string
}

export interface DbGoalMilestone {
  id: string
  goal_id: string
  name: string
  description?: string
  sequence_order: number
  target_date?: string
  completed_at?: string
  updated_at: string
  synced_at?: string
}

export interface DbGoalStep {
  id: string
  milestone_id: string
  name: string
  sequence_order: number
  completed_at?: string
  updated_at: string
  synced_at?: string
}

export interface DbGoalHabitLink {
  id: string
  goal_id: string
  habit_id: string
  required_streak?: number
  synced_at?: string
}

export interface DbTask {
  id: string
  user_id: string
  name: string
  notes?: string
  goal_id?: string
  milestone_id?: string
  source: 'planned' | 'captured'
  goal_linked_at?: string
  completed_at?: string
  xp_awarded?: number
  created_at: string
  updated_at: string
  synced_at?: string
}

export interface DbLogbookMetric {
  id: string
  user_id: string
  name: string
  unit: string
  stat_id?: string
  created_at: string
  updated_at: string
  synced_at?: string
}

export interface DbLogbookEntry {
  id: string
  metric_id: string
  user_id: string
  value: number
  logged_at: string
  notes?: string
  metadata?: string // JSON
  synced_at?: string
}

export interface DbScratchPadItem {
  id: string
  user_id: string
  raw_idea: string
  status: 'pending' | 'interrogating' | 'promoted' | 'archived'
  created_at: string
  interrogation_started_at?: string
  interrogation_completed_at?: string
  commitment_score?: number
  llm_conversation?: string // JSON
  promoted_goal_id?: string
  auto_archive_at: string
  updated_at: string
  synced_at?: string
}

export interface DbLootDropCatalog {
  id: string
  type: 'xp_surge' | 'stat_boost' | 'rested_bonus' | 'fortune' | 'habitat_upgrade'
  name: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare'
  min_level: number
  payload: string // JSON
}

export interface DbLootDrop {
  id: string
  user_id: string
  catalog_id: string
  habit_log_id?: string
  awarded_at: string
  acknowledged: boolean
  synced_at?: string
}

export interface DbXpEvent {
  id: string
  user_id: string
  source_type: 'habit' | 'task' | 'bonus' | 'loot_drop' | 'penalty' | 'upkeep_drain'
  source_id?: string
  amount: number
  level_before: number
  level_after: number
  created_at: string
  synced_at?: string
}

export interface DbDailyPlan {
  id: string
  user_id: string
  plan_date: string
  intentions: string // JSON array
  mood_start?: number
  mood_end?: number
  journal_entry?: string
  created_at: string
  completed_at?: string
  updated_at: string
  synced_at?: string
}

export interface DbSession {
  id: string
  user_id: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
  primary_screen?: string
  synced_at?: string
}

export interface DbNotificationSchedule {
  id: string
  user_id: string
  type: 'time_block_reminder' | 'streak_warning' | 'upkeep_warning' | 'goal_stale' | 'scratch_pad_ready' | 'weekly_review' | 'level_drop_imminent'
  entity_type?: string
  entity_id?: string
  schedule_type: 'recurring' | 'triggered'
  recurrence_time?: string
  recurrence_days?: string // JSON
  advance_notice_min: number
  google_event_id?: string
  is_active: boolean
  last_triggered_at?: string
  created_at: string
  updated_at: string
  synced_at?: string
}

export interface DbNotificationLog {
  id: string
  user_id: string
  schedule_id: string
  message: string
  sent_at: string
  acknowledged_at?: string
  action_taken?: boolean
  synced_at?: string
}

export interface DbUserIntegration {
  id: string
  user_id: string
  provider: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  calendar_id: string
  last_synced_at?: string
  created_at: string
  updated_at: string
  synced_at?: string
}

export interface DbTemplate {
  id: string
  author_user_id: string
  name: string
  description: string
  is_public: boolean
  version: number
  forked_from_id?: string
  config_snapshot: string // JSON
  created_at: string
  updated_at: string
  synced_at?: string
}

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
      users: 'id, email, updated_at, synced_at',
      stats: 'id, user_id, sequence_order, updated_at, synced_at',
      habits: 'id, user_id, time_block, sequence_order, updated_at, synced_at',
      habit_stat_weights: 'id, habit_id, stat_id, updated_at, synced_at',
      habit_streaks: 'id, habit_id, user_id, updated_at, synced_at',
      habit_maturity: 'id, habit_id, user_id, updated_at, synced_at',
      habit_logs: 'id, habit_id, user_id, completed_at, synced_at',
      goals: 'id, user_id, status, updated_at, synced_at',
      goal_metric_targets: 'id, goal_id, logbook_metric_id, updated_at, synced_at',
      goal_milestones: 'id, goal_id, sequence_order, updated_at, synced_at',
      goal_steps: 'id, milestone_id, sequence_order, updated_at, synced_at',
      goal_habit_links: 'id, goal_id, habit_id, synced_at',
      tasks: 'id, user_id, goal_id, completed_at, updated_at, synced_at',
      logbook_metrics: 'id, user_id, stat_id, updated_at, synced_at',
      logbook_entries: 'id, metric_id, user_id, logged_at, synced_at',
      scratch_pad_items: 'id, user_id, status, auto_archive_at, updated_at, synced_at',
      loot_drop_catalog: 'id, type, rarity',
      loot_drops: 'id, user_id, catalog_id, awarded_at, acknowledged, synced_at',
      xp_events: 'id, user_id, source_type, created_at, synced_at',
      daily_plans: 'id, user_id, plan_date, updated_at, synced_at',
      sessions: 'id, user_id, started_at, synced_at',
      notification_schedules: 'id, user_id, type, is_active, updated_at, synced_at',
      notification_log: 'id, user_id, schedule_id, sent_at, synced_at',
      user_integrations: 'id, user_id, provider, updated_at, synced_at',
      templates: 'id, author_user_id, is_public, updated_at, synced_at',
      sync_queue: '++id, table_name, record_id, queued_at',
    })
  }
}

export const db = new OrganisedLifeDb()
