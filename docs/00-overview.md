# An Organised Life RPG — Overview

## What This Is

A behavioural engine that gamifies personal life management using behavioural
science. Users raise and care for a pet whose condition reflects real-life
domains. Daily habits, goals, and routines are the gameplay. The pet is a
mirror of the person's actual life — neglect it and it weakens; tend to it
consistently and it thrives.

**v1 delivery platform:** Progressive Web App (PWA) — installable on iOS and
Android via browser, works offline. The core logic is intentionally
platform-agnostic. Native iOS, Android, and SaaS versions are the long-term
vision. Nothing in the data layer or business logic is coupled to the PWA.

## Who This Is For

Anyone who wants to build a better life and has found that conventional
productivity systems don't stick. In particular, people who:

- Over-commit to goals and abandon them quickly
- Experience cascade failure (one domain failing bleeds into all others)
- Struggle with habit initiation, not continuation
- Have intense focus episodes they want to channel productively
- Respond to visual feedback, numbers, and novelty
- Need external time anchors to manage their day
- Require systems that are forgiving of imperfection but honest about neglect

The behavioural science mechanics are grounded in research on executive
function, habit formation, and motivation — making them particularly effective
for people with ADHD, but valuable for anyone who organises their life with
effort rather than instinct.

The system is fully configurable and can be used by anyone via templates.

## The Central Problem Being Solved

Most productivity systems fail ADHD users because they:
1. Require willpower to initiate (high friction)
2. Provide no immediate reward for small actions
3. Collapse entirely when one area of life goes wrong
4. Offer no mechanism to prevent over-commitment
5. Have no memory — yesterday's wins are invisible today

This system solves all five.

## Core Philosophy

> Long-term goals are won or lost in daily investments. The app sequences
> those investments deliberately, holds users to commitments with real stakes,
> and makes adherence the path of least resistance.

Three behavioural frameworks underpin everything:

1. **Habit Stacking** (BJ Fogg, James Clear) — habits attach to sequences,
   not willpower. The morning routine is a chain, not a list.

2. **Commitment Devices** (behavioural economics) — stakes shift the cost of
   quitting. Users write their own consequence for goal failure.

3. **Variable Ratio Reinforcement** (Skinner) — unpredictable rewards sustain
   engagement longer than fixed rewards. Loot drops are never guaranteed.

## The Game Layer

- **Pet**: one pet, one level, reflects overall life consistency
- **Stats**: 7 life domains rendered as condition bars (0-100) — the pet's health across life areas
- **XP**: earned by completing habits and tasks, variable in amount
- **Levels**: rise with consistency, fall with neglect — the pet weakens when ignored
- **Loot Drops**: random rewards on habit completion (~25% base chance)
- **Habit Maturity**: habits gain potency over 66+ days of consistency
- **Habitat**: text-based world that reflects pet condition (optional view)

## The Commitment Layer

- **Scratch Pad**: ideas are captured here with zero commitment
- **24-hour quarantine**: ideas cannot be promoted for 24 hours
- **LLM Interrogation**: after 24h, Claude asks 5 structured questions
- **Stakes**: user writes their own consequence for goal failure
- **Commitment score**: must be 7+/10 to promote a goal to active
- **Hard cap**: max 3 active goals at any time

## The Coach Layer (LLM)

Claude is embedded as a coach, not a gatekeeper. It:
- Conducts scratch pad interrogation conversationally
- Offers optional follow-up questions after habit completion (bonus XP)
- Synthesises weekly review data into insights
- Surfaces patterns the user has missed
- Challenges goal stagnation by surfacing the user's own stake

The LLM never gates a reward. It only adds depth.

## What Makes This Different From Habitica / Other Apps

| Feature | An Organised Life RPG | Habitica | Notion | Habit trackers |
|---|---|---|---|---|
| Behavioural science-grounded | Yes | Partial | No | No |
| Behavioural design for executive function | Yes | No | No | No |
| Levels can drop | Yes | No | N/A | N/A |
| Habit maturity model | Yes | No | No | No |
| Stakes / commitment devices | Yes | No | No | No |
| LLM coaching | Yes | No | No | No |
| Cascade failure prevention | Yes | No | No | No |
| Sequence enforcement | Yes | No | No | No |
| Google Calendar integration | Yes | Partial | Partial | Rarely |
| Fully configurable / templates | Yes | Partial | Yes | Varies |

## Domain Coverage (Default Template)

| Stat | Domain |
|---|---|
| Body | Health (exercise, sleep, diet, medication) |
| Order | Chores / Home life |
| Wealth | Finances / Income / Spending |
| Build | Business / Career / PR / Side Hustles |
| Bonds | Relationships (Partner, Family, Friends) |
| Faith | Spirituality / Values |
| Mind | Learning |

All stats are user-defined. None are hardcoded.
