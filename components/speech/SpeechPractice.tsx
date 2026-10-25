"use client";
import { useEffect, useMemo } from "react";
import { compareSpeech } from "@/lib/answers";
import { preloadWhisper, useSpeech } from "@/lib/client/speech";
import { speak } from "@/lib/client/audio";
import { SpeakButtons } from "../SpeakButtons";
import { MicButton, SpeechStatus } from "./MicButton";
import { IconPlay } from "../icons";

/** Lesson speaking practice: say the phrase, see which words came through, compare with the native audio. */
export function SpeechPractice({ es, en, onResult }: { es: string; en: string; onResult: (score: number) => void }) {
  const s = useSpeech();
  useEffect(() => {
    preloadWhisper();
  }, []);
  const result = useMemo(() => (s.phase === "done" ? compareSpeech(es, s.transcript) : null), [s.phase, s.transcript, es]);
  useEffect(() => {
    if (result) onResult(result.score);
  }, [result, onResult]);

  return (
    <>
      <div className="card flex flex-col gap-3 p-4">
        <div className="text-sm font-semibold text-muted">Say this out loud</div>
        <div className="font-display text-[28px] leading-tight font-extrabold">{es}</div>
        <div className="flex items-center gap-3">
          <SpeakButtons text={es} />
          <span className="text-sm font-medium text-muted">{en}</span>
        </div>
      </div>

      {!result && s.phase !== "error" && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <MicButton phase={s.phase} onStart={s.start} onStop={s.stop} />
          {s.phase === "idle" ? (
            <>
              <div className="font-display text-xl font-extrabold">Tap and speak</div>
              <div className="max-w-[270px] text-center text-sm text-muted">Your voice is checked on your phone. Nothing is uploaded.</div>
            </>
          ) : (
            <SpeechStatus phase={s.phase} progress={s.progress} />
          )}
        </div>
      )}

      {s.phase === "error" && (
        <div className="rounded-2xl border-3 border-dashed border-ink bg-paper/70 p-4 text-[15px] font-semibold">
          {s.error} You can skip this page and continue.
          <button type="button" className="mt-2 block text-sm font-bold underline" onClick={s.reset}>
            Try again
          </button>
        </div>
      )}

      {result && (
        <div className="flex animate-pop flex-col gap-4">
          <div className="card flex items-center gap-4 p-4">
            <div
              className="flex h-24 w-24 flex-none items-center justify-center rounded-full border-3 border-ink"
              style={{ background: `conic-gradient(${result.score === 100 ? "#3DDC97" : "#FF6B57"} ${result.score * 3.6}deg, #ECE5CF 0deg)` }}
              role="img"
              aria-label={`Score ${result.score} percent`}
            >
              <b className="flex h-[68px] w-[68px] items-center justify-center rounded-full border-3 border-ink bg-paper font-display text-[22px] font-extrabold">{result.score}%</b>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold tracking-wider uppercase">We heard</div>
              <div className="font-display text-lg font-bold break-words">“{s.transcript || "…"}”</div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {result.words.map((w, i) => (
              <div
                key={i}
                className={`flex flex-col items-center gap-0.5 rounded-[14px] border-3 border-ink px-3 py-2 font-display text-xl font-extrabold shadow-chunky-sm ${
                  w.ok ? "bg-mint" : "animate-shake bg-coral underline decoration-wavy decoration-2 underline-offset-[5px]"
                }`}
              >
                {w.word}
                <small className="font-sans text-[11px] font-bold tracking-wide uppercase no-underline">{w.ok ? "Got it" : "Try again"}</small>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5">
            <button type="button" className="btn btn-paper h-[52px] text-[15px]" onClick={s.playRecording} disabled={!s.hasRecording}>
              <IconPlay size={18} /> Your voice
            </button>
            <button type="button" className="btn btn-sky h-[52px] text-[15px]" onClick={() => speak(es)}>
              <IconPlay size={18} /> Native
            </button>
          </div>
          <button type="button" className="text-sm font-bold underline" onClick={s.reset}>
            Record again
          </button>
        </div>
      )}
    </>
  );
}
