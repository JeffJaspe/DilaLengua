"use client";
import { IconMic } from "../icons";
import type { SpeechPhase } from "@/lib/client/speech";

/** The big round mic, with pulsing rings while recording. */
export function MicButton({ phase, onStart, onStop }: { phase: SpeechPhase; onStart: () => void; onStop: () => void }) {
  const recording = phase === "recording";
  const busy = phase === "loading" || phase === "thinking";
  return (
    <div className="relative flex h-[132px] w-[132px] items-center justify-center">
      {recording && (
        <>
          <span className="absolute inset-0 animate-ring rounded-full border-3 border-ink" />
          <span className="absolute inset-0 animate-ring rounded-full border-3 border-ink [animation-delay:0.7s]" />
        </>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={recording ? onStop : onStart}
        aria-label={recording ? "Stop recording" : "Tap and speak"}
        className={`press relative flex h-[112px] w-[112px] items-center justify-center rounded-full border-4 border-ink text-ink [box-shadow:0_7px_0_var(--color-ink)] disabled:opacity-80 ${recording ? "bg-mint" : "bg-coral"}`}
      >
        <IconMic size={48} />
      </button>
    </div>
  );
}

export function SpeechStatus({ phase, progress }: { phase: SpeechPhase; progress: number }) {
  if (phase === "recording")
    return (
      <div className="flex flex-col items-center gap-2" aria-live="polite">
        <div className="flex h-10 items-center gap-1.5" aria-hidden>
          {[0, 0.15, 0.3, 0.45, 0.6, 0.75].map((d) => (
            <span key={d} className="w-2 animate-bar rounded-full bg-ink" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
        <div className="font-display text-xl font-extrabold">Listening… tap to stop</div>
      </div>
    );
  if (phase === "loading")
    return (
      <div className="w-full max-w-[260px] text-center" aria-live="polite">
        <div className="font-display text-lg font-extrabold">Getting the speech checker ready</div>
        <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-sand">
          <div className="h-full bg-sky transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 text-xs font-semibold text-muted">First time only · downloads once, then works offline</div>
      </div>
    );
  if (phase === "thinking") return <div className="font-display text-xl font-extrabold" aria-live="polite">Checking…</div>;
  return null;
}
