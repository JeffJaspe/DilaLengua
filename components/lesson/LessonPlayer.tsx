"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Lesson } from "@/content/types";
import { canCheck, gradePage, isGraded, praise, type Feedback, type PageValue } from "@/lib/grade-page";
import { api, today } from "@/lib/client/api";
import { useProgress, type Me } from "@/lib/client/store";
import { stopSpeaking } from "@/lib/client/audio";
import { PageView } from "./Pages";
import { Sol } from "../Sol";
import { Confetti } from "../Confetti";
import { IconCheck, IconHeart, IconX } from "../icons";

const HEARTS = 5;

export function LessonPlayer({ lesson, topicTitle, nextHref }: { lesson: Lesson; topicTitle: string; nextHref: string }) {
  const setMe = useProgress((s) => s.setMe);
  const [step, setStep] = useState(0);
  const [value, setValue] = useState<PageValue | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [hearts, setHearts] = useState(HEARTS);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<{ xp: number; score: number; me: Me } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const pages = lesson.pages;
  const page = pages[step];
  const graded = pages.filter(isGraded).length;
  const pct = result ? 100 : Math.round((step / pages.length) * 100);

  useEffect(() => () => stopSpeaking(), []);

  const finish = useCallback(async () => {
    const score = graded ? Math.round(((graded - Math.min(mistakes, graded)) / graded) * 100) : 100;
    setSaving(true);
    setSaveError("");
    try {
      const r = await api<{ xp: number; me: Me }>("/api/progress/lesson", { body: { lessonId: lesson.id, score, today: today() } });
      setMe(r.me);
      setResult({ xp: r.xp, score, me: r.me });
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [graded, mistakes, lesson.id, setMe]);

  const next = () => {
    stopSpeaking();
    setFeedback(null);
    setValue(null);
    if (step + 1 >= pages.length) finish();
    else setStep(step + 1);
  };

  const check = () => {
    const f = gradePage(page, value, step);
    setFeedback(f);
    if (!f.ok) {
      setMistakes((m) => m + 1);
      setHearts((h) => Math.max(0, h - 1));
    }
  };

  const restart = () => {
    setStep(0);
    setValue(null);
    setFeedback(null);
    setHearts(HEARTS);
    setMistakes(0);
  };

  // Match pages finish themselves; show success straight away.
  const matchDone = page?.type === "match" && value?.kind === "done";
  const needsCheck = page && isGraded(page);
  const outOfHearts = hearts === 0 && !!feedback && !feedback.ok;

  if (result) return <LessonDone lesson={lesson} result={result} nextHref={nextHref} />;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-2.5 px-4 pt-4 pb-2">
        <Link href="/" className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-ink" aria-label="Close lesson">
          <IconX />
        </Link>
        <div className="h-[18px] flex-1 overflow-hidden rounded-full border-3 border-ink bg-paper" role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <div className="h-full border-r-3 border-ink bg-mint transition-[width] duration-500 [transition-timing-function:cubic-bezier(.3,1.4,.5,1)]" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-1 font-display text-lg font-extrabold" aria-label={`${hearts} hearts left`}>
          <IconHeart />
          <span>{hearts}</span>
        </div>
      </header>
      <div className="px-5 text-xs font-bold tracking-wide text-ink/80 uppercase">
        {topicTitle} · {lesson.title}
      </div>

      <main className="flex-1 px-5 pt-3 pb-5" key={step}>
        {outOfHearts ? (
          <div className="flex animate-pop flex-col items-center gap-4 pt-10 text-center">
            <Sol size={120} />
            <h1 className="m-0 font-display text-3xl font-extrabold">Out of hearts</h1>
            <p className="m-0 max-w-[300px] text-[15px]">Mistakes are how you learn. Take a breath and run the lesson again; it's shorter the second time.</p>
          </div>
        ) : (
          <PageView page={page} value={value} setValue={setValue} locked={!!feedback} />
        )}
      </main>

      <footer
        className={`sticky bottom-0 flex flex-col gap-3 border-t-3 border-ink px-5 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] ${
          outOfHearts ? "bg-paper" : feedback ? (feedback.ok ? "bg-mint" : "bg-coral") : matchDone ? "bg-mint" : "bg-paper"
        }`}
        aria-live="polite"
      >
        {outOfHearts ? (
          <div className="flex gap-2.5">
            <Link href="/" className="btn btn-paper">
              Later
            </Link>
            <button type="button" className="btn btn-ink" onClick={restart}>
              Restart lesson
            </button>
          </div>
        ) : (
          <>
            {(feedback || matchDone) && (
              <div className="flex animate-pop items-center gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-3 border-ink bg-paper">
                  {feedback && !feedback.ok ? <IconX size={22} /> : <IconCheck size={24} />}
                </div>
                <div>
                  <div className="font-display text-[22px] font-extrabold">{feedback ? feedback.title : praise(step)}</div>
                  {(feedback?.hint || matchDone) && <div className="mt-0.5 text-sm font-semibold">{feedback?.hint ?? "All pairs matched."}</div>}
                </div>
              </div>
            )}
            {saveError && <div className="text-sm font-bold">Couldn't save: {saveError}</div>}
            {needsCheck && !feedback ? (
              <button type="button" className="btn btn-coral" disabled={!canCheck(page, value)} onClick={check}>
                Check
              </button>
            ) : (
              <button
                type="button"
                className={`btn ${feedback || matchDone ? "btn-ink" : "btn-coral"}`}
                disabled={saving || (page.type === "match" && !matchDone)}
                onClick={next}
              >
                {saving ? "Saving…" : page.type === "match" && !matchDone ? "Match all pairs" : page.type === "explain" ? "¡Entendido! Got it" : page.type === "speak" && value?.kind !== "done" ? "Skip for now" : step + 1 >= pages.length ? "Finish lesson" : "Continue"}
              </button>
            )}
          </>
        )}
      </footer>
    </div>
  );
}

function LessonDone({ lesson, result, nextHref }: { lesson: Lesson; result: { xp: number; score: number; me: Me }; nextHref: string }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Confetti />
      <main className="relative flex flex-1 animate-pop flex-col items-center gap-4 px-5 pt-14 text-center">
        <Sol size={140} mood="cheer" label="Sol cheering" />
        <h1 className="m-0 font-display text-[38px] leading-none font-extrabold">¡Lección completa!</h1>
        <p className="m-0 text-base font-medium">
          {lesson.title} · {lesson.words.length} words added to your review deck.
        </p>
        <div className="grid w-full grid-cols-3 gap-2.5">
          <Stat label="XP" value={`+${result.xp}`} bg="bg-sky" />
          <Stat label="Accuracy" value={`${result.score}%`} bg="bg-mint" />
          <Stat label="Streak" value={`${result.me.streak} ${result.me.streak === 1 ? "day" : "days"}`} bg="bg-coral" />
        </div>
      </main>
      <footer className="relative flex flex-col gap-3 px-5 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <Link href={nextHref} className="btn btn-ink">
          Continue
        </Link>
        <Link href="/" className="btn btn-paper">
          Back to the path
        </Link>
      </footer>
    </div>
  );
}

function Stat({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <div className={`flex flex-col gap-0.5 rounded-2xl border-3 border-ink px-1.5 py-3 shadow-chunky-sm ${bg}`}>
      <span className="text-[11px] font-bold tracking-wider uppercase">{label}</span>
      <span className="font-display text-2xl font-extrabold">{value}</span>
    </div>
  );
}
