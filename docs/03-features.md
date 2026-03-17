# Feature Specifications

Each feature is described with its purpose, the screen it lives on, its
interaction design, and its behavioural science rationale.

---

## 1. Morning Planning Ritual

**Screen:** Opens automatically on first daily app launch.

**Purpose:** Creates a daily anchor. Forces brief intentional planning before
the day begins. Replaces the impulse to jump directly into reactive work.

**Interaction:**
1. User sees yesterday's summary (tasks completed, XP earned, stat changes)
2. User sets 3 intentions for today (free text, optional LLM prompt if stuck)
3. User selects morning mood (1–5 emoji scale)
4. User taps "Begin Day" — morning sequence checklist opens

**Behavioural science:** Implementation intentions. The act of stating what
you will do today significantly increases follow-through (Gollwitzer, 1999).

**Data written:** daily_plans row created with plan_date, intentions, mood_start.

---

## 2. Habit Sequence Checklist

**Screen:** Primary daily screen. Divided into Morning / Afternoon / Evening tabs.

**Purpose:** Replaces the flat checklist. Shows habits in enforced sequence.
Completing one step reveals and highlights the next.

**Interaction:**
- Current step is prominently shown. Remaining steps are dimmed below it.
- Tap to complete. Completion type determines what happens:
  - Boolean: single tap
  - Numeric: number input (e.g. weight in kg)
  - Categorical: option buttons (e.g. Cardio / Upper+Core / Lower+Core)
  - Scale: option buttons (Easy / Medium / Hard)
  - Time range: start/end time pickers
  - Text: text field (bible verse, gratitude, journal)
- On completion: XP awarded immediately (animated, visible number)
- Loot drop check fires — if triggered, reward shown with animation
- Optional LLM follow-up appears below the reward (dismissible)
- Each habit shows a 7-day completion grid (Mon–Sun) inline

**Out-of-sequence behaviour:**
- If a user skips to a later habit, a warning appears: "You'll earn 50% XP
  out of sequence. Complete your foundation first for full rewards."
- User can proceed — the penalty is soft, not a hard block

**Behavioural science:** Habit stacking (BJ Fogg). Sequence reduces decision
fatigue — the user never chooses what to do next.

**Data written:** habit_logs, habit_streaks (updated), habit_maturity (updated),
xp_events, loot_drops (if triggered).

---

## 3. Water & Medication Tracker

**Screen:** Embedded in the morning checklist. Persistent in the header
throughout the day.

**Purpose:** Visual icon-style tracking for discrete daily targets.

**Interaction:**
- Water: row of 8 glass icons. Tap each to fill it. Target: 8 glasses / 2L.
- Medication: row of pill icons (one per medication). Tap to mark taken.
- Both visible in the header throughout the day as persistent progress.

**Data written:** habit_logs with completion_type=numeric (water count) or
completion_type=boolean (medication).

---

## 4. Exercise Logging

**Screen:** Within the morning checklist as a composite habit step.

**Purpose:** Captures exercise type, effort level, and optionally richer data.
Rewards consistency over time and effort in the moment.

**Interaction:**
1. Select exercise type: [Cardio] [Upper + Core] [Lower + Core]
2. Select effort: [Easy] [Medium] [Hard]
3. XP awarded immediately (Hard = higher xp_weight)
4. Loot drop check fires
5. Optional LLM follow-up: "Tell me more about today's session" (dismissible)
   — answering gives bonus XP and populates metadata for weekly review

**Richer data over time (progressive complexity):**
- Month 1: type + effort only
- Month 3+: duration added
- Month 6+: heart rate, distance (prompted optionally)

**Data written:** habit_logs with completion_type=composite,
completion_value="Upper + Core|Hard", metadata grows over time.

---

## 5. Stat Dashboard

**Screen:** Character view (secondary screen, tab or swipe from checklist).

**Purpose:** Visual feedback on all 7 life domains. Numbers visible (Principle 6
does not apply here — the user explicitly wants numbers).

**Interaction:**
- Each stat shown as: Name | current_value/100 | progress bar | trend arrow
- Tap any stat to see: 30-day chart, contributing habits, recent logs
- Character level shown prominently at top with XP bar
- Mood history visible as a small sparkline

**Behavioural science:** Visible progress is a core motivator. Numbers make
the cost of neglect legible across domains (Principle 2).

---

## 6. Logbook

**Screen:** Accessible from stat detail view or main nav.

**Purpose:** Tracks hard metrics (weight, chin-ups, etc.) separate from
gamified stats. The ground truth that goal_metric_targets point at.

**Interaction:**
- List of user-defined metrics with latest value and trend
- Tap any metric to log a new entry (primary value always, metadata optional)
- Chart shows value over time
- Personal bests trigger a loot drop

**Data written:** logbook_entries. If a new best is recorded, a loot_drop
is generated.

---

## 7. Goals Board

**Screen:** Accessible from main nav.

**Purpose:** Shows active goals, their progress, and linked habits/tasks.
Surfaces the "why" prominently. Maximum 3 active goals enforced.

**Interaction:**
- Each goal card shows: name, why, primary stat, progress (metric or milestone),
  stake, linked habits, and linked tasks
- Milestone progress shown as a step-by-step visual
- Tapping a goal opens full detail with task management
- "Add Goal" button goes to Scratch Pad first, not goal creation directly

**Behavioural science:** Commitment devices. Seeing the stake alongside the
goal daily is a persistent reminder of the cost of failure.

---

## 8. Task Manager (Work Tasks)

**Screen:** Within Goals Board and as a standalone view.

**Purpose:** Simple to-do list with goal linkage. Captures both planned steps
and ad-hoc work. Meaning assigned at or after completion.

**Interaction:**
- Tasks grouped by linked goal, then unlinked tasks below
- Tap [+] to add a task — name only required (goal link optional)
- On completion: prompt appears "Does this contribute to a goal?" (dismissible)
- Completed unlinked tasks surface at weekly review for retrospective linking

**LLM role:** At weekly review, LLM suggests goal links for unlinked completed
tasks based on patterns.

**Data written:** tasks. On completion, completed_at set, xp_awarded set,
goal_linked_at set if linked at completion.

---

## 9. Scratch Pad

**Screen:** Accessible from main nav and from Goals Board "Add Goal" button.

**Purpose:** Quarantine area for new ideas. Prevents impulsive goal commitment.
The ONLY screen where LLM interrogation is a gate (by design).

**Interaction:**
1. User dumps raw idea — unstructured text, no fields required
2. A calendar reminder is created for 24 hours from now
3. After 24 hours, status changes to "interrogating" and a notification fires
4. User opens scratch pad item — LLM conducts conversational interrogation:
   - "Why do you want this — what's the real reason?"
   - "Which of your 3 active goals does this compete with?"
   - "What would you need to pause or drop to take this on?"
   - "Rate your commitment 1–10. Why not lower?"
   - "What is the single first action you'd take in the next 48 hours?"
5. LLM pushes back on vague answers
6. Commitment score set. If >= 7, user can promote to goal creation
7. If not answered within 48h total: auto-archived silently. No guilt.

**Behavioural science:** Commitment devices + cooling-off period. The 24h wait
is evidence-based — impulsive decisions are significantly less persistent than
decisions made after reflection. The LLM's role is to distinguish genuine
commitment from ADHD novelty-seeking.

**Data written:** scratch_pad_items, notification_schedules (24h reminder),
goals (on promotion).

---

## 10. Weekly Review

**Screen:** Triggered by notification. Accessible manually from main nav.

**Purpose:** Meta-cognitive reflection. The session where the LLM adds the
most value. Surfaces hidden progress and patterns. Closes the week.

**Interaction:**
1. LLM opens with a summary: "Here's your week..."
2. Stat changes shown (rises and drops) with contributing habits
3. LLM surfaces patterns: "You've missed Faith 4/7 days. What's going on?"
4. Unlinked completed tasks presented: "Did any of these contribute to a goal?"
5. Logbook trends reviewed
6. Notification effectiveness: "You ignored your evening reminders 5/7 days.
   Should we change the time?"
7. Scratch pad items reviewed: any surviving 7-day ideas?
8. User sets intentions for next week

**Behavioural science:** Implementation intentions for the week. Retrospective
meaning-making. Self-monitoring is one of the most replicated behaviour change
techniques.

**Data written:** daily_plans (weekly intention), tasks (retrospective linking),
notification_schedules (if adjusted), scratch_pad_items (if archived).

---

## 11. History View

**Screen:** Accessible from main nav.

**Purpose:** Replaces the PDF's missing memory. All past data is visible and
navigable. The user can see what they achieved in any past week.

**Interaction:**
- Calendar grid: each day shows a completion percentage (habits done / total)
- Tap any day to see that day's full checklist state
- Week-over-week stat level chart
- Achievement log (level ups, personal bests, loot drops)
- Streak history per habit

---

## 12. Kingdom View (Optional)

**Screen:** Accessible from character screen.

**Purpose:** Visual representation of the character's overall state. Reflects
stat levels as a text-described world. Low maintenance — updates automatically.

**Interaction:**
- 7 areas of a simple kingdom, one per stat
- Each area described in 1–2 sentences based on current_value
  - Above 75: thriving description
  - 50–75: stable description
  - 25–50: struggling description
  - Below 25: falling apart description
- No input required from user — read-only view

---

## 13. Google Calendar Integration

**Screen:** Settings. Events appear in Google Calendar automatically.

**Purpose:** Time anchors for habit blocks and goal milestones. Passive social
accountability. External reminders for ADHD time blindness.

**What gets synced:**
- Morning sequence: recurring event at user-set time (e.g. 7:00am, Mon–Sun)
- Afternoon block: recurring event (e.g. 12:00pm)
- Evening block: recurring event (e.g. 9:00pm)
- Goal milestones: one-off events at target_date
- Weekly review: recurring event at user-set day/time
- Triggered alerts (streak at risk, upkeep warning): one-off events

**Interaction:**
- User connects Google account via OAuth in Settings
- Selects which calendar to write to
- Sets preferred times for each block
- Events created/updated automatically when schedules change

---

## 14. LLM Coach (Claude API)

**Not a screen** — embedded throughout the app as a layer.

**Role and access points:**

| Access point | What LLM does | Blocking? |
|---|---|---|
| After habit completion | Optional follow-up for bonus XP | No |
| Scratch pad interrogation | Structured 5-question interview | Yes (intentional) |
| Morning planning | Prompts if user is stuck on intentions | No |
| Weekly review | Synthesises week, surfaces patterns | No |
| Goal stagnation | Surfaces stake, asks if still committed | Soft prompt |
| Task retrospective | Suggests goal links for unlinked tasks | No |
| Logbook trends | "Your weight has been flat 3 weeks — what's changed?" | No |

**Data used by LLM:** habit_logs, daily_plans (journal), goals, tasks,
logbook_entries, notification_log (action_taken).

**API:** Claude API (claude-sonnet-4-6 or newer). Calls are made server-side
if a backend exists, or directly from the client with appropriate key handling.

---

## 15. Onboarding / Template System

**Screen:** First-time setup flow.

**Purpose:** Gets the user to a working configuration without overwhelming them.
Makes the system reusable and shareable.

**Interaction:**
1. User picks a template or starts blank
2. Reviews stats — toggle off any that don't apply, rename if needed
3. Reviews habits — toggle on/off, set preferred times
4. Sets logbook metrics (optional at this stage)
5. Connects Google Calendar (optional at this stage)
6. Begins — daily checklist is immediately usable

**Template export:**
- Settings > Export Template
- Generates a JSON file or shareable link
- Other users can import and fork it
- Forked templates track their origin (forked_from_id)
