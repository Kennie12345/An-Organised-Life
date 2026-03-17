# Default Configuration (Example)

This is the seed configuration included as the primary template. It demonstrates
a realistic 7-domain setup across a full week. All values are defaults —
the user can modify anything via Settings.

---

## Stats

| Name | Color | Icon | Decay grace | Decay rate | Sequence order |
|---|---|---|---|---|---|
| Body | #E74C3C (red) | heart | 1 day | 1.0/day | 1 |
| Order | #E67E22 (orange) | home | 2 days | 0.8/day | 2 |
| Wealth | #F1C40F (yellow) | coin | 3 days | 0.5/day | 3 |
| Build | #2ECC71 (green) | rocket | 2 days | 0.8/day | 4 |
| Bonds | #3498DB (blue) | people | 3 days | 0.6/day | 5 |
| Faith | #9B59B6 (purple) | star | 2 days | 0.8/day | 6 |
| Mind | #95A5A6 (grey) | book | 3 days | 0.5/day | 7 |

**Notes:**
- Body has the shortest grace period — physical health has the fastest
  real-world consequences
- Wealth and Bonds have the longest grace periods — financial and relationship
  investments are inherently longer-cycle
- Weekly habits (e.g. contact a friend) override their stat's grace period
  with a 7-day grace period

---

## Habits — Morning Block

Sequence order determines the chain. Each step unlocks the next.

| Order | Name | Completion type | Stats fed (weight) | Frequency | XP min | XP max |
|---|---|---|---|---|---|---|
| 1 | Weigh myself | numeric (kg) | Body (0.6) | daily | 10 | 20 |
| 2 | Morning medication | boolean | Body (0.8) | daily | 15 | 25 |
| 3 | Brush teeth (AM) | boolean | Body (0.3), Order (0.5) | daily | 8 | 15 |
| 4 | Spiritual reading | text | Faith (0.9), Mind (0.3) | daily | 20 | 40 |
| 5 | Gratitude sentence | text | Faith (0.5), Mind (0.4), Bonds (0.2) | daily | 15 | 30 |
| 6 | Prayer / meditation | boolean | Faith (1.0), Mind (0.3) | daily | 20 | 40 |
| 7 | Water — first glass | boolean | Body (0.4) | daily | 8 | 12 |
| 8 | Exercise | composite | Body (1.0), Mind (0.4) | daily | 30 | 80 |
| 9 | 12-hour fast check | time_range | Body (0.6) | daily | 15 | 25 |

**Exercise completion config:**
```json
{
  "step1": {
    "label": "Type",
    "type": "categorical",
    "options": ["Cardio (walk/bike/jog)", "Upper + Core", "Lower + Core"]
  },
  "step2": {
    "label": "Effort",
    "type": "scale",
    "options": ["Easy", "Medium", "Hard"],
    "xp_weights": [1.0, 1.3, 1.6]
  }
}
```

---

## Habits — Throughout Day

| Order | Name | Completion type | Stats fed (weight) | Frequency | XP min | XP max |
|---|---|---|---|---|---|---|
| 1 | Water intake | numeric (glasses) | Body (0.5) | daily | 5 | 15 |
| 2 | Small exercise break | boolean | Body (0.4), Mind (0.3) | daily | 10 | 20 |
| 3 | Work tasks | boolean | Build (0.8), Wealth (0.3) | daily | 10 | 30 |

**Water target:** 8 glasses / 2L per day. Progress shown as icon row in header.

---

## Habits — Evening Block

| Order | Name | Completion type | Stats fed (weight) | Frequency | XP min | XP max |
|---|---|---|---|---|---|---|
| 1 | Brush teeth (PM) | boolean | Body (0.3), Order (0.5) | daily | 8 | 15 |
| 2 | Log sleep time | time_range | Body (0.7) | daily | 10 | 20 |
| 3 | Journal (3 sentences) | text | Mind (0.5), Faith (0.2) | daily | 15 | 30 |
| 4 | Review tomorrow | boolean | Mind (0.4), Build (0.3) | daily | 10 | 20 |

---

## Habits — Weekly

| Name | Completion type | Stats fed (weight) | Frequency | XP min | XP max |
|---|---|---|---|---|---|
| Contact a friend | boolean | Bonds (0.9) | weekly | 30 | 60 |
| Review finances / spending | boolean | Wealth (0.9) | weekly | 25 | 50 |
| LinkedIn post | boolean | Build (0.8), Bonds (0.3) | weekly | 25 | 50 |
| Community post / interaction | boolean | Build (0.6), Bonds (0.4) | weekly | 20 | 40 |
| Intentional family time | boolean | Bonds (0.9) | weekly | 30 | 60 |
| Intentional time with partner | boolean | Bonds (1.0) | weekly | 30 | 60 |

---

## Logbook Metrics

| Name | Unit | Linked stat | Starting target |
|---|---|---|---|
| Weight | kg | Body | user-defined |
| Pull-ups | reps | Body | user-defined |
| Walk duration | minutes | Body | 30 min |

Additional metrics can be added at any time. Start_value recorded at commitment.

---

## Default Goals (Scratch Pad — to be committed after interrogation)

These are pre-loaded ideas in the scratch pad for first use. They are NOT
active goals — they must each pass the 24h + interrogation process.

1. "Reach my target weight"
2. "Build a consistent morning routine"
3. "Grow my online presence"

---

## Notification Schedule Defaults

| Type | Time | Days | Advance notice |
|---|---|---|---|
| Morning sequence | 7:00am | Mon–Sun | 10 min |
| Afternoon block | 12:30pm | Mon–Fri | 10 min |
| Evening block | 9:00pm | Mon–Sun | 10 min |
| Weekly review | 6:00pm | Sunday | 30 min |

Triggered notifications (streak warning, upkeep warning, etc.) fire
dynamically based on user state.

---

## Leveling Curve

| Level range | XP required per level | Daily upkeep cost | Loot drop base rate |
|---|---|---|---|
| 1–5 | 150 XP | 30 XP/day | 30% |
| 6–10 | 400 XP | 80 XP/day | 20% |
| 11–15 | 1,200 XP | 180 XP/day | 12% |
| 16–20 | 4,000 XP | 400 XP/day | 8% |
| 21+ | 12,000 XP | 800 XP/day | 5% |

Base loot drop rate is modified by habit_maturity.stage (see 02-schema.md).

---

## Template Metadata

```json
{
  "template_name": "Organised Life RPG — Default Template",
  "version": 1,
  "description": "7-domain daily system covering health, home, finances, career,
                  relationships, spirituality, and learning. A starting point
                  — fork and configure every stat, habit, and goal to fit your life.",
  "tags": ["productivity", "habits", "goals", "health", "career", "relationships"],
  "created": "2026-03-17"
}
```
