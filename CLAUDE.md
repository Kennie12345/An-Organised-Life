# An Organised Life — Claude Instructions

> Extended behaviours live in .claude/ (commands, skills, agents).
> Source of truth for all design decisions is /docs/.

---

## Session Start (always do this first, every session)

1. Read /project/CURRENT_STATE.md
2. Read /project/TASKS.md — locate current phase and next uncompleted task
3. Read the /docs/ files listed under that phase's "Docs to read" header
4. State in 3 lines: current phase / next task / what you are about to do

---

## Source of Truth Hierarchy

Never ask the user if the answer exists in docs. Check in order:
1. /docs/02-schema.md               (data and schema questions)
2. /docs/03-features.md             (feature behaviour and UX)
3. /docs/01-design-principles.md    (approach conflicts)
4. /docs/07-change-protocol.md      (any proposed deviation)
5. Ask the user                     (only if docs do not resolve it)

---

## Stay On Track

If the user's message is outside the scope of the current task:
1. Add the topic to /project/SCRATCH.md (append a line: `- [ ] [BACKLOG — YYYY-MM-DD]: [topic]`)
2. Respond: "Added '[topic]' to scratch pad. Current task: [task name]. Shall we continue?"
3. Do not switch topics unless the user explicitly confirms
4. Exception: if the user invokes a /command, execute it then return to the task

This rule exists because the user has ADHD and benefits from an external
system holding the thread when attention shifts.

---

## Context Management

Context is monitored automatically via the PreCompact hook (see .claude/settings.json).
When the hook fires (a sound will play), it means context is near capacity. At that point:
1. Run /end-session to close properly
2. Start a new session with the standard session start prompt

---

## Hard Rules

- Stop at every ✋ task in TASKS.md — do not proceed without user input
- Never gate a reward behind an LLM prompt outside the Scratch Pad — Principle 1
- Never allow more than 3 active goals in code or UI — Principle 4
- Any proposed change to design or scope → user must run /scope-check first
- Do not implement anything in /project/SCOPE.md Deferred section
- Leave no broken code at session end

---

## Session End

Always do this before closing — or when the user runs /end-session:
1. Mark completed tasks [x] in /project/TASKS.md
2. Update /project/CURRENT_STATE.md
3. Flag any decision made that is not already in /docs/

---

## Component Structure

components/ is organised into domain folders. Place new components in the correct folder:

| Folder | Purpose |
|--------|---------|
| `auth/` | Login, sign-up, password forms, logout |
| `daily/` | Morning planning, evening check-in, daily jobs provider |
| `gamification/` | Level-up, loot drops, confetti, sparkles |
| `habits/` | Habit checklist, habit row, completion input, 7-day grid |
| `layout/` | Bottom nav, theme switcher, sync status |
| `pet/` | Pet sprite, background, scene, mini pet bar |
| `scaffold/` | Template/boilerplate (deploy button, logos, service worker) |
| `tracking/` | Water, medication, goal summary bar |
| `tutorial/` | Onboarding tutorial steps |
| `ui/` | Shadcn primitives (button, card, input, etc.) |

Do not place loose .tsx files in components/ root.

---

## User Context

- User has ADHD (combined type, inattentive dominant)
- Ask one question at a time — never a list of questions
- Short responses — no trailing summaries of what was just done
- May propose changes impulsively — always run /scope-check, not judgment
