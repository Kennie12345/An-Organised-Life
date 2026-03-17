-- Migration: 002_rls
-- Enable Row Level Security on all tables.
-- Policy: user_id = auth.uid() for all operations.
-- See /docs/02-schema.md

-- Enable RLS
alter table users enable row level security;
alter table stats enable row level security;
alter table habits enable row level security;
alter table habit_stat_weights enable row level security;
alter table habit_streaks enable row level security;
alter table habit_maturity enable row level security;
alter table habit_logs enable row level security;
alter table goals enable row level security;
alter table goal_metric_targets enable row level security;
alter table goal_milestones enable row level security;
alter table goal_steps enable row level security;
alter table goal_habit_links enable row level security;
alter table tasks enable row level security;
alter table logbook_metrics enable row level security;
alter table logbook_entries enable row level security;
alter table scratch_pad_items enable row level security;
alter table loot_drop_catalog enable row level security;
alter table loot_drops enable row level security;
alter table xp_events enable row level security;
alter table daily_plans enable row level security;
alter table sessions enable row level security;
alter table notification_schedules enable row level security;
alter table notification_log enable row level security;
alter table user_integrations enable row level security;
alter table templates enable row level security;

-- RLS policies: users can only access their own rows

-- users
create policy "users: own row" on users
  for all using (id = auth.uid());

-- stats
create policy "stats: own rows" on stats
  for all using (user_id = auth.uid());

-- habits
create policy "habits: own rows" on habits
  for all using (user_id = auth.uid());

-- habit_stat_weights (access via habit ownership)
create policy "habit_stat_weights: own rows" on habit_stat_weights
  for all using (
    habit_id in (select id from habits where user_id = auth.uid())
  );

-- habit_streaks
create policy "habit_streaks: own rows" on habit_streaks
  for all using (user_id = auth.uid());

-- habit_maturity
create policy "habit_maturity: own rows" on habit_maturity
  for all using (user_id = auth.uid());

-- habit_logs
create policy "habit_logs: own rows" on habit_logs
  for all using (user_id = auth.uid());

-- goals
create policy "goals: own rows" on goals
  for all using (user_id = auth.uid());

-- goal_metric_targets (access via goal ownership)
create policy "goal_metric_targets: own rows" on goal_metric_targets
  for all using (
    goal_id in (select id from goals where user_id = auth.uid())
  );

-- goal_milestones (access via goal ownership)
create policy "goal_milestones: own rows" on goal_milestones
  for all using (
    goal_id in (select id from goals where user_id = auth.uid())
  );

-- goal_steps (access via milestone → goal ownership)
create policy "goal_steps: own rows" on goal_steps
  for all using (
    milestone_id in (
      select id from goal_milestones where goal_id in (
        select id from goals where user_id = auth.uid()
      )
    )
  );

-- goal_habit_links (access via goal ownership)
create policy "goal_habit_links: own rows" on goal_habit_links
  for all using (
    goal_id in (select id from goals where user_id = auth.uid())
  );

-- tasks
create policy "tasks: own rows" on tasks
  for all using (user_id = auth.uid());

-- logbook_metrics
create policy "logbook_metrics: own rows" on logbook_metrics
  for all using (user_id = auth.uid());

-- logbook_entries
create policy "logbook_entries: own rows" on logbook_entries
  for all using (user_id = auth.uid());

-- scratch_pad_items
create policy "scratch_pad_items: own rows" on scratch_pad_items
  for all using (user_id = auth.uid());

-- loot_drop_catalog: all authenticated users can read (shared seed data)
create policy "loot_drop_catalog: authenticated read" on loot_drop_catalog
  for select using (auth.role() = 'authenticated');

-- loot_drops
create policy "loot_drops: own rows" on loot_drops
  for all using (user_id = auth.uid());

-- xp_events
create policy "xp_events: own rows" on xp_events
  for all using (user_id = auth.uid());

-- daily_plans
create policy "daily_plans: own rows" on daily_plans
  for all using (user_id = auth.uid());

-- sessions
create policy "sessions: own rows" on sessions
  for all using (user_id = auth.uid());

-- notification_schedules
create policy "notification_schedules: own rows" on notification_schedules
  for all using (user_id = auth.uid());

-- notification_log
create policy "notification_log: own rows" on notification_log
  for all using (user_id = auth.uid());

-- user_integrations
create policy "user_integrations: own rows" on user_integrations
  for all using (user_id = auth.uid());

-- templates: own rows + public read
create policy "templates: own rows" on templates
  for all using (author_user_id = auth.uid());

create policy "templates: public read" on templates
  for select using (is_public = true);
