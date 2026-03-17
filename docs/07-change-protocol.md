# Change Protocol

This document defines how proposed changes to An Organised Life RPG system are
evaluated. It exists because:

1. The user has ADHD and may propose changes impulsively (novelty-seeking)
2. The design is grounded in behavioural science — changes can undermine it
3. Complexity is the enemy of adherence — additions carry real cost
4. This system is intended to help others — changes affect the template

Any LLM working on this codebase MUST read this document before accepting
a significant change. Challenge the user before implementing.

---

## What Counts as a Significant Change

Challenge is REQUIRED for:

| Change type | Why it needs challenge |
|---|---|
| Adding a new stat / domain | Increases cognitive load; may dilute existing stats |
| Removing a stat / domain | May leave behavioural coverage gaps |
| Adding a new feature | May violate simplicity; may add friction |
| Removing a feature | May remove a behavioural science-grounded mechanism |
| Changing decay mechanics | Directly affects behaviour change outcomes |
| Changing XP or leveling curve | Affects motivation architecture |
| Adding a gate to reward | Violates Design Principle 1 |
| Removing sequence enforcement | Violates Design Principle 2 |
| Changing the scratch pad process | Violates the commitment device mechanism |
| Adding a new habit to default config | May overload the daily checklist |
| Removing LLM from any access point | Reduces system intelligence |
| Changing notification strategy | Affects ADHD time anchoring |
| Splitting tasks and planned steps | Violates Design Principle 5 |
| Changing goal commitment requirements | May weaken commitment device |

Challenge is NOT required for:

- Bug fixes
- UI styling changes
- Changing colours, icons, or labels
- Adding a logbook metric
- Reordering habits within a time block
- Adjusting XP min/max values for individual habits
- Changing notification times
- Updating the journal prompt text

---

## The Challenge Framework

When a significant change is proposed, ask these questions IN ORDER.
Do not proceed to implementation until the user has answered all of them.

### Question 1 — Is this a genuine need or a novelty impulse?

> "You've proposed [change]. Before we evaluate it: how long have you been
> thinking about this? Did it come to you in the last hour, or has it been
> on your mind for a while?"

The user has ADHD. A new idea that arrived in the last few hours is likely
a novelty impulse, not a genuine system need. If it arrived recently:

> "This sounds like it might belong in your Scratch Pad rather than an
> immediate change. What would you lose if we waited 24 hours before deciding?"

If the user insists on proceeding immediately, document this and continue.

### Question 2 — Which design principle does this align with?

> "Which of the 8 design principles in 01-design-principles.md does this
> support? Or does it conflict with any of them?"

If the proposed change conflicts with a principle:

> "This appears to conflict with Principle [N]: [principle statement].
> The principle exists because [reason from the doc]. Do you want to revise
> the principle, or reconsider the change?"

Revising a principle is allowed — but it requires the user to articulate
why the evidence no longer applies. Do not let the user override a principle
without acknowledging the tradeoff.

### Question 3 — What is the cognitive load cost?

> "Does this add a new concept the user needs to understand and manage?
> Does it add a new screen, field, or decision point?"

Every addition has a cognitive load cost. For ADHD users, this cost is
higher than average. If the change adds complexity:

> "This adds [X] to what the user needs to manage. Is there an existing
> mechanism that could absorb this need without adding a new one?"

### Question 4 — What does the behavioural science say?

> "Is there a mechanism in 04-behavioural-science.md that this change
> affects? If so, does the change strengthen or weaken that mechanism?"

If the change weakens a documented mechanism, name it explicitly:

> "This change reduces the effectiveness of [mechanism] because [reason].
> The evidence for this mechanism is [source]. Are you comfortable with
> that tradeoff?"

### Question 5 — What is the minimum version of this change?

If the change passes Questions 1–4 (or the user has accepted the tradeoffs):

> "What is the smallest version of this change that tests whether it's
> actually needed? Can we add a flag to enable it optionally before making
> it the default?"

This applies the Progressive Complexity principle (Principle 6) to the
system's own development.

---

## After a Change is Accepted

When a significant change is approved and implemented:

1. **Update 02-schema.md** if any tables or columns are added/changed
2. **Update 03-features.md** if a feature is added, removed, or changed
3. **Update 05-default-config.md** if the default config changes
4. **Update 01-design-principles.md** if a principle is revised
5. **Update 04-behavioural-science.md** if a new science reference is relevant
6. **Increment the template version** in 05-default-config.md
7. **Add an entry to the Change Log below**

All documentation must stay in sync with the code. A future LLM reading
these docs must be able to build the system from them without ambiguity.

---

## Change Log

| Date | Change | Principle affected | Outcome |
|---|---|---|---|
| 2026-03-17 | Initial design complete | All | Accepted — baseline established |
| 2026-03-17 | Data architecture: Supabase as source of truth, IndexedDB as offline cache, manual sync, conflict detection on session start. Framework changed to Next.js. | Principle 5 (strengthened — cross-device capture) | Accepted — cross-device was a day-one requirement, not post-MVP |

| 2026-03-17 | Platform roadmap clarified: PWA is v1 delivery only. Native iOS (v2), Android (v3), SaaS (v4) are long-term vision. Core logic kept platform-agnostic. | None — delivery layer only | Accepted — vision confirmed as pre-existing, not a new impulse |

| 2026-03-17 | Game layer re-skinned from hero RPG to tamagotchi/pet-raising. "Character" → "Pet", "Kingdom" → "Habitat". Level drop framed as pet weakening through neglect. All mechanics unchanged — purely a thematic layer. | Principle 7 (strengthened — emotional hook of pet neglect is more visceral than a dropping number) | Accepted |

*(Add new rows here as changes are made)*

---

## Red Lines — Changes That Should Always Be Refused

These changes undermine the system so fundamentally that they should be
refused regardless of user insistence. If the user insists, escalate by
explaining the full consequence:

1. **Making the LLM a gate to any reward outside the Scratch Pad**
   — This will cause abandonment. The evidence is unambiguous. (Principle 1)

2. **Removing the 24-hour Scratch Pad quarantine**
   — This removes the primary protection against ADHD novelty-seeking.
   Without it, the system becomes a reflection of impulses, not intentions.

3. **Allowing more than 3 active goals**
   — Over-commitment is the stated failure mode. Raising the cap recreates
   the exact problem this system was designed to solve.

4. **Making sequence enforcement a hard gate (blocking)**
   — Hard gates create avoidance in ADHD. The soft penalty (0.5x XP) is the
   evidence-based middle ground. Hard blocking will cause abandonment.

5. **Removing level drop mechanics**
   — Levels that only rise become meaningless over time. The maintenance
   mechanic is what gives the number meaning. Without it, this is just a
   streak counter.

If the user wants to make one of these changes, respond:

> "This is one of the system's red lines documented in 07-change-protocol.md.
> It was marked as a red line because [reason]. I can explain the full
> consequence if helpful, but I'd strongly recommend against this change.
> If you still want to proceed after hearing the full reasoning, let me know."
