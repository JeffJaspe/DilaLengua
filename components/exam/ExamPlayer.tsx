"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, today } from "@/lib/client/api";
import { speak, stopSpeaking } from "@/lib/client/audio";
import { preloadWhisper, useSpeech } from "@/lib/client/speech";
import { useProgress } from "@/lib/client/store";
import { ChoiceList, TileBuilder, TypeAnswer } from "../lesson/widgets";
import { MicButton, SpeechStatus } from "../speech/MicButton";
import { Confetti } from "../Confetti";
import { IconCheck, IconClock, IconLock, IconPlay, IconX } from "../icons";

type Skill = "listening" | "reading" | "vocabulary" | "speaking";
type Q =
  | { id: string; skill: Skill; type: "choice"; prompt: string; options: string[] }
  | { id: string; skill: Skill; type: "listen"; say: string; prompt: string; options: string[] }
  | { id: string; skill: Skill; type: "type"; prompt: string; before?: string; after?: string }
  | { id: string; skill: Skill; type: "build"; en: string; tiles: string[] }
  | { id: string; skill: Skill; type: "speak"; say: string; prompt: string };
type Answer = number | string | string[] | { transcript: string } | { skipped: true } | null;
type Started = { attemptId: string; kind: "topic" | "practice" | "final"; title: string; minutes: number; expiresAt: string; questions: Q[] };
type Result = {
  kind: string;
  score: number;
  passed: boolean;
  right: number;
  total: number;
  passMark: number;
  xp: number;
  retryAt: string | null;
  review: { id: string; skill: Skill; prompt: string; yours: string; correct: string; ok: boolean; counted: boolean }[];
};

export type ExamIntro = {
  kind: "topic" | "final";
  id: string;
  title: string;
  subtitle: string;
  questions: number;
  minutes: number;
  badge: string;
  nextLabel: string;
  topicHref?: string;
};

const SKILL_COLOR: Record<Skill, string> = { listening: "bg-sky", reading: "bg-mint", vocabulary: "bg-sun", speaking: "bg-coral" };

export function ExamPlayer({ intro }: { intro: ExamIntro }) {
  const refresh = useProgress((s) => s.refresh);
  const [exam, setExam] = useState<Started | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [tileIdx, setTileIdx] = useState<Record<string, number[]>>({});
  const [i, setI] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<{ message: string; status: number; data: Record<string, unknown> } | null>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const submitted = useRef(false);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<Started>("/api/exam/start", { body: { kind: intro.kind, id: intro.id } });
      setExam(r);
      setAnswers({});
      setTileIdx({});
      setI(0);
      submitted.current = false;
      if (r.questions.some((q) => q.type === "speak")) preloadWhisper();
    } catch (e) {
      const err = e as ApiError;
      setError({ message: err.message, status: err.status, data: err.data });
    } finally {
      setBusy(false);
    }
  };

  const submit = useCallback(async () => {
    if (!exam || submitted.current) return;
    submitted.current = true;
    stopSpeaking();
    setBusy(true);
    try {
      const r = await api<Result>("/api/exam/submit", { body: { attemptId: exam.attemptId, answers, today: today() } });
      setResult(r);
      refresh();
    } catch (e) {
      submitted.current = false;
      setError({ message: (e as Error).message, status: 0, data: {} });
    } finally {
      setBusy(false);
    }
  }, [exam, answers, refresh]);

  // Countdown; time's up submits whatever is answered.
  useEffect(() => {
    if (!exam || result) return;
    const end = Date.parse(exam.expiresAt) - 60_000;
    const tick = () => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) submit();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [exam, result, submit]);

  useEffect(() => () => stopSpeaking(), []);

  if (result) return <ExamResult intro={intro} result={result} onRetake={() => { setResult(null); setExam(null); }} />;

  if (!exam) {
    return (
      <div className="flex min-h-dvh flex-col">
        <ExamHeader />
        <main className="flex flex-1 animate-pop flex-col gap-4 px-5 pt-3 pb-6">
          <span className="eyebrow">{intro.kind === "final" ? `Final exam · ${intro.badge}` : "Topic test"}</span>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="m-0 font-display text-[36px] leading-none font-extrabold">{intro.title}</h1>
              <p className="mt-1.5 text-[15px] font-medium">{intro.subtitle}</p>
            </div>
            <Medal text={intro.badge} />
          </div>
          <div className="card divide-y-2 divide-dashed divide-ink/25 px-4 py-1.5">
            {(
              [
                ["listening", "Listening", "Hear it, pick the answer"],
                ["reading", "Reading", "Sentences and word order"],
                ["vocabulary", "Vocabulary", "Words from the whole topic"],
                ["speaking", "Speaking", "Answer questions out loud"],
              ] as [Skill, string, string][]
            ).map(([k, name, sub]) => (
              <div key={k} className="flex items-center gap-3 py-2.5">
                <span className={`h-10 w-10 flex-none rounded-xl border-3 border-ink ${SKILL_COLOR[k]}`} aria-hidden />
                <div>
                  <div className="font-bold">{name}</div>
                  <div className="text-[13px] text-muted">{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-[13px] font-bold">
            {[`${intro.questions} questions`, `${intro.minutes} minutes`, "Pass mark 85%", "No hints", intro.kind === "final" ? "Retake after 24 h" : "Retake anytime"].map((c) => (
              <span key={c} className="rounded-full border-[2.5px] border-ink bg-paper px-2.5 py-1.5">
                {c}
              </span>
            ))}
          </div>
          <p className="m-0 text-[13.5px] leading-snug font-medium">
            Questions are drawn at random, so every attempt is different. You'll see your answers and the correct ones at the end.
          </p>
          {error && (
            <div className="rounded-2xl border-3 border-dashed border-ink bg-paper p-4 text-[15px] font-semibold">
              {error.message}
              {typeof error.data.retryAt === "string" && <div className="mt-1">You can retake it on {new Date(error.data.retryAt).toLocaleString()}.</div>}
              {typeof error.data.certificateId === "string" && (
                <Link href={`/certificate/${error.data.certificateId}`} className="mt-2 block font-bold underline">
                  View your certificate
                </Link>
              )}
              {error.status === 403 && intro.topicHref && (
                <Link href={intro.topicHref} className="mt-2 block font-bold underline">
                  Go to the topic
                </Link>
              )}
            </div>
          )}
        </main>
        <footer className="sticky bottom-0 border-t-3 border-ink bg-paper px-5 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          <button type="button" className="btn btn-ink" onClick={start} disabled={busy}>
            {busy ? "Preparing questions…" : `Start ${intro.kind === "final" ? "the exam" : "the test"}`}
          </button>
        </footer>
      </div>
    );
  }

  const q = exam.questions[i];
  const a = answers[q.id] ?? null;
  const answered =
    a !== null &&
    (typeof a === "number" ? a >= 0 : typeof a === "string" ? a.trim().length > 0 : Array.isArray(a) ? a.length > 0 : true);
  const setA = (v: Answer) => setAnswers((s) => ({ ...s, [q.id]: v }));
  const last = i + 1 >= exam.questions.length;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-2.5 px-4 pt-[18px] pb-2">
        <Link href={intro.topicHref ?? "/"} className="flex h-11 w-11 flex-none items-center justify-center rounded-xl" aria-label="Leave the exam">
          <IconX />
        </Link>
        <div className="flex h-3.5 flex-1 gap-[3px]" aria-label={`Question ${i + 1} of ${exam.questions.length}`}>
          {exam.questions.map((x, k) => (
            <div key={x.id} className={`flex-1 rounded-full border-2 border-ink ${k < i ? "bg-ink" : k === i ? "bg-coral" : "bg-paper"}`} />
          ))}
        </div>
        <div className={`flex h-9 items-center gap-1 rounded-full border-3 border-ink px-2.5 font-display text-[15px] font-extrabold tabular-nums ${left < 60 ? "bg-coral" : "bg-paper"}`} aria-label={`Time left ${mm} minutes ${ss} seconds`}>
          <IconClock />
          {mm}:{ss}
        </div>
      </header>
      <main key={q.id} className="flex flex-1 animate-pop flex-col gap-4 px-5 pt-2 pb-5">
        <span className="eyebrow">
          {i + 1} · {q.skill}
        </span>
        {q.type === "choice" && (
          <>
            <h2 className="m-0 font-display text-2xl leading-tight font-extrabold">{q.prompt}</h2>
            <ChoiceList options={q.options} value={typeof a === "number" ? a : -1} onChange={setA} />
          </>
        )}
        {q.type === "listen" && (
          <>
            <ListenOnce text={q.say} />
            <h2 className="m-0 font-display text-2xl leading-tight font-extrabold">{q.prompt}</h2>
            <ChoiceList options={q.options} value={typeof a === "number" ? a : -1} onChange={setA} />
          </>
        )}
        {q.type === "type" && <TypeAnswer id={`q-${q.id}`} label={q.prompt} before={q.before} after={q.after} value={typeof a === "string" ? a : ""} onChange={setA} />}
        {q.type === "build" && (
          <>
            <div className="rounded-[18px_18px_18px_4px] border-3 border-ink bg-paper px-3.5 py-2.5 text-[15px] font-semibold shadow-chunky-sm">Translate: {q.en}</div>
            <TileBuilder
              tiles={q.tiles}
              value={tileIdx[q.id] ?? []}
              onChange={(idx) => {
                setTileIdx((s) => ({ ...s, [q.id]: idx }));
                setA(idx.map((n) => q.tiles[n]));
              }}
            />
          </>
        )}
        {q.type === "speak" && <SpeakAnswer q={q} answer={a} onAnswer={setA} />}
        {error && <p className="m-0 font-semibold">{error.message}</p>}
      </main>
      <footer className="sticky bottom-0 flex gap-2.5 border-t-3 border-ink bg-paper px-5 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        {i > 0 && (
          <button type="button" className="btn btn-paper w-28 flex-none" onClick={() => setI(i - 1)}>
            Back
          </button>
        )}
        <button type="button" className="btn btn-coral" disabled={!answered || busy} onClick={() => (last ? submit() : setI(i + 1))}>
          {busy ? "Grading…" : last ? `Finish ${intro.kind === "final" ? "exam" : "test"}` : "Next"}
        </button>
      </footer>
    </div>
  );
}

function ExamHeader() {
  return (
    <header className="flex items-center gap-2 px-4 pt-[18px]">
      <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-xl" aria-label="Back to the path">
        <IconX />
      </Link>
    </header>
  );
}

function Medal({ text }: { text: string }) {
  return (
    <svg width="84" height="96" viewBox="0 0 84 96" aria-hidden className="flex-none">
      <path d="M24 54 14 92l16-8 10 12 6-36z" fill="#FF6B57" stroke="#1E1B3A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 54l10 38-16-8-10 12-6-36z" fill="#5BC0EB" stroke="#1E1B3A" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="42" cy="38" r="32" fill="#FF9F1C" stroke="#1E1B3A" strokeWidth="3.5" />
      <circle cx="42" cy="38" r="21" fill="#FFD23F" stroke="#1E1B3A" strokeWidth="3" />
      <text x="42" y="46" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="22" fill="#1E1B3A">
        {text}
      </text>
    </svg>
  );
}

/** Exam audio: two plays, like a real listening test. */
function ListenOnce({ text, label = "Listen to the recording" }: { text: string; label?: string }) {
  const [plays, setPlays] = useState(2);
  return (
    <div className="card flex items-center gap-4 p-4">
      <button
        type="button"
        disabled={plays <= 0}
        onClick={() => {
          speak(text);
          setPlays(plays - 1);
        }}
        aria-label="Play the recording"
        className="press flex h-[76px] w-[76px] flex-none items-center justify-center rounded-full border-3 border-ink bg-sky shadow-chunky disabled:border-stone disabled:bg-sand disabled:text-muted-2"
      >
        <IconPlay size={34} />
      </button>
      <div>
        <div className="font-display text-xl font-extrabold">{label}</div>
        <div className="text-sm font-semibold text-muted">
          {plays} {plays === 1 ? "play" : "plays"} left
        </div>
      </div>
    </div>
  );
}

function SpeakAnswer({ q, answer, onAnswer }: { q: Extract<Q, { type: "speak" }>; answer: Answer; onAnswer: (a: Answer) => void }) {
  const s = useSpeech();
  useEffect(() => {
    if (s.phase === "done") onAnswer(s.transcript ? { transcript: s.transcript } : null);
  }, [s.phase, s.transcript, onAnswer]);
  const skipped = !!answer && typeof answer === "object" && "skipped" in answer;
  return (
    <>
      {q.say ? <ListenOnce text={q.say} label="Audio only" /> : null}
      <h2 className="m-0 font-display text-2xl leading-tight font-extrabold">{q.prompt}</h2>
      {skipped ? (
        <div className="rounded-2xl border-3 border-dashed border-ink bg-paper/70 p-4 font-semibold">
          Skipped. This question won't count toward your score.
          <button type="button" className="mt-2 block text-sm font-bold underline" onClick={() => onAnswer(null)}>
            Try the microphone again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <MicButton phase={s.phase} onStart={s.start} onStop={s.stop} />
          {s.phase === "idle" && <div className="font-display text-xl font-extrabold">Tap to answer</div>}
          <SpeechStatus phase={s.phase} progress={s.progress} />
          {s.phase === "done" && (
            <div className="w-full rounded-2xl border-3 border-dashed border-ink bg-paper/70 p-3 text-center">
              <div className="text-[11px] font-bold tracking-wider uppercase">Your answer</div>
              <div className="text-lg font-bold">“{s.transcript || "(nothing heard, try again)"}”</div>
              <button type="button" className="mt-1 text-sm font-bold underline" onClick={s.reset}>
                Record again
              </button>
            </div>
          )}
          {s.phase === "error" && <p className="m-0 text-center font-semibold">{s.error}</p>}
          {(s.phase === "error" || !s.supported) && (
            <button type="button" className="text-sm font-bold underline" onClick={() => onAnswer({ skipped: true })}>
              Can't use a microphone? Skip this question
            </button>
          )}
        </div>
      )}
    </>
  );
}

function ExamResult({ intro, result, onRetake }: { intro: ExamIntro; result: Result; onRetake: () => void }) {
  const final = intro.kind === "final";
  const practice = result.kind === "practice";
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {result.passed && <Confetti />}
      <main className="relative flex flex-1 animate-pop flex-col items-center gap-4 px-5 pt-10 pb-6">
        <div
          className={`flex h-[150px] w-[150px] animate-stamp flex-col items-center justify-center rounded-full border-4 border-ink [box-shadow:0_7px_0_var(--color-ink)] ${result.passed ? "bg-mint" : "bg-coral"}`}
          style={{ transform: "rotate(-8deg)" }}
        >
          <div className="font-display text-[40px] leading-none font-extrabold">{result.score}%</div>
          <div className="text-[15px] font-extrabold tracking-[1.5px]">{result.passed ? "APROBADO" : "CASI"}</div>
        </div>
        <div className="text-center">
          <h1 className="m-0 font-display text-[28px] leading-tight font-extrabold">
            {practice ? "Practice done" : result.passed ? (final ? `¡Felicidades! ${intro.badge} complete` : `¡Aprobado! ${intro.nextLabel} unlocked`) : `So close. You need ${result.passMark}%`}
          </h1>
          <p className="m-0 mt-1 text-[15px] font-medium">
            {result.right} of {result.total} correct.{" "}
            {practice
              ? "Practice never changes your progress."
              : result.passed
                ? final
                  ? "Your certificate is ready."
                  : `+${result.xp} XP.`
                : final
                  ? `Review your weakest topics. You can retake it after ${result.retryAt ? new Date(result.retryAt).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }) : "24 hours"}.`
                  : "Review your mistakes below, then retake with new questions."}
          </p>
        </div>
        <ol className="card m-0 w-full list-none divide-y-2 divide-dashed divide-ink/25 px-4 py-1">
          {result.review.map((r) => (
            <li key={r.id} className="flex items-start gap-2.5 py-2.5">
              <span className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border-[2.5px] border-ink ${!r.counted ? "bg-sand" : r.ok ? "bg-mint" : "bg-coral"}`}>
                {!r.counted ? <IconLock size={13} /> : r.ok ? <IconCheck size={14} /> : <IconX size={12} />}
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-extrabold">{r.prompt}</div>
                <div>You: {r.yours}</div>
                {!r.ok && r.counted && <div className="font-bold">Answer: {r.correct}</div>}
              </div>
            </li>
          ))}
        </ol>
      </main>
      <footer className="sticky bottom-0 flex gap-2.5 border-t-3 border-ink bg-paper px-5 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        {result.passed && final ? (
          <Link href="/certificate/claim" className="btn btn-ink">
            Get my certificate
          </Link>
        ) : result.passed || practice ? (
          <>
            {!final && (
              <button type="button" className="btn btn-paper" onClick={onRetake}>
                Practise again
              </button>
            )}
            <Link href="/" className="btn btn-ink">
              Continue
            </Link>
          </>
        ) : (
          <>
            <Link href={intro.topicHref ?? "/"} className="btn btn-paper">
              Review lessons
            </Link>
            {!final && (
              <button type="button" className="btn btn-ink" onClick={onRetake}>
                Retake
              </button>
            )}
          </>
        )}
      </footer>
    </div>
  );
}
