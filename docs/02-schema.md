# Data Schema

Complete normalised schema for the An Organised Life system. Implemented in Supabase
(PostgreSQL). All tables use UUID primary keys. Foreign keys are enforced by
Postgres. Row-level security (RLS) is enabled on all tables — users can only
read and write their own rows via `user_id = auth.uid()`.

**Supabase Auth integration:** `users.id` is the Supabase Auth UID. The `users`
table is created on first sign-in. All other tables reference `users.id` as
`user_id`. IndexedDB (Dexie.js) mirrors this schema locally as an offline cache.

First principles applied:
- Every fact stored once
- Derived values are computed, not stored (exceptions noted where caching
  is justified for performance)
- No hardcoded domain, habit, or goal data — everything is user-defined
- JSON blobs used only for genuinely variable/schema-less data (metadata,
  LLM conversations, config snapshots)

---

## users

The pet profile. One row per user.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text unique | |
| name | text | Real name |
| pet_name | text | Name the user gives their pet |
| level | integer | Current level — can drop. Default 1 |
| current_xp | integer | XP within current level — can drain. Default 0 |
| lifetime_xp | integer | All-time XP earned — never decreases |
| peak_level | integer | Historical best level |
| created_at | timestamp | |
| updated_at | timestamp | |

**Notes:**
- `daily_upkeep_cost` is derived from `level` using the upkeep curve — not stored
- `current_xp` drains when daily upkeep is not met via habit completion
- Level drops when `current_xp` reaches 0 (drops to previous level's max XP)

---

## stats

User-defined life domains. The 7 defaults are seeded from the user's template
at onboarding but can be added, edited, or removed.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| name | text | e.g. "Body", "Faith" |
| color | text | Hex colour for UI |
| icon | text | Icon identifier |
| description | text nullable | |
| current_value | float | 0–100 condition score. Default 50 |
| decay_grace_days | integer | Days before decay starts. Default 1 |
| decay_rate | float | Points per day after grace period. Default 1.0 |
| sequence_order | integer | Display order |
| is_active | boolean | Default true |
| created_at | timestamp | |

**Notes:**
- `current_value` decays when no habits feeding this stat are completed
- Decay escalates: day 2 = base rate, day 3 = 1.2x, day 4+ = 1.5x
- Decay has a floor of 1 — stats never reach zero
- Weekly habits have a 7-day grace period before decay starts

---

## habits

Checklist items. Fully user-defined. Never hardcoded.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| name | text | e.g. "Weigh myself" |
| description | text nullable | |
| frequency | enum | daily / weekly / monthly |
| time_block | enum | morning / afternoon / evening / anytime |
| sequence_order | integer | Within time block — enforces habit stacking |
| completion_type | enum | boolean / numeric / categorical / scale / time_range / text / composite |
| completion_config | JSON nullable | Options for categorical/scale; units for numeric |
| xp_min | integer | Minimum XP on completion |
| xp_max | integer | Maximum XP on completion (variable reward) |
| loot_drop_eligible | boolean | Default true |
| is_active | boolean | Default true |
| created_at | timestamp | |

**completion_config examples:**
```json
// categorical
{ "options": ["Cardio", "Upper + Core", "Lower + Core"] }

// scale
{ "options": ["Easy", "Medium", "Hard"], "xp_weights": [1.0, 1.3, 1.6] }

// numeric
{ "unit": "kg", "min": 0, "max": 300 }

// time_range
{ "unit": "hhmm" }
```

---

## habit_stat_weights

Junction table. Each habit feeds one or more stats with dynamic weights.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| habit_id | uuid FK habits | |
| stat_id | uuid FK stats | |
| base_weight | float | Starting potency (between min and max) |
| min_weight | float | Floor — habit never becomes worthless |
| max_weight | float | Ceiling — diminishing returns |
| current_weight | float | Cached — updated on each log + daily job |
| growth_rate | float | Per completed day toward max (e.g. 0.12) |
| decay_rate | float | Per missed day toward min (e.g. 0.06) |

**Weight update formula:**
```
On completion: current = min(max, current + growth_rate * (max - current))
On miss:       current = max(min, current - decay_rate * (current - min))
```

Growth rate is always greater than decay rate by design (Principle 3).

---

## habit_streaks

Streak tracking per habit. One row per habit per user.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| habit_id | uuid FK habits | |
| user_id | uuid FK users | |
| current_streak | integer | Consecutive completions. Default 0 |
| best_streak | integer | Historical best. Default 0 |
| last_completed_date | date nullable | Used to compute streak breaks |

---

## habit_maturity

Tracks which stage of habit formation each habit is at per user.
Based on Lally (2010) — average 66 days to automaticity.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| habit_id | uuid FK habits | |
| user_id | uuid FK users | |
| stage | enum | fragile / building / established / mastered |
| consistent_days | integer | Cumulative days — survives minor breaks |
| last_stage_changed_at | timestamp | |

**Stage thresholds and effects:**

| Stage | Days | XP multiplier | Loot drop rate |
|---|---|---|---|
| Fragile | 0–21 | 1.0x | 30% |
| Building | 22–65 | 1.3x | 20% |
| Established | 66–89 | 1.6x | 12% |
| Mastered | 90+ | 2.0x | 8% |

Consistent_days decays with neglect but does not reset to zero.

---

## habit_logs

One row per habit completion. The core event record.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| habit_id | uuid FK habits | |
| user_id | uuid FK users | |
| completed_at | timestamp | |
| completion_value | text | The core answer (e.g. "83.4", "Hard", "true") |
| sequence_multiplier | float | 1.0 if in sequence, 0.5 if out of sequence |
| xp_base | integer | Random value between xp_min and xp_max |
| xp_final | integer | After all multipliers applied |
| loot_drop_id | uuid nullable FK loot_drops | |
| llm_prompt_shown | boolean | Default false |
| llm_response | text nullable | User's response to LLM follow-up |
| bonus_xp_awarded | integer nullable | From LLM response |
| notes | text nullable | |
| metadata | JSON nullable | Progressive complexity (heart rate, distance, etc.) |

**XP formula:**
```
xp_base       = random(habit.xp_min, habit.xp_max)
xp_final      = xp_base
              * habit_stat_weights.current_weight   (habit fitness)
              * sequence_multiplier                 (0.5 if out of order)
              * maturity_xp_multiplier              (from habit_maturity.stage)
```

---

## goals

Long-term commitments. Must pass through scratch pad and interrogation.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| name | text | |
| why | text | Mandatory. Displayed daily. |
| primary_stat_id | uuid FK stats | |
| status | enum | scratch_pad / committed / active / paused / completed / archived |
| stake_type | enum | in_game / personal_forfeit / accountability |
| stake_description | text nullable | Written by user for personal_forfeit |
| commitment_score | integer nullable | 1–10. Must be 7+ to commit |
| committed_at | timestamp nullable | Null until interrogation complete |
| target_date | date nullable | |
| scratch_pad_expires_at | timestamp | created_at + 48h — auto-archives if unanswered |
| created_at | timestamp | |

**Status flow:**
```
scratch_pad -> (24h wait) -> (LLM interrogation, score >= 7) -> committed
committed   -> (user activates)                               -> active
active      ->                                                -> completed / paused / archived
```

Max 3 goals in `active` status at any time. Enforced in application logic.

---

## goal_metric_targets

Quantifiable success criteria for a goal.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| goal_id | uuid FK goals | |
| logbook_metric_id | uuid FK logbook_metrics | |
| start_value | float | Baseline recorded at commitment time |
| target_value | float | |
| target_revised_at | timestamp nullable | Set when target is updated |
| previous_target | float nullable | History preserved on revision |

---

## goal_milestones

Major waypoints within a goal.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| goal_id | uuid FK goals | |
| name | text | |
| description | text nullable | |
| sequence_order | integer | |
| target_date | date nullable | Synced to Google Calendar |
| completed_at | timestamp nullable | |

---

## goal_steps

Concrete actions under each milestone.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| milestone_id | uuid FK goal_milestones | |
| name | text | |
| sequence_order | integer | |
| completed_at | timestamp nullable | |

---

## goal_habit_links

Which habits support which goals.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| goal_id | uuid FK goals | |
| habit_id | uuid FK habits | |
| required_streak | integer nullable | For habit-sustained goal completion |

---

## tasks

Unified table for planned steps and ad-hoc captured tasks.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| name | text | |
| notes | text nullable | |
| goal_id | uuid nullable FK goals | |
| milestone_id | uuid nullable FK goal_milestones | |
| source | enum | planned / captured |
| goal_linked_at | timestamp nullable | When link was made (captured tasks only) |
| completed_at | timestamp nullable | |
| xp_awarded | integer nullable | |
| created_at | timestamp | |

**Derivable states:**
```
source=planned,  goal_id set,  goal_linked_at null -> pre-defined goal step
source=captured, goal_id set,  goal_linked_at set  -> ad-hoc, linked later
source=captured, goal_id null, goal_linked_at null -> pure ad-hoc, unlinked
```

---

## logbook_metrics

Definitions of hard metrics to track.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| name | text | e.g. "Weight", "Chin-ups", "Walk" |
| unit | text | kg / reps / minutes / hours / km |
| stat_id | uuid nullable FK stats | Which stat this informs |
| created_at | timestamp | |

---

## logbook_entries

Actual measurements. Primary value is always present. Additional detail
lives in the JSON metadata column (Principle 6 — progressive complexity).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| metric_id | uuid FK logbook_metrics | |
| user_id | uuid FK users | |
| value | float | Primary measurement — always required |
| logged_at | timestamp | |
| notes | text nullable | |
| metadata | JSON nullable | Heart rate, distance, time of day, etc. |

---

## scratch_pad_items

Raw ideas in quarantine before commitment.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| raw_idea | text | Unstructured — just the idea |
| status | enum | pending / interrogating / promoted / archived |
| created_at | timestamp | |
| interrogation_started_at | timestamp nullable | |
| interrogation_completed_at | timestamp nullable | |
| commitment_score | integer nullable | 1–10 |
| llm_conversation | JSON nullable | Full Q&A exchange |
| promoted_goal_id | uuid nullable FK goals | |
| auto_archive_at | timestamp | created_at + 48h |

---

## loot_drop_catalog

Definitions of possible reward types.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| type | enum | xp_surge / stat_boost / rested_bonus / fortune / habitat_upgrade |
| name | text | |
| description | text | |
| rarity | enum | common / uncommon / rare |
| min_level | integer | Only available from this pet level. Default 1 |
| payload | JSON | e.g. {"xp_bonus": 50} or {"stat_id": "...", "boost": 5} |

---

## loot_drops

Record of loot drops awarded to a user.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| catalog_id | uuid FK loot_drop_catalog | |
| habit_log_id | uuid nullable FK habit_logs | |
| awarded_at | timestamp | |
| acknowledged | boolean | Default false |

---

## xp_events

Audit trail for all XP changes. Used for history, review, and debugging.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| source_type | enum | habit / task / bonus / loot_drop / penalty / upkeep_drain |
| source_id | uuid nullable | FK to the source entity |
| amount | integer | Positive (earned) or negative (upkeep drain) |
| level_before | integer | |
| level_after | integer | |
| created_at | timestamp | |

---

## daily_plans

The morning planning ritual. One row per user per day.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| plan_date | date | |
| intentions | JSONB | `{ focus_goal_id: uuid\|null, ad_hoc: [{ text, linked_goal_id: uuid\|null }] }`. Default: `{"focus_goal_id": null, "ad_hoc": []}` |
| mood_start | integer nullable | 1–5 (morning emoji check-in) |
| mood_end | integer nullable | 1–5 (evening emoji check-in) |
| journal_entry | text nullable | Evening — 3 sentences max |
| created_at | timestamp | |
| completed_at | timestamp nullable | Set when evening check-in is done |

---

## sessions

Time tracking. One row per app session.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| started_at | timestamp | |
| ended_at | timestamp nullable | |
| duration_seconds | integer nullable | Computed on session close |
| primary_screen | text nullable | Which screen the user spent most time on |

---

## notification_schedules

Defines when and what to notify. Synced to Google Calendar.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| type | enum | time_block_reminder / streak_warning / upkeep_warning / goal_stale / scratch_pad_ready / weekly_review / level_drop_imminent |
| entity_type | text nullable | habit / goal / scratch_pad_item |
| entity_id | uuid nullable | |
| schedule_type | enum | recurring / triggered |
| recurrence_time | time nullable | Time of day for recurring |
| recurrence_days | JSON nullable | e.g. [1,2,3,4,5] for Mon–Fri |
| advance_notice_min | integer | Minutes before event. Default 10 |
| google_event_id | text nullable | For updating or deleting synced events |
| is_active | boolean | Default true |
| last_triggered_at | timestamp nullable | |
| created_at | timestamp | |

---

## notification_log

Record of every notification sent.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| schedule_id | uuid FK notification_schedules | |
| message | text | |
| sent_at | timestamp | |
| acknowledged_at | timestamp nullable | |
| action_taken | boolean nullable | Did the target behaviour occur after this notification? |

---

## user_integrations

OAuth tokens and integration state.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| provider | text | google_calendar |
| access_token | text | Encrypted at rest |
| refresh_token | text | Encrypted at rest |
| token_expires_at | timestamp | |
| calendar_id | text | Which calendar to write events to |
| last_synced_at | timestamp nullable | |
| created_at | timestamp | |

---

## templates

Exportable, forkable user configurations.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| author_user_id | uuid FK users | |
| name | text | |
| description | text | |
| is_public | boolean | Default false |
| version | integer | Default 1. Increment on significant change |
| forked_from_id | uuid nullable FK templates | |
| config_snapshot | JSON | Complete serialised config at export time |
| created_at | timestamp | |
| updated_at | timestamp | |

**config_snapshot contains:** all stats, habits, habit_stat_weights defaults,
logbook_metrics, notification_schedule defaults, loot_drop_catalog overrides.
It does not contain user data (logs, goals, tasks, XP).

---

## Offline Sync Tracking

All tables that can be modified offline include an `updated_at` timestamp
(updated automatically by Postgres trigger on every write). The local
IndexedDB cache stores a `synced_at` timestamp per record — the last time
the record was successfully pushed to Supabase.

**Conflict detection logic (session start):**
```
if local.updated_at > remote.updated_at → local is ahead (unsynced writes)
if remote.updated_at > local.updated_at → remote is ahead (another device wrote)
if both diverged                         → conflict — user must choose
```

A dedicated `sync_queue` table in IndexedDB (not in Supabase) tracks which
local records are pending upload. It is cleared when sync completes.

---

## Entity Relationship Summary

```
users
  |-- stats (1:many)
  |-- habits (1:many)
  |     |-- habit_stat_weights (many:many via stats)
  |     |-- habit_streaks (1:1 per user)
  |     |-- habit_maturity (1:1 per user)
  |     |-- habit_logs (1:many)
  |-- goals (1:many)
  |     |-- goal_metric_targets -> logbook_metrics
  |     |-- goal_milestones
  |     |     |-- goal_steps
  |     |-- goal_habit_links -> habits
  |-- tasks (1:many) -> goals (optional), goal_milestones (optional)
  |-- logbook_metrics (1:many)
  |     |-- logbook_entries (1:many)
  |-- scratch_pad_items (1:many) -> goals (on promotion)
  |-- loot_drops -> loot_drop_catalog
  |-- xp_events (1:many)
  |-- daily_plans (1:many)
  |-- sessions (1:many)
  |-- notification_schedules (1:many)
  |     |-- notification_log (1:many)
  |-- user_integrations (1:many)
  |-- templates (authored, 1:many)
```
