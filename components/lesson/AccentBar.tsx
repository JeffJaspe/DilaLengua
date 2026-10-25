"use client";

const LETTERS = ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"];

/** On-screen Spanish letters for phones and keyboards without them. */
export function AccentBar({ onInsert, disabled }: { onInsert: (c: string) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-9 gap-[5px]" role="group" aria-label="Spanish letters">
      {LETTERS.map((c) => (
        <button
          key={c}
          type="button"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsert(c)}
          aria-label={`Insert ${c}`}
          className="press h-[46px] rounded-xl border-3 border-ink bg-paper p-0 font-display text-lg font-extrabold text-ink shadow-chunky-sm disabled:opacity-60"
        >
          {c}
        </button>
      ))}
    </div>
  );
}
