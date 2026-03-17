# An Organised Life

> A behavioural science-grounded life organisation system. Raise a pet whose condition mirrors your real life — tend to your habits and it thrives; neglect them and it weakens.

---

## What This Is

A behavioural engine that looks like a tamagotchi. You raise and care for a pet whose condition reflects real-life domains. Daily habits, goals, and routines are the gameplay. The pet is a mirror of your actual life.

**Current delivery:** Progressive Web App (PWA) — installable on iOS and Android via browser, works offline.
**Vision:** Native iOS, Android, and SaaS versions. The core logic is platform-agnostic by design.

## Who It's For

Anyone who wants to build a better life and has found that conventional productivity systems don't stick — particularly people who:

- Over-commit to goals and abandon them quickly
- Experience cascade failure (one domain failing bleeds into all others)
- Struggle to start habits, not continue them
- Need external structure to turn intentions into actions

The behavioural mechanics are grounded in executive function research, making them especially effective for people who organise their life with effort rather than instinct.

## Core Concepts

- **One pet** you raise across 7 life domains (fully configurable)
- **Habit stacking** — daily habits run in sequences, not flat checklists
- **Commitment devices** — goals require upfront stakes you write yourself
- **Pet health rises and falls** — consistent care strengthens it; neglect weakens it
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
| Frontend | Next.js / React (PWA — v1 delivery target) |
| Backend | Supabase (Postgres + Auth + RLS) — source of truth |
| Offline cache | IndexedDB (Dexie.js) — offline write buffer, syncs to Supabase |
| LLM | Claude API (Anthropic) |
| Calendar | Google Calendar API (read-write) |
| Hosting | Vercel (frontend) + Supabase Cloud (backend) |

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

## Platform Roadmap

| Version | Platform |
|---|---|
| v1 (current) | PWA — installable via browser on iOS and Android |
| v2 | Native iOS app |
| v3 | Native Android app |
| v4 | SaaS (multi-user, team templates) |

The data layer (Supabase) and business logic (utilities) are intentionally decoupled from the PWA delivery layer to support this roadmap without a rewrite.

## Status

Phase 1 — Foundation in progress.
Last design review: 2026-03-17

## License

MIT
