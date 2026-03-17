# Design Principles

These 8 principles are the constitution of the system. Every feature, schema
decision, and UX choice must be consistent with them. When a proposed change
conflicts with a principle, the principle wins unless there is a compelling,
evidence-based reason to revise it.

See 07-change-protocol.md for how to challenge a principle.

---

## Principle 1 — Quality data capture via LLM is an optional benefit, never a gate to reward

The reward is for the behaviour. The LLM is for understanding the behaviour
better over time. These are two separate things and must never be coupled.

**What this means in practice:**
- Completing a habit triggers XP and loot drop check immediately
- LLM follow-up questions appear after the reward, not before
- Answering LLM questions yields bonus XP — it is incentivised, not required
- If a user dismisses the LLM prompt, nothing is lost and no guilt is implied
- The ONLY exception: the Scratch Pad. LLM interrogation is intentionally a
  gate there because friction is the point.

**Why:** Delayed or conditional rewards break the habit loop. Any friction at
the moment of completion risks abandonment — particularly for users who
struggle with task initiation or reward sensitivity.

---

## Principle 2 — A habit's full value is only earned in sequence

Habits are ordered within time blocks (morning / afternoon / evening). The
cross-stat weights make the cost of skipping visible, not just felt.

**What this means in practice:**
- Habits have a sequence_order within their time block
- Completing a habit out of sequence applies a 0.5x XP multiplier (soft penalty)
- Work tasks completed before the morning sequence is done yield 50% XP
- A banner surfaces incomplete foundational habits when work tasks are accessed
- The sequence is user-configurable — the enforcement is not

**Why:** People commonly skip foundational routines (hygiene, prayer,
medication) by jumping to exciting tasks. Sequence enforcement makes the cost
of this pattern legible without hard-blocking the user.

---

## Principle 3 — Habit potency is earned through consistency and erodes through neglect

Each habit has a dynamic weight per stat it feeds. The weight grows with
consecutive days of completion and decays with neglect, within a min/max range.

**What this means in practice:**
- Growth rate is always greater than decay rate (building is faster than losing)
- Decay has a floor (min_weight) — a habit never becomes worthless
- Short breaks do not collapse potency — sustained neglect erodes it gradually
- Recovery after neglect is faster than original acquisition
- The weight is per habit-stat pair, not per habit alone

**Why:** Mirrors neuroplasticity and habit fitness. Consistent repetition
strengthens neural pathways. A few missed sessions do not erase this. Sustained
neglect does erode it, but the brain retains the pattern (spontaneous recovery).

---

## Principle 4 — Goal definition is a one-time cognitive investment

The more thoroughly a goal is defined upfront — targets, milestones, steps,
habits, stake — the lower the cognitive overhead at execution. The app
facilitates this depth at creation, not at execution.

**What this means in practice:**
- Goal creation is a guided, multi-step process (WOOP-structured)
- Every goal requires: name, why, primary stat, metric target or milestone,
  at least one linked habit, stake, and a commitment score of 7+/10
- The "why" is displayed daily alongside the goal — not buried in settings
- Milestones and steps are defined upfront, not added reactively
- Once committed, execution is just checking boxes — no planning required

**Why:** Implementation intentions (Gollwitzer, 1999) — specifying when,
where, and how dramatically increases follow-through. Front-loading cognitive
work preserves decision-making capacity for execution.

---

## Principle 5 — Capture is always low friction. Meaning is assigned retrospectively.

The app is a trusted capture system. Everything can be logged quickly and
without commitment. Tasks, ideas, and observations are enriched with meaning
later — at completion, at the weekly review, or by LLM pattern recognition.

**What this means in practice:**
- Ad-hoc tasks require only a name to create — no goal link required
- Scratch pad ideas require no structure — just the raw idea
- At task completion, the user is optionally prompted to link it to a goal
- Weekly review surfaces unlinked completed tasks for retrospective linking
- LLM suggests goal links based on patterns across the week

**Why:** GTD (David Allen) — when the brain trusts that everything is
captured, it stops burning working memory holding onto tasks. This reduces
background anxiety significantly. Retrospective meaning-making also reveals
hidden progress, recalibrating the user's self-narrative.

---

## Principle 6 — Start with minimum viable capture. Complexity is progressive.

The system begins with the simplest version of every data point. Additional
detail is available as the user is ready for it — never required upfront.

**What this means in practice:**
- Logbook entries always have one primary value (e.g. weight in kg)
- Additional metadata (time of day, heart rate, distance) is optional JSON
- The schema never requires migration to accommodate richer data
- UI surfaces only what is needed at the current stage of a user's engagement
- Features unlock progressively — not hidden, but not foregrounded either

**Why:** Over-engineering data capture requirements at the start creates
friction that causes abandonment. The system should grow with the user.

---

## Principle 7 — Leveling mirrors habit formation science

Leveling is easy early (novelty and engagement) and hard later (mastery).
Levels drop gradually through neglect and recover faster than they were built.
Nothing resets to zero.

**What this means in practice:**
- XP required per level follows an exponential curve (100 → 400 → 1200 → 4000)
- Each level has a daily upkeep cost — miss habits, current XP drains
- Upkeep cost increases with level — higher levels demand more consistency
- Loot drop rates are higher at lower levels (novelty phase) and rarer at higher
- Habit maturity stages (Fragile → Building → Established → Mastered) map to
  the 66-day habit formation curve (Lally, 2010)
- Lifetime XP never decreases — it is a permanent record of total effort
- peak_level is stored — the user's best is always visible

**Why:** Matches the psychological reality of behaviour change. Early wins
provide motivation to continue. Sustained effort is genuinely harder to
maintain and should be genuinely harder to achieve in the game.

---

## Principle 8 — Notifications are time anchors, not interruptions

Notifications live in Google Calendar as real commitments. They are measured
for effectiveness and adapted over time.

**What this means in practice:**
- Every time block (morning / afternoon / evening) is a recurring calendar event
- Goal milestones appear as dated events with reminders
- Weekly review is a recurring calendar appointment
- Scratch pad 24h interrogation surfaces as a calendar reminder
- Notification effectiveness is tracked (action_taken boolean per notification)
- LLM surfaces ineffective notifications in the weekly review
- Loot drops and level-ups are in-app only — not calendar events

**Why:** Many people struggle with time perception and prospective memory.
External time anchors in an already-used tool (Google Calendar) are one of
the most evidence-backed interventions for building reliable routines.
Tracking whether notifications change behaviour allows the system to improve
its own effectiveness.
