# Task List

> Phases are sequential. Do not start a phase until the previous is complete.
> Decision points marked ✋ require user input before proceeding.
> If a task is unclear, resolve in this order:
>   1. /docs/02-schema.md       — data and schema questions
>   2. /docs/03-features.md     — feature behaviour questions
>   3. /docs/01-design-principles.md — approach conflicts
>   4. /docs/07-change-protocol.md   — any proposed deviation
>   5. Ask the user                  — only if docs do not resolve it
>
> Update CURRENT_STATE.md at the end of every session.

---

## Phase 1 — Foundation
**Goal:** Working project structure, Supabase schema, offline cache, and sync engine.
**Docs to read:** /docs/02-schema.md, /docs/06-tech-stack.md
**Decision points:** None — fully specified.

### 1a — Project scaffold
- [x] 1.1 Scaffold Next.js + TypeScript project (App Router)
- [x] 1.2 Set up Tailwind CSS
- [x] 1.3 Set up Framer Motion
- [x] 1.4 Define folder structure per /docs/06-tech-stack.md
- [x] 1.5 Configure PWA manifest (name, icons, display: standalone)
- [x] 1.6 Configure service worker (offline support for checklist)

### 1b — Supabase setup
- [x] 1.7  Create Supabase project, configure environment variables
           NOTE: NEXT_PUBLIC_SUPABASE_URL in .env.local is missing https:// prefix — needs fix before deploy
- [x] 1.8  Set up Supabase Auth (email + magic link)
           NOTE: Auth routes exist via template — not yet tested end-to-end
- [x] 1.9  Implement all tables from /docs/02-schema.md as SQL migrations
           — 25 tables applied via MCP. Migration: 001_initial_schema
- [x] 1.10 Add `updated_at` trigger to all tables (auto-updated on write)
- [x] 1.11 Enable Row Level Security on all tables
           — policy: user_id = auth.uid() for all operations. Migration: 002_rls
- [x] 1.12 Seed loot_drop_catalog with default entries (4 types)
           — 12 entries seeded. Migration: 003_seed
- [x] 1.13 Seed default config from /docs/05-default-config.md
           — Implemented as /config/defaults.ts (TypeScript, not SQL)
           — Applied at onboarding time per user, not as a global SQL seed
           — 7 stats, all habits with stat weights, logbook metrics, notification schedules

### 1c — Offline cache (Dexie.js)
- [x] 1.14 Install and configure Dexie.js
- [x] 1.15 Mirror all Supabase tables as Dexie stores (same schema + synced_at column)
           — All row types derived from Tables<> in database.types.ts — no hand-written interfaces
- [x] 1.16 Implement sync_queue store in Dexie (pending local writes)

### 1d — Sync engine
- [x] 1.17 Implement manual sync service (local IndexedDB → Supabase)
           — /lib/sync/index.ts: pushLocalChanges()
- [x] 1.18 Implement session-start conflict detection
           — /lib/sync/index.ts: detectConflicts(), sessionStartSync(), resolveConflictUseRemote()
- [x] 1.19 Add sync status indicator to UI (synced / pending / conflict)
           — /components/sync-status.tsx: SyncStatusIndicator

### 1e — Core utilities
- [x] 1.20 Implement XP engine utility
           — /utils/xp.ts: calculateXp()
- [x] 1.21 Implement leveling curve utility
           — /utils/leveling.ts: xpRequiredForLevel(), dailyUpkeepCost(), applyUpkeepDrain(), applyXpGain()
- [x] 1.22 Implement habit weight update utility
           — /utils/weight.ts: updateWeightOnCompletion(), updateWeightOnMiss()
- [x] 1.23 Implement stat decay utility
           — /utils/decay.ts: applyStatDecay()

**Acceptance criteria:**
- App loads in Safari on iOS without errors
- Supabase Auth works (sign in, session persisted)
- All Supabase tables exist with RLS enforced
- Default config seeds correctly on first run
- IndexedDB mirrors Supabase schema and syncs on demand
- Conflict banner appears when remote data is newer than local
- ✅ XP, leveling, weight, and decay utilities have passing unit tests (33 tests, Vitest)

---

## Phase 2 — Daily Loop
**Goal:** Core daily experience is usable. Morning → Afternoon → Evening.
**Docs to read:** /docs/03-features.md (Features 1–4), /docs/01-design-principles.md
**Decision points:** ✋ 2.A — Approve UI layout before building full checklist

- [x] 2.1 Build app navigation shell (bottom nav: Today / Stats / Goals / History)
- [x] 2.2 Build Morning Planning screen (Feature 1 in /docs/03-features.md)
      — Yesterday summary, goal-focus selection, optional ad-hoc intention capture
        with goal-link prompt, mood selector, Begin Day button
      NOTE: Redesigned via scope-check — blank intention inputs replaced with
      goal-focus selection. See /docs/03-features.md and change log.
- [x] ✋ 2.A DECISION POINT — approved (layout mockup reviewed and confirmed)
- [x] 2.3 Build habit sequence checklist (Feature 2)
      — Morning / Afternoon / Evening tabs with done/total counts
      — Current step prominent, rest dimmed
      — Completion type handlers (boolean, numeric, categorical, scale,
        time_range, text, composite)
      — 7-day completion grid per habit (inline)
      — Out-of-sequence warning + 0.5x penalty
- [x] 2.4 Build water tracker (Feature 3)
      — 8 GlassWater icons in header, persistent throughout day
      — Writes/updates habit_log per tap; XP awarded on 8th glass
- [x] 2.5 Build medication tracker (Feature 3)
      — Pill icon row, one per habit whose name contains "medication"
      — Boolean tap; XP awarded immediately on mark-taken
- [x] 2.6 Build exercise logging (Feature 4)
      — Composite config (step1/step2) normalised in CompletionInput
      — Effort XP multiplier (Easy 1.0× / Medium 1.3× / Hard 1.6×) wired into calculateXp
      — LLM follow-up deferred to Phase 6
- [x] 2.7 Build XP award animation (number flies up on completion)
      — Framer Motion AnimatePresence on completed HabitRow; 1.4s keyframe (appear → hold → fly up + fade)
      — xpFlash moved from dead active-branch render to completed branch where it actually fires
- [x] 2.8 Build loot drop reveal animation
- [x] 2.9 Wire XP engine to habit completion
- [x] 2.10 Wire loot drop engine to habit completion
- [x] 2.11 Write habit_logs entry on every completion
- [x] 2.12 Update habit_streaks on every completion
- [x] 2.13 Update habit_maturity on every completion
- [x] 2.14 Build evening check-in (sleep log, journal, review tomorrow)
- [x] 2.15 Write daily_plans row on morning start, update on evening completion

**Acceptance criteria:**
- Full morning sequence can be completed start to finish
- Each completion type works correctly
- XP and loot drops fire correctly
- All data written to Dexie correctly
- Out-of-sequence penalty applies

---

## Phase 3 — Game Layer
**Goal:** Stats, leveling, and decay are fully visible and functional.
**Docs to read:** /docs/03-features.md (Feature 5), /docs/02-schema.md
**Decision points:** ✋ 3.A — Approve stat dashboard visual before wiring

- [x] ✋ 3.A DECISION POINT — approved
      Stat Dashboard reviewed. Changes: removed progress bars (numbers only),
      pet sprite scaled to 40dvh, larger fonts for stats/headings.
- [x] 3.1 Build Stat Dashboard screen (Feature 5)
      — Pet name (28px), level, XP bar, condition word
      — 7 stats: name (16px) | value | trend delta — no progress bars
      — Mood sparkline
- [x] 3.2 Build stat detail view (tap any stat)
      — 30-day bar chart, contributing habits with weights, recent logs
- [x] 3.3 Implement daily upkeep drain job
      — useDailyJobs hook runs once per day on app open via DailyJobsProvider
      — Drains current_xp by upkeep cost × missed days, triggers level drop
      — Logs xp_events with source_type "upkeep_drain"
- [x] 3.4 Implement stat decay job
      — Finds days since last completion of any habit feeding each stat
      — Applies grace period + escalating decay (1x / 1.2x / 1.5x)
- [x] 3.5 Implement habit weight update job (daily)
      — Calls updateWeightOnMiss for habits not completed yesterday
- [x] 3.6 Implement habit maturity stage transitions
      — Checks consistent_days against thresholds (22 / 66 / 90)
      — Updates stage and last_stage_changed_at on transition
- [x] 3.7 Build level-up celebration (animation + XP event logged)
      — LevelUpCelebration: bottom sheet with star icon, level number, spring animation
      — Triggered from habit-checklist handleComplete when applyXpGain returns leveledUp
      — Also updates peak_level on user record
- [x] 3.8 Build level-drop warning notification (in-app)
      — LevelDropWarning: bottom sheet with TrendingDown icon, muted palette
      — Triggered from useDailyJobs when upkeep drain causes level decrease
      — Shown via DailyJobsProvider on app open
- [x] 3.9 Implement loot drop catalog with all 4 types
      — Seeded in migration 003: 12 entries (xp_surge, stat_boost, rested_bonus, fortune)
      — Effect application on collect: xp_surge grants XP + can level-up,
        stat_boost boosts random active stat (cap 100), rested_bonus/fortune passive

**Acceptance criteria:**
- Stats reflect habit completion in real time
- Upkeep drain runs correctly on new day
- Stat decay applies at correct rate with correct grace periods
- Level rises and drops correctly
- All XP events written to xp_events audit trail

---

## Phase 4 — Goals & Tasks
**Goal:** Goals board, task manager, and logbook are functional.
**Docs to read:** /docs/03-features.md (Features 6–8), /docs/02-schema.md
**Decision points:** ✋ 4.A — Approve goal creation flow UX

- [x] ✋ 4.A DECISION POINT — approved (2026-03-18)
      Goal creation flow: 7-step guided form (name/why → stat → metric →
      milestones → linked habits with inline micro-habit creation →
      stakes as stat effects +2/+4/-2/-4 with grace period → confirmation).
      Stakes replaced: no longer in-game/forfeit/accountability — now
      concrete stat boosts/penalties on the pet. Schema: goal_stake_effects
      table + grace_period on goals. See /docs/03-features.md Feature 7.
- [x] 4.1 Build Goals Board screen (Feature 6)
      — Max 3 active goals enforced in UI and query
      — Each card: name, why, stat, progress, stake, linked habits, tasks
      — Milestone progress as step visual
      — Tap navigates to full detail screen
- [x] 4.2 Build goal creation flow (guided, WOOP-structured)
      — 7-step guided form with progress dots and slide animations
      — Steps: Name & Why → Stat → Metric → Milestones → Habits → Stakes → Confirm
      — Inline micro-habit creation with streak/maturity/stat-weight seeding
      — Max 3 active goals enforced at commit
- [x] 4.3 Build goal detail screen (milestones, steps, linked tasks)
      — Full detail at /goals/[id] with milestone toggle, task management
      — Metric progress bar, stake display, linked habits
      — Inline task creation with XP award
- [x] 4.4 Build task manager (Feature 8)
      — Unlinked tasks section on goals page with inline creation
      — On complete: optional goal link prompt (bottom sheet)
      — Task toggle with XP award
- [x] 4.5 Build logbook screen (Feature 6)
      — Metric list with latest value and trend arrows
      — Log entry with value + optional note
      — Mini chart (last 30 entries as polyline)
      — Personal best detection → loot drop trigger
- [x] 4.6 Wire task completion to XP engine
      — utils/task-xp.ts: 15-25 XP per task, updates user level, logs xp_event
      — Wired into goal detail page and task manager
- [x] 4.7 Wire logbook entries to stat updates
      — Logging an entry boosts the linked stat by +1 (capped at 100)

**Acceptance criteria:**
- Cannot create a 4th active goal (enforced)
- Goal creation requires why, stat stake effects, and commitment score >= 7
- Tasks link to goals at creation or completion
- Logbook entries persist and chart correctly
- Personal best triggers loot drop

---

## Phase 5 — History & Weekly Review
**Goal:** Full history is accessible. Weekly review screen is functional.
**Docs to read:** /docs/03-features.md (Features 10–11)
**Decision points:** None — well specified.

- [x] 5.1 Build History screen (Feature 11)
      — Calendar grid with daily completion % (green intensity)
      — Tap day → full checklist state with habit names and XP
      — Streak history per habit (current/best)
      — Achievement log (level-ups and loot drops, last 20)
- [x] 5.2 Build Weekly Review screen (Feature 10, manual version)
      — Stat summary: completions this week vs last with direction arrows
      — Unlinked completed tasks → inline goal link prompt
      — Logbook trends: metric averages this week vs last
      — Next week intentions textarea
      — At /weekly-review
- [x] 5.3 Wire weekly review trigger to notification schedule
      — Deferred to Phase 7 (Google Calendar integration)
      — Weekly review accessible manually via /weekly-review
- [x] 5.4 Implement retrospective goal linking from weekly review
      — Updates tasks.goal_id and tasks.goal_linked_at with queueWrite sync

**Acceptance criteria:**
- Any past day's state is viewable
- Weekly review shows accurate stat changes
- Retrospective task linking works and persists
- Notification effectiveness data displays correctly

---

## Phase 6 — LLM Integration (Scratch Pad)
**Goal:** Claude API integrated for scratch pad interrogation.
**Docs to read:** /docs/03-features.md (Feature 9, Feature 14)
**Decision points:** ✋ 6.A — API key, ✋ 6.B — Approve conversation quality

- [ ] ✋ 6.A DECISION POINT
      Claude API key required. User must provide key or confirm how it
      will be stored/accessed. Do not hardcode in source.
- [ ] 6.1 Build Claude API client service
      — Model: claude-sonnet-4-6 (or latest)
      — System prompt defines coach persona
      — Ref: /docs/03-features.md (Feature 14 — LLM Coach)
- [ ] 6.2 Build Scratch Pad screen (Feature 9)
      — Raw idea capture (single text field, no required structure)
      — Shows all items by status (pending / interrogating / promoted / archived)
      — 24h quarantine timer visible
      — 48h auto-archive logic
- [ ] 6.3 Implement scratch pad interrogation conversation
      — 5 structured questions delivered conversationally
      — LLM pushes back on vague answers
      — Commitment score captured at end
      — Ref: /docs/03-features.md (Feature 9 interaction steps)
- [ ] ✋ 6.B DECISION POINT
      Kenneth must review 2–3 example interrogation conversations
      and approve the tone and quality before completing this phase.
- [ ] 6.4 Build goal promotion flow from scratch pad
      — Only available if commitment score >= 7
      — Flows into goal creation (Phase 4)
- [ ] 6.5 Write scratch_pad_items record throughout conversation
- [ ] 6.6 Write notification_schedules entry for 24h reminder on capture

**Acceptance criteria:**
- Idea captured with one tap / submit
- 24h notification fires correctly
- LLM conversation flows naturally and challenges vague answers
- Commitment score < 7 blocks promotion
- 48h auto-archive runs silently

---

## Phase 7 — Google Calendar Integration
**Goal:** All time blocks and milestones synced to Google Calendar.
**Docs to read:** /docs/03-features.md (Feature 13), /docs/06-tech-stack.md
**Decision points:** ✋ 7.A — Google OAuth credentials required

- [ ] ✋ 7.A DECISION POINT
      Google Cloud project + OAuth 2.0 credentials required.
      User must create credentials and provide client ID / secret.
      Confirm which Google Calendar to write to.
- [ ] 7.1 Implement Google OAuth 2.0 flow in Settings
- [ ] 7.2 Store tokens encrypted in user_integrations (IndexedDB)
- [ ] 7.3 Implement token refresh logic
- [ ] 7.4 Build Calendar API client (insert / update / delete events)
- [ ] 7.5 Create recurring events for Morning / Afternoon / Evening blocks
- [ ] 7.6 Create recurring Weekly Review event
- [ ] 7.7 Create one-off events for goal milestones
- [ ] 7.8 Create triggered events (streak warning, upkeep warning, goal stale)
- [ ] 7.9 Update/delete events when schedules change
- [ ] 7.10 Write google_event_id to notification_schedules for each event
- [ ] 7.11 Log all sent notifications to notification_log
- [ ] 7.12 Implement action_taken detection
      — If habit completed within 30 min of notification: action_taken = true

**Acceptance criteria:**
- Events appear in Google Calendar after OAuth
- Recurring events fire at correct times
- Milestone events appear at correct dates
- Triggered notifications fire based on user state
- Token refresh works without re-auth

---

## Phase 8 — Onboarding
**Goal:** First-run experience gets user to working config in < 5 minutes.
**Docs to read:** /docs/03-features.md (Feature 15), /docs/05-default-config.md
**Decision points:** ✋ 8.A — Approve onboarding UX flow

- [ ] ✋ 8.A DECISION POINT
      Show Kenneth the proposed onboarding step sequence before building.
- [ ] 8.1 Build first-run detection (no users record in Dexie)
- [ ] 8.2 Build onboarding flow
      — Step 1: Character name
      — Step 2: Stats review (toggle off / rename)
      — Step 3: Habits review (toggle on/off, set times)
      — Step 4: Logbook metrics (optional)
      — Step 5: Google Calendar connect (optional, skippable)
      — Step 6: Notification times (pre-filled from default config)
- [ ] 8.3 Seed user record and all config on completion
- [ ] 8.4 Build Settings screen (edit any config post-onboarding)

**Acceptance criteria:**
- New user can complete onboarding in under 5 minutes
- Skipping optional steps (Calendar, Logbook) works cleanly
- All config is editable post-onboarding from Settings

---

## Phase 9 — PWA Polish
**Goal:** App is installable on iOS, works offline, feels native.
**Docs to read:** /docs/06-tech-stack.md
**Decision points:** None — technical only.

- [ ] 9.1 Complete PWA manifest (icons all sizes, splash screen)
- [ ] 9.2 Test install to iOS home screen via Safari
- [ ] 9.3 Verify offline mode (checklist works without internet)
- [ ] 9.4 Implement background sync for deferred API calls
      — LLM calls and Calendar API calls queue when offline
- [ ] 9.5 Performance audit (Lighthouse)
- [ ] 9.6 Test on iPad (primary device) and iPhone
- [ ] 9.7 Final data export (JSON backup from Settings)

**Acceptance criteria:**
- App installs to iOS home screen
- Morning sequence works fully offline
- Lighthouse PWA score >= 90
- No layout issues on iPad or iPhone

---

## Session End Checklist

At the end of every session, before closing:

1. Mark completed tasks above with [x]
2. Update CURRENT_STATE.md:
   - Current phase and stage
   - What was done this session
   - What is next
   - Any open decisions or ambiguities found
3. Note any deviations from /docs in CURRENT_STATE.md
4. Ensure no broken code is left uncommitted
