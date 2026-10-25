"use client";
// Answer widgets shared by lessons (with instant feedback) and exams (no feedback).
import { useRef } from "react";
import { AccentBar } from "./AccentBar";

export function ChoiceList({
  options,
  value,
  onChange,
  locked,
  answer,
  grid,
}: {
  options: string[];
  value: number;
  onChange: (i: number) => void;
  locked?: boolean;
  /** When set (after checking in a lesson), shows right and wrong. */
  answer?: number;
  grid?: boolean;
}) {
  return (
    <div className={grid ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"} role="radiogroup">
      {options.map((label, i) => {
        let state = "";
        if (answer !== undefined) {
          if (i === answer) state = "is-right";
          else if (i === value) state = "is-wrong";
        } else if (i === value) state = "is-selected";
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={i === value}
            disabled={locked}
            onClick={() => onChange(i)}
            className={`opt ${state} ${grid ? "min-h-[92px] flex-col items-start justify-between" : ""}`}
          >
            <span className="opt-key">{i + 1}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Tap tiles to build a sentence; tap a placed tile to send it back. `value` holds tile indices in order. */
export function TileBuilder({ tiles, value, onChange, locked }: { tiles: string[]; value: number[]; onChange: (idx: number[]) => void; locked?: boolean }) {
  return (
    <>
      <div
        aria-label="Your answer"
        className="flex min-h-[132px] flex-wrap content-start gap-2 py-1.5"
        style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 60px, #1E1B3A 60px, #1E1B3A 63px)" }}
      >
        {value.length === 0 && <span className="px-1 py-4 text-[15px] font-medium text-muted">Tap the words below in order…</span>}
        {value.map((ti, pos) => (
          <button key={`${ti}-${pos}`} type="button" disabled={locked} className="tile animate-pop" onClick={() => onChange(value.filter((_, p) => p !== pos))}>
            {tiles[ti]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        {tiles.map((w, i) => {
          const used = value.includes(i);
          return (
            <button key={i} type="button" disabled={used || locked} aria-hidden={used} className={`tile ${used ? "is-used" : ""}`} onClick={() => onChange([...value, i])}>
              {w}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function TypeAnswer({
  label,
  before,
  after,
  value,
  onChange,
  locked,
  id = "answer",
}: {
  label: string;
  before?: string;
  after?: string;
  value: string;
  onChange: (v: string) => void;
  locked?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const insert = (c: string) => {
    const el = ref.current;
    if (!el) return onChange(value + c);
    const s = el.selectionStart ?? value.length;
    const e = el.selectionEnd ?? value.length;
    const next = value.slice(0, s) + c + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + c.length, s + c.length);
    });
  };
  return (
    <>
      <div className="card flex flex-col gap-2.5 p-4">
        <label htmlFor={id} className="text-sm font-medium text-muted">
          {label}
        </label>
        <div className="flex items-center gap-1.5 font-display text-2xl font-extrabold">
          {before && <span className="whitespace-pre">{before.trim()}</span>}
          <input
            id={id}
            ref={ref}
            value={value}
            disabled={locked}
            onChange={(e) => onChange(e.target.value)}
            placeholder="type here"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="h-13 min-w-0 flex-1 border-0 border-b-4 border-ink bg-transparent text-center font-display text-2xl font-extrabold text-ink outline-none placeholder:text-base placeholder:font-medium placeholder:text-muted-2 focus:bg-[#FFF0B3]"
          />
          {after && <span className="whitespace-pre">{after.trim()}</span>}
        </div>
      </div>
      <AccentBar onInsert={insert} disabled={locked} />
      <p className="m-0 text-center text-sm text-muted">No Spanish keyboard? Tap the letters above.</p>
    </>
  );
}
