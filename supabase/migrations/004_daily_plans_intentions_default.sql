-- Update daily_plans.intentions default to match new structure.
-- Previously stored an array of free-text strings.
-- Now stores { focus_goal_id: uuid | null, ad_hoc: [{ text, linked_goal_id }] }.
-- Column type (jsonb) is unchanged — only the default value is updated.

alter table daily_plans
  alter column intentions set default '{"focus_goal_id": null, "ad_hoc": []}'::jsonb;
