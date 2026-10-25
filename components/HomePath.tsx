"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computePath, type Outline } from "@/lib/progression";
import { useProgress } from "@/lib/client/store";
import { Sol } from "./Sol";
import { StatPills } from "./StatPills";
import { BottomNav } from "./BottomNav";
import { IconCheck, IconLock, IconPlay, IconRibbon, IconShield, IconTrophy } from "./icons";

type Upcoming = { code: string; name: string; en: string; unit: string; desc: string; topics: string[] };

type Node = {
  key: string;
  shape: "topic" | "test" | "final" | "cert";
  state: "done" | "current" | "open" | "locked";
  title: string;
  sub: string;
  hot?: boolean;
  href?: string;
};

const OFFSETS = ["ml-6", "ml-24", "ml-36", "ml-24"];

export function HomePath({ outline, upcoming }: { outline: Outline; upcoming: Upcoming[] }) {
  const { me, progress, loaded, refresh, error } = useProgress();
  const [lvl, setLvl] = useState(0);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const path = useMemo(() => computePath(outline, progress), [outline, progress]);
  const levels = [{ code: outline.code, en: outline.en }, ...upcoming.map((u) => ({ code: u.code, en: u.en }))];
  const isA1 = lvl === 0;
  const up = upcoming[lvl - 1];

  const nodes: Node[] = useMemo(() => {
    if (!isA1) {
      return [
        ...up.topics.flatMap((t, i): Node[] => [
          { key: `${up.code}-t${i}`, shape: "topic", state: "locked", title: `${i + 1}. ${t}`, sub: "Coming soon" },
          { key: `${up.code}-x${i}`, shape: "test", state: "locked", title: `Topic ${i + 1} test`, sub: "10 questions · random mix" },
        ]),
        { key: `${up.code}-final`, shape: "final", state: "locked", title: `Final exam ${up.code}`, sub: "Long exam · 85% to pass" },
        { key: `${up.code}-cert`, shape: "cert", state: "locked", title: `${up.code} certificate`, sub: "Earned when you pass the final" },
      ];
    }
    const list: Node[] = [];
    for (const t of path.topics) {
      const isCurrentTopic = path.current?.kind === "lesson" && t.lessonStates.some((l) => l.id === path.current!.id);
      list.push({
        key: t.id,
        shape: "topic",
        state: !t.unlocked ? "locked" : t.lessonsDone === t.lessons.length ? "done" : isCurrentTopic ? "current" : "open",
        title: `${t.n}. ${t.title}`,
        sub: t.unlocked ? `${t.lessonsDone} / ${t.lessons.length} lessons` : `${t.lessons.length} lessons`,
        hot: isCurrentTopic,
        href: t.unlocked ? `/topic/${t.id}` : undefined,
      });
      list.push({
        key: `${t.id}-test`,
        shape: "test",
        state: t.test === "passed" ? "done" : t.test === "open" ? "current" : "locked",
        title: `Topic ${t.n} test`,
        sub: t.test === "passed" ? `Passed · ${t.bestScore}%` : t.test === "open" ? "Need 85% to pass" : "10 questions",
        hot: t.test === "open",
        href: t.test !== "locked" ? `/exam/topic/${t.id}` : undefined,
      });
    }
    list.push({
      key: "final",
      shape: "final",
      state: path.final === "passed" ? "done" : path.final === "open" ? "current" : "locked",
      title: `Final exam ${outline.code}`,
      sub:
        path.final === "passed"
          ? `Passed · ${progress.final.bestScore}%`
          : progress.final.retryAt
            ? `Retake after ${new Date(progress.final.retryAt).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}`
            : `${outline.final.questions} questions · 85% to pass`,
      hot: path.final === "open" && !progress.final.retryAt,
      href: path.final === "open" ? `/exam/final/${outline.code}` : undefined,
    });
    list.push({
      key: "cert",
      shape: "cert",
      state: path.final === "passed" ? "done" : "locked",
      title: `${outline.code} certificate`,
      sub: progress.certificateId ? "View or share" : path.final === "passed" ? "Claim it now" : "Pass the final to earn it",
      href: path.final === "passed" ? (progress.certificateId ? `/certificate/${progress.certificateId}` : `/certificate/claim`) : undefined,
    });
    return list;
  }, [isA1, up, path, outline, progress]);

  const next = path.current;
  const nextHref = !next ? null : next.kind === "lesson" ? `/lesson/${next.id}` : next.kind === "test" ? `/exam/topic/${next.id}` : next.kind === "final" ? `/exam/final/${next.id}` : null;
  const nextLabel = !next
    ? ""
    : next.kind === "lesson"
      ? path.topics.flatMap((t) => t.lessonStates).find((l) => l.id === next.id)?.title ?? "Next lesson"
      : next.kind === "test"
        ? `Topic ${path.topics.find((t) => t.id === next.id)?.n} test`
        : next.kind === "final"
          ? "Final exam"
          : "";

  const goal = me ? Math.min(100, Math.round((me.xpToday / me.dailyGoal) * 100)) : 0;
  const greeting = me?.name ? `¡Hola, ${me.name.split(" ")[0]}!` : "¡Hola!";

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-5">
        <div className="pill" aria-label="Course: Spanish">
          <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden>
            <rect x="1" y="1" width="18" height="12" rx="2" fill="#FF6B57" stroke="#1E1B3A" strokeWidth="2" />
            <rect x="1" y="5" width="18" height="4" fill="#FFD23F" />
          </svg>
          <span>Español</span>
        </div>
        <StatPills />
      </header>

      <section className="flex items-center justify-between px-5 pt-3.5">
        <div>
          <h1 className="font-display text-5xl leading-none font-extrabold">{greeting}</h1>
          <p className="mt-1.5 max-w-[220px] text-[15px] leading-snug">
            {me && me.streak > 0 ? `One lesson today keeps your ${me.streak}-day streak alive.` : "One short lesson a day is all it takes."}
          </p>
        </div>
        <Sol size={104} label="Sol, the sun mascot, smiling" />
      </section>

      <section className="card mx-5 mt-3.5 px-3.5 py-3">
        <div className="flex justify-between text-sm font-bold">
          <span>Daily goal</span>
          <span>
            {me?.xpToday ?? 0} / {me?.dailyGoal ?? 20} XP
          </span>
        </div>
        <div className="mt-2 h-3.5 overflow-hidden rounded-full border-[2.5px] border-ink bg-sand">
          <div className="h-full border-r-[2.5px] border-ink bg-coral transition-all" style={{ width: `${goal}%` }} />
        </div>
      </section>

      {nextHref && isA1 && (
        <Link href={nextHref} className="btn btn-coral mx-5 mt-4 w-auto justify-between px-4">
          <span className="flex items-center gap-2 truncate">
            <IconPlay size={20} />
            <span className="truncate">Continue: {nextLabel}</span>
          </span>
          <span aria-hidden>→</span>
        </Link>
      )}

      <section className="px-5 pt-4">
        <div className="mb-2 text-xs font-bold tracking-[1.2px] uppercase">Beginner to mastery</div>
        <div role="group" aria-label="Choose a level" className="flex gap-2">
          {levels.map((l, i) => (
            <button
              key={l.code}
              onClick={() => setLvl(i)}
              aria-pressed={i === lvl}
              aria-label={`${l.code} ${l.en}`}
              className={`press h-11 flex-1 rounded-[14px] border-3 border-ink font-display text-base font-extrabold shadow-chunky-sm ${i === lvl ? "bg-ink text-sun" : "bg-paper text-ink"}`}
            >
              {l.code}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-[18px] border-3 border-ink bg-ink px-4 py-3.5 text-paper">
        <div className="text-xs font-bold tracking-wider text-sun uppercase">
          {isA1 ? outline.topics.length : up.topics.length} topics · {isA1 ? outline.code : up.code} {isA1 ? outline.name : up.name}
        </div>
        <div className="mt-0.5 font-display text-[26px] font-extrabold">{isA1 ? outline.unit : up.unit}</div>
        <p className="mt-1 text-[13.5px] leading-snug text-[#E4E0F2]">{isA1 ? outline.desc : up.desc}</p>
      </section>

      <div className="flex-1 px-5 pt-5 pb-2">
        {error && <p className="card mb-4 p-3 text-sm font-semibold">Couldn't load your progress: {error}</p>}
        {!isA1 && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border-3 border-dashed border-ink bg-paper px-3 py-2.5">
            <span className="flex-1 text-[13.5px] font-semibold">
              {up.code} is being written. Pass the {levels[lvl - 1].code} final exam to unlock it when it's ready.
            </span>
          </div>
        )}
        <ol className="list-none p-0" aria-busy={!loaded}>
          {nodes.map((n, i) => (
            <li key={n.key} className={`mb-[18px] flex items-center gap-3.5 ${OFFSETS[i % 4]}`}>
              <PathNode n={n} />
              <div className="min-w-0">
                <div className="font-display text-[17px] leading-tight font-extrabold">{n.title}</div>
                <div className={n.hot ? "mt-1 inline-block rounded-full bg-ink px-2 py-0.5 text-[13px] font-bold text-sun" : "mt-0.5 text-[13px] font-medium text-muted"}>{n.sub}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <BottomNav />
    </>
  );
}

function PathNode({ n }: { n: Node }) {
  const size = n.shape === "final" ? "h-[84px] w-[84px] rounded-[26px]" : n.shape === "test" ? (n.state === "current" ? "h-16 w-16 rounded-[18px]" : "h-[54px] w-[54px] rounded-2xl") : n.state === "current" ? "h-[76px] w-[76px] rounded-full" : "h-16 w-16 rounded-full";
  const color =
    n.state === "locked"
      ? "border-stone bg-sand text-muted-2 [box-shadow:0_6px_0_var(--color-stone)]"
      : n.state === "done"
        ? "border-ink bg-mint text-ink [box-shadow:0_6px_0_var(--color-ink)]"
        : n.state === "current"
          ? "border-ink bg-coral text-ink animate-bob [box-shadow:0_6px_0_var(--color-ink)]"
          : "border-ink bg-paper text-ink [box-shadow:0_6px_0_var(--color-ink)]";
  const icon =
    n.state === "locked" ? (
      n.shape === "final" ? <IconTrophy /> : n.shape === "cert" ? <IconRibbon /> : <IconLock />
    ) : n.shape === "test" ? (
      <IconShield check={n.state === "done"} />
    ) : n.shape === "final" ? (
      <IconTrophy />
    ) : n.shape === "cert" ? (
      <IconRibbon />
    ) : n.state === "done" ? (
      <IconCheck size={30} />
    ) : (
      <IconPlay size={30} />
    );
  const cls = `press flex flex-none items-center justify-center border-3 ${size} ${color}`;
  return n.href ? (
    <Link href={n.href} className={cls} aria-label={n.title}>
      {icon}
    </Link>
  ) : (
    <span className={cls} role="img" aria-label={`${n.title}, locked`}>
      {icon}
    </span>
  );
}
