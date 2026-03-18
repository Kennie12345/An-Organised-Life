"use client";

import { useState } from "react";

type CompletionConfig = {
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  placeholder?: string;
  parts?: Array<{
    type: "categorical" | "scale";
    label: string;
    options: string[];
  }>;
} | null;

interface CompletionInputProps {
  type: string;
  config: CompletionConfig;
  onComplete: (value: string) => void;
}

const BTN =
  "rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background disabled:opacity-40 active:opacity-70";
const OPTION_BTN = (active: boolean) =>
  `rounded-xl border px-4 py-3 text-sm font-medium transition-colors active:opacity-70 ${
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border"
  }`;
const INPUT =
  "w-full rounded-xl border border-border bg-background px-3 py-3 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function CompletionInput({ type, config, onComplete }: CompletionInputProps) {
  const [value, setValue] = useState("");
  const [parts, setParts] = useState<string[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  if (type === "boolean") {
    return (
      <button onClick={() => onComplete("true")} className={`mt-3 w-full ${BTN}`}>
        Mark done
      </button>
    );
  }

  if (type === "numeric") {
    return (
      <div className="mt-3 flex gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={config?.unit ? `0 ${config.unit}` : "0"}
          min={config?.min}
          max={config?.max}
          step={config?.step ?? 0.1}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => value && onComplete(value)}
          disabled={!value}
          className={BTN}
        >
          Log
        </button>
      </div>
    );
  }

  if (type === "categorical" || type === "scale") {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {(config?.options ?? []).map((opt) => (
          <button key={opt} onClick={() => onComplete(opt)} className={OPTION_BTN(false)}>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (type === "time_range") {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">Start</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={INPUT} />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">End</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={INPUT} />
          </div>
        </div>
        <button
          onClick={() => start && end && onComplete(`${start}-${end}`)}
          disabled={!start || !end}
          className={`w-full ${BTN}`}
        >
          Log
        </button>
      </div>
    );
  }

  if (type === "text") {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={config?.placeholder ?? "Write something…"}
          rows={3}
          className={`${INPUT} resize-none`}
        />
        <button
          onClick={() => value.trim() && onComplete(value.trim())}
          disabled={!value.trim()}
          className={`w-full ${BTN}`}
        >
          Log
        </button>
      </div>
    );
  }

  if (type === "composite") {
    const defs = config?.parts ?? [];
    const allSelected = defs.length > 0 && parts.length === defs.length && parts.every(Boolean);
    return (
      <div className="mt-3 flex flex-col gap-3">
        {defs.map((def, i) => (
          <div key={i}>
            <p className="text-xs text-muted-foreground mb-1.5">{def.label}</p>
            <div className="flex flex-wrap gap-2">
              {def.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    const next = [...parts];
                    next[i] = opt;
                    setParts(next);
                  }}
                  className={OPTION_BTN(parts[i] === opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={() => allSelected && onComplete(parts.join("|"))}
          disabled={!allSelected}
          className={`w-full ${BTN}`}
        >
          Log
        </button>
      </div>
    );
  }

  // Fallback
  return (
    <button onClick={() => onComplete("done")} className={`mt-3 w-full ${BTN}`}>
      Mark done
    </button>
  );
}
