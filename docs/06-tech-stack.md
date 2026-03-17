# Tech Stack & Architecture

## Platform Target

Progressive Web App (PWA) installable on iOS via Safari. Designed for use
on iPad (primary) and iPhone. Desktop browser also supported.

---

## Frontend

**Framework:** Next.js (App Router) + React 18+
- Component-based UI maps well to the domain model (stat cards, habit rows,
  goal boards are natural components)
- Large ecosystem — charting, animation, PWA tooling all well-supported
- TypeScript used throughout for type safety
- User is familiar with Next.js — reduces friction during build
- App Router + Server Components usable for auth and API routes
- All data screens use `"use client"` — IndexedDB and real-time state
  cannot run server-side

**PWA Configuration:**
- Service worker for offline support (checklist usable without internet)
- Web App Manifest for home screen installation on iOS
- IndexedDB as local-first data store (works offline)
- Background sync for deferred API calls (LLM, Google Calendar) when offline

**Styling:** Tailwind CSS
- Utility-first, fast to iterate
- Dark/light mode support
- Mobile-first layout

**Charts:** Recharts or Chart.js
- Stat history over time
- Logbook metric trends
- Weekly completion heatmap

**Animation:** Framer Motion
- XP award animation (number flies up)
- Loot drop reveal animation
- Level up celebration
- These are critical for the reward feel — not cosmetic

---

## Data Storage — Supabase (source of truth) + IndexedDB (offline cache)

**Supabase is the primary data store.** All data is written to Supabase
Postgres first when online. IndexedDB acts as a local write buffer when
the device is offline.

**Why Supabase as source of truth:**
- Cross-device access from day one (web, iOS PWA, Android PWA)
- Postgres maps directly to the normalised schema in 02-schema.md
- Row-level security ensures users only access their own data
- Supabase Auth handles user identity (links to users table)
- Real-time subscriptions available for future multi-device sync

**Why keep IndexedDB (Dexie.js) as offline cache:**
- Morning sequence must work without internet (core use case)
- IndexedDB stores pending writes when offline
- User manually triggers sync to push local → Supabase when back online
- Dexie.js wraps IndexedDB with a clean, Promise-based API

**Sync strategy:**
1. Online: write directly to Supabase, mirror to IndexedDB for offline reads
2. Offline: write to IndexedDB only, queue changes for sync
3. On app open: check for local/remote divergence — warn user if conflict detected
4. Sync button in Settings: user-initiated push of local queue → Supabase
5. Conflict resolution: show user what differs and let them choose which wins

**Session-start conflict detection:**
- On app open, compare local `updated_at` timestamps against Supabase
- If another device wrote newer data: surface a banner warning before the user
  makes any changes
- User sees: which records differ, which device is newer, and a merge/overwrite choice

---

## LLM — Claude API (Anthropic)

**Model:** claude-sonnet-4-6 (or latest available at build time)

**Access points and call types:**

| Feature | Call type | Approx tokens |
|---|---|---|
| Habit follow-up question | Single prompt | ~500 |
| Scratch pad interrogation | Multi-turn conversation | ~2,000 |
| Weekly review synthesis | Long context prompt | ~4,000 |
| Goal stagnation prompt | Single prompt | ~800 |
| Task retrospective linking | Single prompt with list | ~1,000 |
| Morning intention prompt | Single prompt | ~400 |

**Context provided to LLM:**
- User's active goals (name, why, stake, progress)
- Last 7 days of habit logs (completion rate per habit)
- Last 7 days of daily_plans (intentions, journal entries)
- Completed unlinked tasks (for retrospective linking)
- Notification effectiveness data (action_taken rates)
- Character level and stat values

**At MVP:** API calls made via Next.js API routes (server-side). API key stored
in environment variable on the server — never exposed to the client bundle.

**Future:** Move heavy prompts to Supabase Edge Functions for:
1. Caching LLM responses for repeated patterns
2. Running weekly review synthesis without client involvement

---

## Calendar — Google Calendar API

**OAuth 2.0** for user authentication. Scopes required:
- `https://www.googleapis.com/auth/calendar.events` (read + write events)

**Operations used:**
- `events.insert` — create new recurring events (time blocks) and one-off events
- `events.update` — update event when schedule changes
- `events.delete` — remove event when notification is deactivated

**Event structure:**
```json
{
  "summary": "Morning Sequence",
  "description": "An Organised Life RPG: Time for your morning habit sequence.",
  "start": { "dateTime": "2026-03-18T07:00:00", "timeZone": "Australia/Sydney" },
  "end": { "dateTime": "2026-03-18T07:30:00", "timeZone": "Australia/Sydney" },
  "recurrence": ["RRULE:FREQ=DAILY"],
  "reminders": {
    "useDefault": false,
    "overrides": [{ "method": "popup", "minutes": 10 }]
  }
}
```

Token refresh handled automatically. refresh_token stored encrypted in
IndexedDB (user_integrations table).

---

## Backend — Supabase

**Supabase** (PostgreSQL + Auth + Edge Functions + Realtime) — active from day one.

**Why Supabase:**
- Postgres maps directly to the normalised schema in 02-schema.md
- Row-level security ensures users only read/write their own data
- Supabase Auth manages identity — `users.id` is the Supabase Auth UID
- Edge Functions for Claude API calls (server-side key management, future)
- Realtime subscriptions available for multi-device live sync (future)
- Open source — can self-host if needed

**Hosting:** Next.js app deployed to Vercel. Supabase project on Supabase cloud.

**Migration path:**
- MVP: Supabase + IndexedDB offline cache
- v2: Realtime sync (replace manual sync button with automatic)
- v3: Supabase Edge Functions for LLM calls (remove Next.js API routes)

---

## Security Considerations

- Google OAuth tokens stored encrypted in Supabase (user_integrations table, RLS protected)
- Claude API key stored server-side in Next.js environment variables — never in client bundle
- No sensitive data transmitted without HTTPS
- Personal journal entries and logbook data stored in Supabase with RLS
- Template exports (JSON) contain config only — no personal logs or journal data
- Supabase Auth handles session tokens — not stored manually

---

## Development Environment

```
/organise_life
  /docs                       Design documentation
  /project                    Session state, tasks, scope
  /app                        Next.js App Router
    /api                      Server-side API routes (LLM, auth callbacks)
    /(app)                    Authenticated app routes
      /today                  Today screen
      /stats                  Stat dashboard
      /goals                  Goals board
      /history                History screen
    /auth                     Auth routes (login, callback)
    layout.tsx
    page.tsx
  /components                 Shared React components
  /db                         Dexie schema + offline cache queries
  /lib
    /supabase                 Supabase client (browser + server)
    /sync                     Sync engine (local → Supabase, conflict detection)
  /services                   LLM, Google Calendar API clients
  /hooks                      Custom React hooks
  /utils                      XP calculation, weight formula, leveling curve
  /config                     Default config seed data
  /public                     PWA manifest, icons, service worker
  /supabase
    /migrations               SQL migration files
  package.json
  tsconfig.json
```

---

## Build Order

1. **Dexie schema** — all tables, indexes, seed data
2. **Morning sequence screen** — the daily anchor
3. **Stat dashboard** — visible feedback loop
4. **XP + loot drop engine** — the game layer
5. **Goals board + task manager** — the purpose layer
6. **History + weekly review** — the memory layer
7. **Scratch pad + LLM integration** — the commitment layer
8. **Google Calendar integration** — the time anchor layer
9. **Onboarding + templates** — the sharing layer
10. **Kingdom view** — optional, last
