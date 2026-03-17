# An Organised Life RPG

> A behavioural science-grounded life organisation system built as an RPG. Turn habits, goals, and routines into a character you level up.

---

## What This Is

A Progressive Web App (PWA) that gamifies personal life management using behavioural science. You build and maintain a single RPG character whose stats reflect real-life domains. Daily habits, goals, and routines are the gameplay. The character is a mirror of your actual life.

The app is not a task manager. It is a behavioural engine that looks like a game.

## Who It's For

Anyone who wants to build a better life and has found that conventional productivity systems don't stick — particularly people who:

- Over-commit to goals and abandon them quickly
- Experience cascade failure (one domain failing bleeds into all others)
- Struggle to start habits, not continue them
- Need external structure to turn intentions into actions

The behavioural mechanics are grounded in executive function research, making them especially effective for people who organise their life with effort rather than instinct.

## Core Concepts

- **One character** you level up across 7 life domains (fully configurable)
- **Habit stacking** — daily habits run in sequences, not flat checklists
- **Commitment devices** — goals require upfront stakes you write yourself
- **Levels rise and fall** — maintenance is part of the game
- **LLM coaching** via Claude — adds depth, never gates rewards
- **Google Calendar integration** — time blocks are real commitments
- **Templates** — share and fork your setup with others

## Behavioural Science

Every mechanic is grounded in peer-reviewed research:

| Mechanic | Research |
|---|---|
| Habit sequences | Fogg (2019), Clear (2018) — habit stacking |
| Habit maturity model | Lally et al. (2010) — 66-day formation curve |
| Variable XP & loot drops | Skinner (1938) — variable ratio reinforcement |
| Commitment stakes | Ariely & Wertenbroch (2002), Thaler & Sunstein (2008) |
| Goal creation flow | Gollwitzer (1999) — implementation intentions |
| WOOP goal structure | Oettingen (2014) — mental contrasting |
| Low-friction capture | Allen (2001) — GTD trusted capture system |

Full documentation in [`/docs/04-behavioural-science.md`](docs/04-behavioural-science.md).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js / React (PWA, installable on iOS) |
| Storage | IndexedDB (Dexie.js) — local-first, offline-capable |
| LLM | Claude API (Anthropic) |
| Calendar | Google Calendar API (read-write) |
| Backend | None at MVP — local only. Supabase planned for sync/multi-device |

## Documentation

All design documentation lives in [`/docs`](docs/):

| File | Contents |
|---|---|
| `00-overview.md` | What this is, who it's for, full philosophy |
| `01-design-principles.md` | The 8 non-negotiable design principles |
| `02-schema.md` | Complete normalised data schema |
| `03-features.md` | Feature specifications and interaction design |
| `04-behavioural-science.md` | Research and theory behind each mechanic |
| `05-default-config.md` | Default configuration |
| `06-tech-stack.md` | Architecture decisions and rationale |
| `07-change-protocol.md` | How to evaluate proposed changes |

## Status

Design complete. Build not yet started.
Last design review: 2026-03-17

## License

MIT
