-- Migration: 001_initial_schema
-- Creates all tables, updated_at triggers, and RLS policies.
-- See /docs/02-schema.md for the authoritative schema definition.

-- ==================== HELPER: updated_at trigger ====================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==================== TABLES ====================

-- users
create table if not exists users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  name       text not null default '',
  pet_name   text not null default '',
  level      integer not null default 1,
  current_xp integer not null default 0,
  lifetime_xp integer not null default 0,
  peak_level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger users_updated_at before update on users
  for each row execute procedure set_updated_at();

-- stats
create table if not exists stats (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  name             text not null,
  color            text not null default '#888888',
  icon             text not null default 'star',
  description      text,
  current_value    float not null default 50,
  decay_grace_days integer not null default 1,
  decay_rate       float not null default 1.0,
  sequence_order   integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger stats_updated_at before update on stats
  for each row execute procedure set_updated_at();

-- habits
create table if not exists habits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  name             text not null,
  description      text,
  frequency        text not null check (frequency in ('daily', 'weekly', 'monthly')),
  time_block       text not null check (time_block in ('morning', 'afternoon', 'evening', 'anytime')),
  sequence_order   integer not null default 0,
  completion_type  text not null check (completion_type in ('boolean', 'numeric', 'categorical', 'scale', 'time_range', 'text', 'composite')),
  completion_config jsonb,
  xp_min           integer not null default 10,
  xp_max           integer not null default 20,
  loot_drop_eligible boolean not null default true,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger habits_updated_at before update on habits
  for each row execute procedure set_updated_at();

-- habit_stat_weights
create table if not exists habit_stat_weights (
  id             uuid primary key default gen_random_uuid(),
  habit_id       uuid not null references habits(id) on delete cascade,
  stat_id        uuid not null references stats(id) on delete cascade,
  base_weight    float not null,
  min_weight     float not null,
  max_weight     float not null,
  current_weight float not null,
  growth_rate    float not null default 0.12,
  decay_rate     float not null default 0.06,
  updated_at     timestamptz not null default now(),
  unique(habit_id, stat_id)
);
create trigger habit_stat_weights_updated_at before update on habit_stat_weights
  for each row execute procedure set_updated_at();

-- habit_streaks
create table if not exists habit_streaks (
  id                  uuid primary key default gen_random_uuid(),
  habit_id            uuid not null references habits(id) on delete cascade,
  user_id             uuid not null references users(id) on delete cascade,
  current_streak      integer not null default 0,
  best_streak         integer not null default 0,
  last_completed_date date,
  updated_at          timestamptz not null default now(),
  unique(habit_id, user_id)
);
create trigger habit_streaks_updated_at before update on habit_streaks
  for each row execute procedure set_updated_at();

-- habit_maturity
create table if not exists habit_maturity (
  id                    uuid primary key default gen_random_uuid(),
  habit_id              uuid not null references habits(id) on delete cascade,
  user_id               uuid not null references users(id) on delete cascade,
  stage                 text not null default 'fragile' check (stage in ('fragile', 'building', 'established', 'mastered')),
  consistent_days       integer not null default 0,
  last_stage_changed_at timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(habit_id, user_id)
);
create trigger habit_maturity_updated_at before update on habit_maturity
  for each row execute procedure set_updated_at();

-- habit_logs
create table if not exists habit_logs (
  id                uuid primary key default gen_random_uuid(),
  habit_id          uuid not null references habits(id) on delete cascade,
  user_id           uuid not null references users(id) on delete cascade,
  completed_at      timestamptz not null default now(),
  completion_value  text not null,
  sequence_multiplier float not null default 1.0,
  xp_base           integer not null,
  xp_final          integer not null,
  loot_drop_id      uuid,
  llm_prompt_shown  boolean not null default false,
  llm_response      text,
  bonus_xp_awarded  integer,
  notes             text,
  metadata          jsonb
);

-- goals
create table if not exists goals (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references users(id) on delete cascade,
  name                   text not null,
  why                    text not null,
  primary_stat_id        uuid references stats(id),
  status                 text not null default 'scratch_pad' check (status in ('scratch_pad', 'committed', 'active', 'paused', 'completed', 'archived')),
  stake_type             text not null check (stake_type in ('in_game', 'personal_forfeit', 'accountability')),
  stake_description      text,
  commitment_score       integer check (commitment_score between 1 and 10),
  committed_at           timestamptz,
  target_date            date,
  scratch_pad_expires_at timestamptz not null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger goals_updated_at before update on goals
  for each row execute procedure set_updated_at();

-- goal_metric_targets
create table if not exists goal_metric_targets (
  id                  uuid primary key default gen_random_uuid(),
  goal_id             uuid not null references goals(id) on delete cascade,
  logbook_metric_id   uuid not null,
  start_value         float not null,
  target_value        float not null,
  target_revised_at   timestamptz,
  previous_target     float,
  updated_at          timestamptz not null default now()
);
create trigger goal_metric_targets_updated_at before update on goal_metric_targets
  for each row execute procedure set_updated_at();

-- goal_milestones
create table if not exists goal_milestones (
  id             uuid primary key default gen_random_uuid(),
  goal_id        uuid not null references goals(id) on delete cascade,
  name           text not null,
  description    text,
  sequence_order integer not null default 0,
  target_date    date,
  completed_at   timestamptz,
  updated_at     timestamptz not null default now()
);
create trigger goal_milestones_updated_at before update on goal_milestones
  for each row execute procedure set_updated_at();

-- goal_steps
create table if not exists goal_steps (
  id             uuid primary key default gen_random_uuid(),
  milestone_id   uuid not null references goal_milestones(id) on delete cascade,
  name           text not null,
  sequence_order integer not null default 0,
  completed_at   timestamptz,
  updated_at     timestamptz not null default now()
);
create trigger goal_steps_updated_at before update on goal_steps
  for each row execute procedure set_updated_at();

-- goal_habit_links
create table if not exists goal_habit_links (
  id               uuid primary key default gen_random_uuid(),
  goal_id          uuid not null references goals(id) on delete cascade,
  habit_id         uuid not null references habits(id) on delete cascade,
  required_streak  integer,
  unique(goal_id, habit_id)
);

-- tasks
create table if not exists tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  name           text not null,
  notes          text,
  goal_id        uuid references goals(id),
  milestone_id   uuid references goal_milestones(id),
  source         text not null check (source in ('planned', 'captured')),
  goal_linked_at timestamptz,
  completed_at   timestamptz,
  xp_awarded     integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger tasks_updated_at before update on tasks
  for each row execute procedure set_updated_at();

-- logbook_metrics
create table if not exists logbook_metrics (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  unit       text not null,
  stat_id    uuid references stats(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger logbook_metrics_updated_at before update on logbook_metrics
  for each row execute procedure set_updated_at();

-- logbook_entries
create table if not exists logbook_entries (
  id         uuid primary key default gen_random_uuid(),
  metric_id  uuid not null references logbook_metrics(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  value      float not null,
  logged_at  timestamptz not null default now(),
  notes      text,
  metadata   jsonb
);

-- scratch_pad_items
create table if not exists scratch_pad_items (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references users(id) on delete cascade,
  raw_idea                    text not null,
  status                      text not null default 'pending' check (status in ('pending', 'interrogating', 'promoted', 'archived')),
  created_at                  timestamptz not null default now(),
  interrogation_started_at    timestamptz,
  interrogation_completed_at  timestamptz,
  commitment_score            integer check (commitment_score between 1 and 10),
  llm_conversation            jsonb,
  promoted_goal_id            uuid references goals(id),
  auto_archive_at             timestamptz not null,
  updated_at                  timestamptz not null default now()
);
create trigger scratch_pad_items_updated_at before update on scratch_pad_items
  for each row execute procedure set_updated_at();

-- loot_drop_catalog
create table if not exists loot_drop_catalog (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('xp_surge', 'stat_boost', 'rested_bonus', 'fortune', 'habitat_upgrade')),
  name        text not null,
  description text not null,
  rarity      text not null check (rarity in ('common', 'uncommon', 'rare')),
  min_level   integer not null default 1,
  payload     jsonb not null
);

-- loot_drops
create table if not exists loot_drops (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  catalog_id   uuid not null references loot_drop_catalog(id),
  habit_log_id uuid references habit_logs(id),
  awarded_at   timestamptz not null default now(),
  acknowledged boolean not null default false,
  updated_at   timestamptz not null default now()
);
create trigger loot_drops_updated_at before update on loot_drops
  for each row execute procedure set_updated_at();

-- Add FK from habit_logs to loot_drops (after both tables exist)
alter table habit_logs
  add constraint habit_logs_loot_drop_id_fkey
  foreign key (loot_drop_id) references loot_drops(id);

-- xp_events
create table if not exists xp_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  source_type  text not null check (source_type in ('habit', 'task', 'bonus', 'loot_drop', 'penalty', 'upkeep_drain')),
  source_id    uuid,
  amount       integer not null,
  level_before integer not null,
  level_after  integer not null,
  created_at   timestamptz not null default now()
);

-- daily_plans
create table if not exists daily_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  plan_date    date not null,
  intentions   jsonb not null default '[]'::jsonb,
  mood_start   integer check (mood_start between 1 and 5),
  mood_end     integer check (mood_end between 1 and 5),
  journal_entry text,
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique(user_id, plan_date)
);
create trigger daily_plans_updated_at before update on daily_plans
  for each row execute procedure set_updated_at();

-- sessions
create table if not exists sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_seconds integer,
  primary_screen   text,
  updated_at       timestamptz not null default now()
);
create trigger sessions_updated_at before update on sessions
  for each row execute procedure set_updated_at();

-- notification_schedules
create table if not exists notification_schedules (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  type                text not null check (type in ('time_block_reminder', 'streak_warning', 'upkeep_warning', 'goal_stale', 'scratch_pad_ready', 'weekly_review', 'level_drop_imminent')),
  entity_type         text,
  entity_id           uuid,
  schedule_type       text not null check (schedule_type in ('recurring', 'triggered')),
  recurrence_time     time,
  recurrence_days     jsonb,
  advance_notice_min  integer not null default 10,
  google_event_id     text,
  is_active           boolean not null default true,
  last_triggered_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger notification_schedules_updated_at before update on notification_schedules
  for each row execute procedure set_updated_at();

-- notification_log
create table if not exists notification_log (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  schedule_id      uuid not null references notification_schedules(id) on delete cascade,
  message          text not null,
  sent_at          timestamptz not null default now(),
  acknowledged_at  timestamptz,
  action_taken     boolean,
  updated_at       timestamptz not null default now()
);
create trigger notification_log_updated_at before update on notification_log
  for each row execute procedure set_updated_at();

-- user_integrations
create table if not exists user_integrations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  provider         text not null,
  access_token     text not null,
  refresh_token    text not null,
  token_expires_at timestamptz not null,
  calendar_id      text not null default 'primary',
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(user_id, provider)
);
create trigger user_integrations_updated_at before update on user_integrations
  for each row execute procedure set_updated_at();

-- templates
create table if not exists templates (
  id               uuid primary key default gen_random_uuid(),
  author_user_id   uuid not null references users(id) on delete cascade,
  name             text not null,
  description      text not null default '',
  is_public        boolean not null default false,
  version          integer not null default 1,
  forked_from_id   uuid references templates(id),
  config_snapshot  jsonb not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger templates_updated_at before update on templates
  for each row execute procedure set_updated_at();
