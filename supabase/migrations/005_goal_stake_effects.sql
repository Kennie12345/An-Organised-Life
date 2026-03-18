-- Migration 005: Goal stake effects
-- Replaces stake_type/stake_description with stat-based consequences
-- Adds grace period to goals table

-- Remove old stake columns from goals
ALTER TABLE goals DROP COLUMN IF EXISTS stake_type;
ALTER TABLE goals DROP COLUMN IF EXISTS stake_description;

-- Add grace period columns
ALTER TABLE goals ADD COLUMN grace_period_value integer NOT NULL DEFAULT 3;
ALTER TABLE goals ADD COLUMN grace_period_unit text NOT NULL DEFAULT 'days'
  CHECK (grace_period_unit IN ('hours', 'days', 'weeks'));

-- Create goal_stake_effects table
CREATE TABLE goal_stake_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  stat_id uuid NOT NULL REFERENCES stats(id) ON DELETE CASCADE,
  effect_value integer NOT NULL,
  trigger text NOT NULL CHECK (trigger IN ('success', 'failure')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE TRIGGER set_updated_at_goal_stake_effects
  BEFORE UPDATE ON goal_stake_effects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE goal_stake_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goal stake effects"
  ON goal_stake_effects
  FOR ALL
  USING (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  )
  WITH CHECK (
    goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_goal_stake_effects_goal_id ON goal_stake_effects(goal_id);
