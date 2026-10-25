"use client";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { computePath, type Outline } from "@/lib/progression";
import { useProgress } from "@/lib/client/store";
import { BottomNav } from "../BottomNav";
import { IconBack, IconChat, IconCheck, IconLock, IconPlay, IconShield } from "../icons";

export function TopicView({ outline, topicId }: { outline: Outline; topicId: string }) {
  const { progress, refresh, loaded } = useProgress();
  useEffect(() => {
    refresh();
  }, [refresh]);
  const path = useMemo(() => computePath(outline, progress), [outline, progress]);
  const t = path.topics.find((x) => x.id === topicId)!;

  return (
    <>
      <header className="flex items-center gap-2 px-4 pt-[18px] pb-1">
        <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-xl" aria-label="Back to the path">
          <IconBack />
        </Link>
        <div className="min-w-0">
          <div className="text-xs font-bold tracking-wider uppercase">
            {outline.code} · Topic {t.n}
          </div>
          <h1 className="m-0 font-display text-[24px] leading-tight font-extrabold">{t.title}</h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-5 pt-3 pb-6">
        <p className="m-0 text-[15px] font-medium">
          {t.en}. {t.lessonsDone} of {t.lessons.length} lessons done{t.passed ? ` · test passed with ${t.bestScore}%` : ""}.
        </p>
        {!t.unlocked && loaded && (
          <div className="rounded-2xl border-3 border-dashed border-ink bg-paper p-3 text-[15px] font-semibold">Pass the previous topic's test to open this topic.</div>
        )}
        <ol className="card m-0 list-none divide-y-2 divide-dashed divide-ink/25 p-0">
          {t.lessonStates.map((l, i) => {
            const inner = (
              <>
                <span
                  className={`flex h-11 w-11 flex-none items-center justify-center rounded-full border-3 ${
                    l.status === "done" ? "border-ink bg-mint" : l.status === "open" ? "border-ink bg-coral" : "border-stone bg-sand text-muted-2"
                  }`}
                >
                  {l.status === "done" ? <IconCheck size={22} /> : l.status === "open" ? <IconPlay size={20} /> : <IconLock size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[17px] font-extrabold">
                    {i + 1}. {l.title}
                  </span>
                  <span className="block text-[13px] font-medium text-muted">
                    {l.en}
                    {l.status === "done" ? " · review anytime" : ""}
                  </span>
                </span>
              </>
            );
            return (
              <li key={l.id}>
                {l.status === "locked" ? (
                  <div className="flex items-center gap-3 px-4 py-3 opacity-80">{inner}</div>
                ) : (
                  <Link href={`/lesson/${l.id}`} className="flex items-center gap-3 px-4 py-3 text-ink no-underline">
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        {t.unlocked && (
          <Link href={`/talk/${t.id}`} className="card flex items-center gap-3 p-4 text-ink no-underline">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border-3 border-ink bg-sky">
              <IconChat />
            </span>
            <span>
              <span className="block font-display text-[17px] font-extrabold">Conversation: {t.conversation}</span>
              <span className="block text-[13px] font-medium text-muted">Listen, slow it down, read along</span>
            </span>
          </Link>
        )}

        <div className="rounded-[20px] border-3 border-ink bg-ink p-4 text-paper">
          <div className="flex items-center gap-3">
            <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-2xl border-3 border-paper ${t.test === "passed" ? "bg-mint text-ink" : t.test === "open" ? "bg-coral text-ink" : "bg-muted text-paper"}`}>
              {t.test === "locked" ? <IconLock /> : <IconShield check={t.test === "passed"} />}
            </span>
            <div>
              <div className="font-display text-lg font-extrabold">Topic {t.n} test</div>
              <div className="text-[13px] text-[#E4E0F2]">10 random questions · 10 minutes · 85% to pass</div>
            </div>
          </div>
          {t.test === "locked" ? (
            <p className="m-0 mt-3 text-sm text-[#E4E0F2]">Finish all {t.lessons.length} lessons to unlock the test.</p>
          ) : (
            <Link href={`/exam/topic/${t.id}`} className={`btn mt-3.5 ${t.test === "passed" ? "btn-paper" : "btn-coral"}`}>
              {t.test === "passed" ? `Practice test (best ${t.bestScore}%)` : "Start the test"}
            </Link>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
