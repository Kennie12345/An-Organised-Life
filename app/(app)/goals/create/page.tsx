"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Plus, X, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  db,
  type DbGoal,
  type DbStat,
  type DbHabit,
  type DbLogbookMetric,
} from "@/db";
import { queueWrite } from "@/lib/sync";
import { uuid } from "@/utils/uuid";

/* ── Form State ── */

interface StakeEffect {
  statId: string;
  value: number; // +2, +4, -2, -4
  trigger: "success" | "failure";
}

interface MilestoneInput {
  name: string;
  targetDate: string; // ISO date or ""
}

interface NewHabitInput {
  name: string;
  completionType: string;
  timeBlock: string;
}

interface NewMetricInput {
  name: string;
  unit: string;
}

interface FormState {
  name: string;
  why: string;
  primaryStatId: string;
  metricId: string; // existing metric id, "new" for new metric, "" for none
  metricStartValue: string;
  metricTargetValue: string;
  newMetric: NewMetricInput;
  milestones: MilestoneInput[];
  linkedHabitIds: string[];
  newHabits: NewHabitInput[];
  stakeEffects: StakeEffect[];
  gracePeriodValue: string;
  gracePeriodUnit: "hours" | "days" | "weeks";
}

const INITIAL_FORM: FormState = {
  name: "",
  why: "",
  primaryStatId: "",
  metricId: "",
  metricStartValue: "",
  metricTargetValue: "",
  newMetric: { name: "", unit: "" },
  milestones: [],
  linkedHabitIds: [],
  newHabits: [],
  stakeEffects: [],
  gracePeriodValue: "3",
  gracePeriodUnit: "days",
};

const STEPS = [
  "Name & Why",
  "Stat",
  "Metric",
  "Milestones",
  "Habits",
  "Stakes",
  "Confirm",
] as const;

/* ── Progress Dots ── */

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-[5px] rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 5,
            backgroundColor:
              i < current
                ? "hsl(var(--foreground) / 0.3)"
                : i === current
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--muted))",
          }}
        />
      ))}
    </div>
  );
}

/* ── Step 1: Name & Why ── */

function StepNameWhy({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (f: Partial<FormState>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Goal name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Run a half marathon"
          className="mt-1.5 w-full bg-transparent border-b border-muted-foreground/20 pb-2 text-[16px] outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/30"
          autoFocus
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Why does this matter?
        </label>
        <textarea
          value={form.why}
          onChange={(e) => onChange({ why: e.target.value })}
          placeholder="This is shown daily on your goal card"
          rows={3}
          className="mt-1.5 w-full bg-transparent border border-muted-foreground/20 rounded-lg p-3 text-[14px] outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/30 resize-none"
        />
      </div>
    </div>
  );
}

/* ── Step 2: Primary Stat ── */

function StepStat({
  form,
  onChange,
  stats,
}: {
  form: FormState;
  onChange: (f: Partial<FormState>) => void;
  stats: DbStat[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
        Which stat does this goal feed?
      </p>
      {stats.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange({ primaryStatId: s.id })}
          className="w-full text-left px-4 py-3 rounded-lg transition-colors"
          style={{
            backgroundColor:
              form.primaryStatId === s.id
                ? "hsl(var(--foreground) / 0.08)"
                : "transparent",
            border:
              form.primaryStatId === s.id
                ? "1px solid hsl(var(--foreground) / 0.15)"
                : "1px solid hsl(var(--muted))",
          }}
        >
          <span className="text-[14px]">{s.name}</span>
          {s.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {s.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Step 3: Metric Target (optional) ── */

function StepMetric({
  form,
  onChange,
  metrics,
}: {
  form: FormState;
  onChange: (f: Partial<FormState>) => void;
  metrics: DbLogbookMetric[];
}) {
  const hasMetric = form.metricId !== "";

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        Track a metric (optional)
      </p>

      {/* No metric option */}
      <button
        onClick={() =>
          onChange({ metricId: "", metricStartValue: "", metricTargetValue: "", newMetric: { name: "", unit: "" } })
        }
        className="w-full text-left px-4 py-3 rounded-lg transition-colors"
        style={{
          backgroundColor:
            !hasMetric ? "hsl(var(--foreground) / 0.08)" : "transparent",
          border:
            !hasMetric
              ? "1px solid hsl(var(--foreground) / 0.15)"
              : "1px solid hsl(var(--muted))",
        }}
      >
        <span className="text-[14px]">No metric</span>
      </button>

      {/* Existing metrics */}
      {metrics.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange({ metricId: m.id, newMetric: { name: "", unit: "" } })}
          className="w-full text-left px-4 py-3 rounded-lg transition-colors"
          style={{
            backgroundColor:
              form.metricId === m.id
                ? "hsl(var(--foreground) / 0.08)"
                : "transparent",
            border:
              form.metricId === m.id
                ? "1px solid hsl(var(--foreground) / 0.15)"
                : "1px solid hsl(var(--muted))",
          }}
        >
          <span className="text-[14px]">
            {m.name} ({m.unit})
          </span>
        </button>
      ))}

      {/* Create new metric */}
      <button
        onClick={() => onChange({ metricId: "new" })}
        className="w-full text-left px-4 py-3 rounded-lg transition-colors"
        style={{
          backgroundColor:
            form.metricId === "new"
              ? "hsl(var(--foreground) / 0.08)"
              : "transparent",
          border:
            form.metricId === "new"
              ? "1px solid hsl(var(--foreground) / 0.15)"
              : "1px solid hsl(var(--muted))",
        }}
      >
        <span className="text-[14px]">+ New metric</span>
      </button>

      {/* New metric fields */}
      {form.metricId === "new" && (
        <div className="flex gap-3 mt-1">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Name
            </label>
            <input
              type="text"
              value={form.newMetric.name}
              onChange={(e) =>
                onChange({ newMetric: { ...form.newMetric, name: e.target.value } })
              }
              placeholder="e.g. Grip strength"
              className="mt-1 w-full bg-transparent border-b border-muted-foreground/20 pb-2 text-[14px] outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/30"
            />
          </div>
          <div className="w-20">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Unit
            </label>
            <input
              type="text"
              value={form.newMetric.unit}
              onChange={(e) =>
                onChange({ newMetric: { ...form.newMetric, unit: e.target.value } })
              }
              placeholder="kg"
              className="mt-1 w-full bg-transparent border-b border-muted-foreground/20 pb-2 text-[14px] outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/30"
            />
          </div>
        </div>
      )}

      {/* Start / Target values */}
      {hasMetric && (
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Current value
            </label>
            <input
              type="number"
              value={form.metricStartValue}
              onChange={(e) => onChange({ metricStartValue: e.target.value })}
              className="mt-1 w-full bg-transparent border-b border-muted-foreground/20 pb-2 text-[16px] outline-none focus:border-foreground/40 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Target
            </label>
            <input
              type="number"
              value={form.metricTargetValue}
              onChange={(e) => onChange({ metricTargetValue: e.target.value })}
              className="mt-1 w-full bg-transparent border-b border-muted-foreground/20 pb-2 text-[16px] outline-none focus:border-foreground/40 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Step 4: Milestones (optional) ── */

function StepMilestones({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (f: Partial<FormState>) => void;
}) {
  const add = () => {
    if (form.milestones.length >= 5) return;
    onChange({ milestones: [...form.milestones, { name: "", targetDate: "" }] });
  };
  const remove = (i: number) => {
    onChange({ milestones: form.milestones.filter((_, idx) => idx !== i) });
  };
  const update = (i: number, patch: Partial<MilestoneInput>) => {
    onChange({
      milestones: form.milestones.map((m, idx) =>
        idx === i ? { ...m, ...patch } : m,
      ),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        Milestones (optional, 2–5 waypoints)
      </p>
      <p className="text-[12px] text-muted-foreground/60">
        Break the goal into checkpoints
      </p>

      {form.milestones.map((m, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1.5">
            <input
              type="text"
              value={m.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder={`Milestone ${i + 1}`}
              className="w-full bg-transparent border-b border-muted-foreground/20 pb-1.5 text-[14px] outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/30"
            />
            <input
              type="date"
              value={m.targetDate}
              onChange={(e) => update(i, { targetDate: e.target.value })}
              className="w-full bg-transparent text-[12px] text-muted-foreground outline-none"
            />
          </div>
          <button
            onClick={() => remove(i)}
            className="mt-1 p-1 text-muted-foreground/40 active:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {form.milestones.length < 5 && (
        <button
          onClick={add}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground active:text-foreground transition-colors"
        >
          <Plus size={14} /> Add milestone
        </button>
      )}
    </div>
  );
}

/* ── Step 5: Linked Habits ── */

function StepHabits({
  form,
  onChange,
  habits,
}: {
  form: FormState;
  onChange: (f: Partial<FormState>) => void;
  habits: DbHabit[];
}) {
  const toggleHabit = (id: string) => {
    onChange({
      linkedHabitIds: form.linkedHabitIds.includes(id)
        ? form.linkedHabitIds.filter((h) => h !== id)
        : [...form.linkedHabitIds, id],
    });
  };
  const addNewHabit = () => {
    onChange({
      newHabits: [
        ...form.newHabits,
        { name: "", completionType: "boolean", timeBlock: "morning" },
      ],
    });
  };
  const removeNewHabit = (i: number) => {
    onChange({ newHabits: form.newHabits.filter((_, idx) => idx !== i) });
  };
  const updateNewHabit = (i: number, patch: Partial<NewHabitInput>) => {
    onChange({
      newHabits: form.newHabits.map((h, idx) =>
        idx === i ? { ...h, ...patch } : h,
      ),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        Linked habits (optional)
      </p>

      {/* Existing habits */}
      <div className="space-y-1.5">
        {habits.map((h) => {
          const selected = form.linkedHabitIds.includes(h.id);
          return (
            <button
              key={h.id}
              onClick={() => toggleHabit(h.id)}
              className="w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center justify-between"
              style={{
                backgroundColor: selected
                  ? "hsl(var(--foreground) / 0.08)"
                  : "transparent",
                border: selected
                  ? "1px solid hsl(var(--foreground) / 0.15)"
                  : "1px solid hsl(var(--muted))",
              }}
            >
              <span className="text-[13px]">{h.name}</span>
              {selected && (
                <Check
                  size={14}
                  strokeWidth={2}
                  style={{ color: "hsl(152 60% 48%)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* New micro-habits */}
      {form.newHabits.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-muted">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            New micro-habits
          </p>
          {form.newHabits.map((h, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={h.name}
                  onChange={(e) => updateNewHabit(i, { name: e.target.value })}
                  placeholder="Habit name"
                  className="w-full bg-transparent border-b border-muted-foreground/20 pb-1.5 text-[14px] outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/30"
                />
                <div className="flex gap-2">
                  <select
                    value={h.timeBlock}
                    onChange={(e) =>
                      updateNewHabit(i, { timeBlock: e.target.value })
                    }
                    className="bg-transparent text-[11px] text-muted-foreground outline-none"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="anytime">Anytime</option>
                  </select>
                  <select
                    value={h.completionType}
                    onChange={(e) =>
                      updateNewHabit(i, { completionType: e.target.value })
                    }
                    className="bg-transparent text-[11px] text-muted-foreground outline-none"
                  >
                    <option value="boolean">Boolean</option>
                    <option value="numeric">Numeric</option>
                    <option value="text">Text</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => removeNewHabit(i)}
                className="mt-1 p-1 text-muted-foreground/40 active:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addNewHabit}
        className="flex items-center gap-1.5 text-[12px] text-muted-foreground active:text-foreground transition-colors"
      >
        <Plus size={14} /> Create new micro-habit
      </button>
    </div>
  );
}

/* ── Step 6: Stakes ── */

function StepStakes({
  form,
  onChange,
  stats,
}: {
  form: FormState;
  onChange: (f: Partial<FormState>) => void;
  stats: DbStat[];
}) {
  const successEffects = form.stakeEffects.filter(
    (e) => e.trigger === "success",
  );
  const failureEffects = form.stakeEffects.filter(
    (e) => e.trigger === "failure",
  );

  const addEffect = (trigger: "success" | "failure") => {
    const existing = form.stakeEffects.filter((e) => e.trigger === trigger);
    if (existing.length >= 2) return;
    onChange({
      stakeEffects: [
        ...form.stakeEffects,
        { statId: stats[0]?.id ?? "", value: trigger === "success" ? 2 : -2, trigger },
      ],
    });
  };

  const removeEffect = (idx: number) => {
    onChange({
      stakeEffects: form.stakeEffects.filter((_, i) => i !== idx),
    });
  };

  const updateEffect = (idx: number, patch: Partial<StakeEffect>) => {
    onChange({
      stakeEffects: form.stakeEffects.map((e, i) =>
        i === idx ? { ...e, ...patch } : e,
      ),
    });
  };

  const POSITIVE_VALUES = [2, 4];
  const NEGATIVE_VALUES = [-2, -4];

  return (
    <div className="space-y-6">
      {/* Success effects */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          On success — stats to boost
        </p>
        {successEffects.map((e, _i) => {
          const globalIdx = form.stakeEffects.indexOf(e);
          return (
            <div key={globalIdx} className="flex items-center gap-2">
              <select
                value={e.statId}
                onChange={(ev) =>
                  updateEffect(globalIdx, { statId: ev.target.value })
                }
                className="flex-1 bg-transparent border border-muted-foreground/20 rounded-lg px-3 py-2 text-[13px] outline-none"
              >
                {stats.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                {POSITIVE_VALUES.map((v) => (
                  <button
                    key={v}
                    onClick={() => updateEffect(globalIdx, { value: v })}
                    className="px-2.5 py-1 rounded text-[12px] transition-colors"
                    style={{
                      backgroundColor:
                        e.value === v
                          ? "hsl(152 60% 48% / 0.15)"
                          : "transparent",
                      color:
                        e.value === v
                          ? "hsl(152 60% 48%)"
                          : "hsl(var(--muted-foreground))",
                      border:
                        e.value === v
                          ? "1px solid hsl(152 60% 48% / 0.3)"
                          : "1px solid hsl(var(--muted))",
                    }}
                  >
                    +{v}
                  </button>
                ))}
              </div>
              <button
                onClick={() => removeEffect(globalIdx)}
                className="p-1 text-muted-foreground/40 active:text-foreground"
              >
                <Minus size={14} />
              </button>
            </div>
          );
        })}
        {successEffects.length < 2 && (
          <button
            onClick={() => addEffect("success")}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground active:text-foreground transition-colors"
          >
            <Plus size={14} /> Add success effect
          </button>
        )}
      </div>

      {/* Failure effects */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          On failure — stats penalised
        </p>
        {failureEffects.map((e, _i) => {
          const globalIdx = form.stakeEffects.indexOf(e);
          return (
            <div key={globalIdx} className="flex items-center gap-2">
              <select
                value={e.statId}
                onChange={(ev) =>
                  updateEffect(globalIdx, { statId: ev.target.value })
                }
                className="flex-1 bg-transparent border border-muted-foreground/20 rounded-lg px-3 py-2 text-[13px] outline-none"
              >
                {stats.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                {NEGATIVE_VALUES.map((v) => (
                  <button
                    key={v}
                    onClick={() => updateEffect(globalIdx, { value: v })}
                    className="px-2.5 py-1 rounded text-[12px] transition-colors"
                    style={{
                      backgroundColor:
                        e.value === v
                          ? "hsl(0 65% 55% / 0.15)"
                          : "transparent",
                      color:
                        e.value === v
                          ? "hsl(0 65% 55%)"
                          : "hsl(var(--muted-foreground))",
                      border:
                        e.value === v
                          ? "1px solid hsl(0 65% 55% / 0.3)"
                          : "1px solid hsl(var(--muted))",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                onClick={() => removeEffect(globalIdx)}
                className="p-1 text-muted-foreground/40 active:text-foreground"
              >
                <Minus size={14} />
              </button>
            </div>
          );
        })}
        {failureEffects.length < 2 && (
          <button
            onClick={() => addEffect("failure")}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground active:text-foreground transition-colors"
          >
            <Plus size={14} /> Add failure effect
          </button>
        )}
      </div>

      {/* Grace period */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Grace period before failure penalties
        </p>
        <div className="flex gap-3 items-center">
          <input
            type="number"
            min={0}
            value={form.gracePeriodValue}
            onChange={(e) => onChange({ gracePeriodValue: e.target.value })}
            className="w-16 bg-transparent border-b border-muted-foreground/20 pb-1.5 text-[16px] text-center outline-none focus:border-foreground/40 transition-colors"
          />
          <div className="flex gap-1">
            {(["hours", "days", "weeks"] as const).map((u) => (
              <button
                key={u}
                onClick={() => onChange({ gracePeriodUnit: u })}
                className="px-3 py-1.5 rounded text-[12px] transition-colors"
                style={{
                  backgroundColor:
                    form.gracePeriodUnit === u
                      ? "hsl(var(--foreground) / 0.08)"
                      : "transparent",
                  border:
                    form.gracePeriodUnit === u
                      ? "1px solid hsl(var(--foreground) / 0.15)"
                      : "1px solid hsl(var(--muted))",
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 7: Confirmation ── */

function StepConfirm({
  form,
  stats,
  habits,
  metrics,
}: {
  form: FormState;
  stats: DbStat[];
  habits: DbHabit[];
  metrics: DbLogbookMetric[];
}) {
  const statMap = useMemo(
    () => new Map(stats.map((s) => [s.id, s])),
    [stats],
  );
  const linkedMetric = metrics.find((m) => m.id === form.metricId);

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        Review your goal
      </p>

      <div className="space-y-3">
        <div>
          <p className="text-[16px]">{form.name || "(untitled)"}</p>
          <p className="text-[12px] text-muted-foreground/70 mt-1">
            {form.why || "(no why)"}
          </p>
        </div>

        {form.primaryStatId && (
          <p className="text-[12px]">
            <span className="text-muted-foreground">Stat: </span>
            {statMap.get(form.primaryStatId)?.name}
          </p>
        )}

        {linkedMetric && (
          <p className="text-[12px]">
            <span className="text-muted-foreground">Metric: </span>
            {linkedMetric.name} — {form.metricStartValue} → {form.metricTargetValue}{" "}
            {linkedMetric.unit}
          </p>
        )}

        {form.milestones.filter((m) => m.name.trim()).length > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground">Milestones</p>
            {form.milestones
              .filter((m) => m.name.trim())
              .map((m, i) => (
                <p key={i} className="text-[12px] ml-2">
                  {i + 1}. {m.name}
                  {m.targetDate && (
                    <span className="text-muted-foreground/60 ml-1">
                      ({m.targetDate})
                    </span>
                  )}
                </p>
              ))}
          </div>
        )}

        {(form.linkedHabitIds.length > 0 || form.newHabits.length > 0) && (
          <div>
            <p className="text-[11px] text-muted-foreground">Linked habits</p>
            {form.linkedHabitIds.map((id) => {
              const h = habits.find((h) => h.id === id);
              return (
                <p key={id} className="text-[12px] ml-2">
                  {h?.name}
                </p>
              );
            })}
            {form.newHabits
              .filter((h) => h.name.trim())
              .map((h, i) => (
                <p key={`new-${i}`} className="text-[12px] ml-2">
                  {h.name}{" "}
                  <span className="text-muted-foreground/60">(new)</span>
                </p>
              ))}
          </div>
        )}

        {form.stakeEffects.length > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground">Stakes</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 ml-2 mt-1">
              {form.stakeEffects
                .filter((e) => e.trigger === "success")
                .map((e, i) => (
                  <span
                    key={`s-${i}`}
                    className="text-[12px]"
                    style={{ color: "hsl(152 60% 48%)" }}
                  >
                    {statMap.get(e.statId)?.name} +{e.value}
                  </span>
                ))}
              {form.stakeEffects
                .filter((e) => e.trigger === "failure")
                .map((e, i) => (
                  <span
                    key={`f-${i}`}
                    className="text-[12px]"
                    style={{ color: "hsl(0 65% 55%)" }}
                  >
                    {statMap.get(e.statId)?.name} {e.value}
                  </span>
                ))}
            </div>
          </div>
        )}

        <p className="text-[12px]">
          <span className="text-muted-foreground">Grace: </span>
          {form.gracePeriodValue} {form.gracePeriodUnit}
        </p>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function GoalCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [stats, setStats] = useState<DbStat[]>([]);
  const [habits, setHabits] = useState<DbHabit[]>([]);
  const [metrics, setMetrics] = useState<DbLogbookMetric[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;
      setUserId(uid);

      const [s, h, m] = await Promise.all([
        db.stats.where("user_id").equals(uid).sortBy("sequence_order"),
        db.habits
          .where("user_id")
          .equals(uid)
          .filter((h: DbHabit) => h.is_active)
          .toArray(),
        db.logbook_metrics.where("user_id").equals(uid).toArray(),
      ]);
      setStats(s);
      setHabits(h);
      setMetrics(m);

      // Pre-fill from scratch pad if promoted
      const scratchId = searchParams.get("from_scratch");
      if (scratchId) {
        const scratchItem = await db.scratch_pad_items.get(scratchId);
        if (scratchItem) {
          setForm((f) => ({ ...f, name: scratchItem.raw_idea }));
        }
      }
    }
    load();
  }, [searchParams]);

  const onChange = useCallback(
    (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch })),
    [],
  );

  // Validation per step
  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return form.name.trim().length > 0 && form.why.trim().length > 0;
      case 1:
        return form.primaryStatId !== "";
      case 2:
        return true; // optional
      case 3:
        return true; // optional
      case 4:
        return true; // optional
      case 5:
        return form.stakeEffects.length > 0;
      case 6:
        return true;
      default:
        return false;
    }
  }, [step, form]);

  const next = () => {
    if (step < STEPS.length - 1 && canProceed) {
      setDirection(1);
      setStep(step + 1);
    }
  };
  const back = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleCommit = async () => {
    if (!userId || saving) return;

    // Enforce max 3 active goals
    const activeCount = await db.goals
      .where("user_id")
      .equals(userId)
      .filter((g: DbGoal) => g.status === "active")
      .count();

    if (activeCount >= 3) {
      alert("You already have 3 active goals. Complete or archive one first.");
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    const goalId = uuid();

    // Create goal
    const goal = {
      id: goalId,
      user_id: userId,
      name: form.name.trim(),
      why: form.why.trim(),
      primary_stat_id: form.primaryStatId || null,
      status: "active",
      commitment_score: null,
      committed_at: now,
      target_date: null,
      grace_period_value: parseInt(form.gracePeriodValue) || 3,
      grace_period_unit: form.gracePeriodUnit,
      scratch_pad_expires_at: now, // N/A — created directly
      created_at: now,
      updated_at: now,
    };

    await db.goals.add(goal as never);
    await queueWrite("goals", goalId, "upsert", goal);

    // Create stake effects
    for (const effect of form.stakeEffects) {
      const id = uuid();
      const row = {
        id,
        goal_id: goalId,
        stat_id: effect.statId,
        effect_value: effect.value,
        trigger: effect.trigger,
        created_at: now,
        updated_at: now,
      };
      await db.goal_stake_effects.add(row as never);
      await queueWrite("goal_stake_effects", id, "upsert", row);
    }

    // Create metric target if selected
    if (form.metricId) {
      let metricId = form.metricId;

      // Create new logbook metric if needed
      if (metricId === "new" && form.newMetric.name.trim()) {
        metricId = uuid();
        const metricRow = {
          id: metricId,
          user_id: userId,
          name: form.newMetric.name.trim(),
          unit: form.newMetric.unit.trim() || "units",
          stat_id: form.primaryStatId || null,
          created_at: now,
          updated_at: now,
        };
        await db.logbook_metrics.add(metricRow as never);
        await queueWrite("logbook_metrics", metricId, "upsert", metricRow);
      }

      if (metricId && metricId !== "new") {
        const id = uuid();
        const row = {
          id,
          goal_id: goalId,
          logbook_metric_id: metricId,
          start_value: parseFloat(form.metricStartValue) || 0,
          target_value: parseFloat(form.metricTargetValue) || 0,
          target_revised_at: null,
          previous_target: null,
          updated_at: now,
        };
        await db.goal_metric_targets.add(row as never);
        await queueWrite("goal_metric_targets", id, "upsert", row);
      }
    }

    // Create milestones
    const validMilestones = form.milestones.filter((m) => m.name.trim());
    for (let i = 0; i < validMilestones.length; i++) {
      const m = validMilestones[i];
      const id = uuid();
      const row = {
        id,
        goal_id: goalId,
        name: m.name.trim(),
        description: null,
        sequence_order: i + 1,
        target_date: m.targetDate || null,
        completed_at: null,
        updated_at: now,
      };
      await db.goal_milestones.add(row as never);
      await queueWrite("goal_milestones", id, "upsert", row);
    }

    // Link existing habits
    for (const habitId of form.linkedHabitIds) {
      const id = uuid();
      const row = {
        id,
        goal_id: goalId,
        habit_id: habitId,
        required_streak: null,
      };
      await db.goal_habit_links.add(row as never);
      await queueWrite("goal_habit_links", id, "upsert", row);
    }

    // Create new micro-habits and link them
    for (const nh of form.newHabits.filter((h) => h.name.trim())) {
      const habitId = uuid();
      // Find max sequence_order in this time_block
      const existingInBlock = habits.filter(
        (h) => h.time_block === nh.timeBlock,
      );
      const maxOrder =
        existingInBlock.length > 0
          ? Math.max(...existingInBlock.map((h) => h.sequence_order))
          : 0;

      const habit = {
        id: habitId,
        user_id: userId,
        name: nh.name.trim(),
        description: null,
        frequency: "daily",
        time_block: nh.timeBlock,
        sequence_order: maxOrder + 1,
        completion_type: nh.completionType,
        completion_config: null,
        xp_min: 10,
        xp_max: 20,
        loot_drop_eligible: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      await db.habits.add(habit as never);
      await queueWrite("habits", habitId, "upsert", habit);

      // Create streak + maturity for new habit
      const streakId = uuid();
      const streakRow = {
        id: streakId,
        habit_id: habitId,
        user_id: userId,
        current_streak: 0,
        best_streak: 0,
        last_completed_date: null,
        updated_at: now,
      };
      await db.habit_streaks.add(streakRow as never);
      await queueWrite("habit_streaks", streakId, "upsert", streakRow);

      const maturityId = uuid();
      const maturityRow = {
        id: maturityId,
        habit_id: habitId,
        user_id: userId,
        stage: "fragile",
        consistent_days: 0,
        last_stage_changed_at: now,
        updated_at: now,
      };
      await db.habit_maturity.add(maturityRow as never);
      await queueWrite("habit_maturity", maturityId, "upsert", maturityRow);

      // Link to goal
      const linkId = uuid();
      const linkRow = {
        id: linkId,
        goal_id: goalId,
        habit_id: habitId,
        required_streak: null,
      };
      await db.goal_habit_links.add(linkRow as never);
      await queueWrite("goal_habit_links", linkId, "upsert", linkRow);

      // Create stat weight for primary stat if set
      if (form.primaryStatId) {
        const weightId = uuid();
        const weightRow = {
          id: weightId,
          habit_id: habitId,
          stat_id: form.primaryStatId,
          base_weight: 1.0,
          min_weight: 0.5,
          max_weight: 2.0,
          current_weight: 1.0,
          growth_rate: 0.12,
          decay_rate: 0.06,
          updated_at: now,
        };
        await db.habit_stat_weights.add(weightRow as never);
        await queueWrite("habit_stat_weights", weightId, "upsert", weightRow);
      }
    }

    router.push("/goals");
  };

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => (step === 0 ? router.back() : back())}
          className="p-1 -ml-1 active:opacity-50"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="text-[11px] text-muted-foreground">{STEPS[step]}</p>
        <div className="w-6" /> {/* spacer */}
      </div>

      <ProgressDots current={step} total={STEPS.length} />

      {/* Step Content */}
      <div className="flex-1 mt-8 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {step === 0 && <StepNameWhy form={form} onChange={onChange} />}
            {step === 1 && (
              <StepStat form={form} onChange={onChange} stats={stats} />
            )}
            {step === 2 && (
              <StepMetric form={form} onChange={onChange} metrics={metrics} />
            )}
            {step === 3 && (
              <StepMilestones form={form} onChange={onChange} />
            )}
            {step === 4 && (
              <StepHabits
                form={form}
                onChange={onChange}
                habits={habits}
              />
            )}
            {step === 5 && (
              <StepStakes form={form} onChange={onChange} stats={stats} />
            )}
            {step === 6 && (
              <StepConfirm
                form={form}
                stats={stats}
                habits={habits}
                metrics={metrics}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="flex gap-3 pt-4">
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={!canProceed}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] transition-opacity"
            style={{
              backgroundColor: canProceed
                ? "hsl(var(--foreground))"
                : "hsl(var(--muted))",
              color: canProceed
                ? "hsl(var(--background))"
                : "hsl(var(--muted-foreground))",
              opacity: canProceed ? 1 : 0.5,
            }}
          >
            {step >= 2 && step <= 4 ? "Skip" : "Next"}
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleCommit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] transition-opacity"
            style={{
              backgroundColor: "hsl(var(--foreground))",
              color: "hsl(var(--background))",
              opacity: saving ? 0.5 : 1,
            }}
          >
            <Check size={16} />
            {saving ? "Saving…" : "Commit"}
          </button>
        )}
      </div>
    </div>
  );
}
