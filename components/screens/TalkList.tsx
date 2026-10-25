"use client";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { computePath, type Outline } from "@/lib/progression";
import { useProgress } from "@/lib/client/store";
import { BottomNav } from "../BottomNav";
import { IconChat, IconLock } from "../icons";

export function TalkList({ outline }: { outline: Outline }) {
  const { progress, refresh } = useProgress();
  useEffect(() => {
    refresh();
  }, [refresh]);
  const path = useMemo(() => computePath(outline, progress), [outline, progress]);
  return (
    <>
      <header className="px-5 pt-6">
        <h1 className="m-0 font-display text-[34px] leading-none font-extrabold">Conversaciones</h1>
        <p className="mt-1.5 text-[15px] font-medium">Real dialogues for every topic. They open as you reach each topic.</p>
      </header>
      <main className="flex flex-1 flex-col gap-3 px-5 pt-4 pb-6">
        {path.topics.map((t) => {
          const body = (
            <>
              <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl border-3 ${t.unlocked ? "border-ink bg-sky" : "border-stone bg-sand text-muted-2"}`}>
                {t.unlocked ? <IconChat /> : <IconLock size={20} />}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold tracking-wider uppercase">
                  {outline.code} · Topic {t.n}
                </span>
                <span className="block font-display text-lg font-extrabold">{t.conversation}</span>
                <span className="block text-[13px] text-muted">{t.title}</span>
              </span>
            </>
          );
          return t.unlocked ? (
            <Link key={t.id} href={`/talk/${t.id}`} className="card flex items-center gap-3 p-3.5 text-ink no-underline">
              {body}
            </Link>
          ) : (
            <div key={t.id} className="flex items-center gap-3 rounded-[20px] border-3 border-stone bg-paper/60 p-3.5">
              {body}
            </div>
          );
        })}
      </main>
      <BottomNav />
    </>
  );
}
