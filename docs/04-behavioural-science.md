# Behavioural Science Foundations

Every mechanic in this system is grounded in peer-reviewed research. This
document maps each design decision to its scientific source so that future
changes can be evaluated against evidence.

---

## 1. Habit Formation — Lally et al. (2010)

**Finding:** Habits take an average of 66 days to become automatic (range:
18–254 days depending on complexity). The automaticity curve is asymptotic —
rapid gains early, plateau later.

**Source:** Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J.
(2010). How are habits formed: Modelling habit formation in the real world.
European Journal of Social Psychology, 40(6), 998–1009.

**Applied in:**
- Habit maturity stages (Fragile: 0–21 days, Building: 22–65, Established:
  66–89, Mastered: 90+)
- XP multipliers increase with maturity stage (earned automaticity is rewarded)
- Loot drop rates decrease with maturity (external reinforcement tapers as
  habit becomes intrinsic)
- The 66-day threshold is a visible milestone users can track

---

## 2. Variable Ratio Reinforcement — Skinner (1938, 1969)

**Finding:** Variable ratio reinforcement schedules (reward delivered after an
unpredictable number of responses) produce the highest and most persistent
response rates and are the most resistant to extinction.

**Source:** Skinner, B. F. (1938). The Behavior of Organisms. Appleton-Century-
Crofts. / Skinner, B. F. (1969). Contingencies of Reinforcement. Appleton-
Century-Crofts.

**Applied in:**
- Loot drops are random (~25% base chance) — never guaranteed
- XP amounts are randomised within a range (xp_min to xp_max)
- Loot drop rates vary by habit maturity (tapering variable reward matches the
  natural transition from extrinsic to intrinsic motivation)
- The unpredictability is the mechanism — users cannot habituate to a fixed reward

---

## 3. Implementation Intentions — Gollwitzer (1999)

**Finding:** People who specify when, where, and how they will pursue a goal
are 2–3x more likely to achieve it compared to those who only state what they
want to achieve.

**Source:** Gollwitzer, P. M. (1999). Implementation intentions: Strong effects
of simple plans. American Psychologist, 54(7), 493–503.

**Applied in:**
- Morning planning ritual (3 daily intentions set before the day begins)
- Goal creation requires full specification: name, why, metric target,
  milestones, steps, linked habits, stake
- Weekly review includes intention-setting for the following week
- The "why" field is mandatory and displayed daily alongside the goal

---

## 4. Commitment Devices — Ariely & Wertenbroch (2002), Thaler & Sunstein (2008)

**Finding:** People make better long-term decisions when they pre-commit to
consequences for failure. Self-imposed penalties are more effective than
externally imposed ones. Loss aversion (Kahneman & Tversky) makes the threat
of losing something more motivating than the prospect of gaining something.

**Sources:**
- Ariely, D., & Wertenbroch, K. (2002). Procrastination, deadlines, and
  performance. Psychological Science, 13(3), 219–224.
- Thaler, R. H., & Sunstein, C. R. (2008). Nudge. Yale University Press.
- Kahneman, D., & Tversky, A. (1979). Prospect theory. Econometrica, 47(2).

**Applied in:**
- Stake field in goals: user writes their own consequence for failure
- Stake is surfaced when a goal is stagnating: "Your stake: [X]. Still committed?"
- Commitment score must be 7+/10 to promote a goal — ensures genuine buy-in
- The stake is self-authored, not imposed — Ariely's research shows
  self-imposed commitments outperform external ones

---

## 5. Habit Stacking — Fogg (2019), Clear (2018)

**Finding:** Attaching a new habit to an existing behaviour (as a cue) dramatically
increases the probability of the new habit being performed. The existing habit
acts as a reliable trigger.

**Sources:**
- Fogg, B. J. (2019). Tiny Habits. Houghton Mifflin Harcourt.
- Clear, J. (2018). Atomic Habits. Avery.

**Applied in:**
- Habit sequences within time blocks — each habit is the cue for the next
- The morning sequence is a chain, not a list
- Sequence_order is enforced in the UI — current step is prominent, rest are dimmed
- The soft penalty for out-of-sequence completion (0.5x XP) discourages
  breaking the chain without hard-blocking the user

---

## 6. WOOP (Mental Contrasting with Implementation Intentions) — Oettingen (2014)

**Finding:** The combination of Wish (goal), Outcome (benefit), Obstacle
(anticipated barrier), and Plan (if-then response) significantly outperforms
positive fantasy alone or implementation intentions alone.

**Source:** Oettingen, G. (2014). Rethinking Positive Thinking. Current.

**Applied in:**
- Goal creation flow: name (Wish), why (Outcome), stake (Obstacle acknowledgment),
  milestones + steps (Plan)
- The scratch pad interrogation surfaces obstacles explicitly:
  "What would you need to pause or drop to take this on?"
- WOOP structure ensures goals are realistic, not just aspirational

---

## 7. Self-Monitoring — Michie et al. (2009)

**Finding:** Self-monitoring of behaviour is one of the most effective behaviour
change techniques across health, exercise, and goal achievement domains.
Combining self-monitoring with goal setting produces the largest effects.

**Source:** Michie, S., Abraham, C., Whittington, C., McAteer, J., & Gupta, S.
(2009). Effective techniques in healthy eating and physical activity
interventions. Health Psychology, 28(6), 690–701.

**Applied in:**
- Daily habit logs with visible completion data
- 7-day grid visible inline on each habit
- History view — every past day's state is accessible
- Stat bars reflect behaviour in real time
- Weekly review is a structured self-monitoring session
- Logbook for hard metrics — weight, reps, etc.

---

## 8. Spontaneous Recovery & Extinction — Pavlov (1927), Skinner (1938)

**Finding:** When a conditioned behaviour stops being reinforced, it gradually
extinguishes. However, after a rest period, the behaviour shows "spontaneous
recovery" — it can be relearned faster than original acquisition.

**Applied in:**
- Levels drop gradually — not catastrophically — when upkeep is unmet
- Habit potency (current_weight) decays toward min, not to zero
- Recovery is faster than initial acquisition — encoded in growth_rate > decay_rate
- Habit maturity consistent_days decay slowly, not reset on a miss
- Design Principle 3: "Nothing resets to zero"

---

## 9. GTD — Trusted Capture System — Allen (2001)

**Finding:** When people trust that all open loops are captured in a reliable
external system, cognitive load drops significantly. The brain stops
subconsciously monitoring uncaptured tasks, reducing anxiety and freeing
working memory.

**Source:** Allen, D. (2001). Getting Things Done. Viking.

**Applied in:**
- Ad-hoc tasks can be captured with name only — minimum friction
- Scratch pad accepts raw, unstructured ideas
- No input is ever lost or auto-deleted (archived, not deleted)
- Tasks surface in weekly review if unlinked — nothing falls through

---

## 10. Executive Function & Attention

These mechanics address common challenges in self-regulation, initiation, and
attention management. They are grounded in ADHD research but apply broadly to
anyone who organises their life with effort rather than instinct.

**Time perception:** Impaired prospective memory and time blindness affect
many people, not only those with ADHD. External time anchors are the primary
evidence-based intervention (Barkley, 2011).
- Applied: Google Calendar integration with recurring time-block events

**Domain cascade:** When one life area fails, generalised avoidance can
spread across all domains (Barkley's model of executive function deficits).
- Applied: Domain firewall. Stats are fully independent. One stat in crisis
  does not affect others mechanically.

**Novelty and motivation:** Dopamine-driven reward systems benefit from
novelty to sustain engagement, particularly during early habit formation.
- Applied: Variable XP amounts, random loot drops, loot drop rates higher
  at lower levels (novelty phase), progressive complexity to maintain interest

**Decision fatigue and initiation:** The hardest moment in any routine is
starting. Once begun, continuation is far easier.
- Applied: Morning ritual creates a structured entry point. Sequence removes
  the "what next?" decision. LLM can prompt if user is stuck on intentions.

**Scope creep and over-commitment:** Intense focus on new ideas can lead to
over-commitment and derailment of existing goals.
- Applied: Daily intentions limit scope. Hard cap of 3 active goals prevents
  over-commitment. Scratch pad quarantines impulsive new goals.

**Sources:**
- Barkley, R. A. (2011). Barkley Deficits in Executive Functioning Scale.
  Guilford Press.
- Volkow, N. D., et al. (2009). Evaluating dopamine reward pathway in ADHD.
  JAMA, 302(10), 1084–1091.
