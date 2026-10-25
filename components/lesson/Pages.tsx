"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ConjForms, DialogueLine, Page } from "@/content/types";
import type { PageValue } from "@/lib/grade-page";
import { seededShuffle } from "@/lib/shuffle";
import { speak, stopSpeaking } from "@/lib/client/audio";
import { Sol } from "../Sol";
import { SpeakButtons, SpeakIcon } from "../SpeakButtons";
import { ChoiceList, TileBuilder, TypeAnswer } from "./widgets";
import { SpeechPractice } from "../speech/SpeechPractice";
import { IconPause, IconPlay, IconSpeaker, IconTurtle } from "../icons";

type Props = {
  page: Page;
  value: PageValue | null;
  setValue: (v: PageValue) => void;
  locked: boolean;
};

const EYEBROW: Record<Page["type"], string> = {
  explain: "New words",
  choice: "Pick the answer",
  match: "Match the pairs",
  build: "Build the sentence",
  type: "Type it",
  listen: "Listen",
  conjugate: "Conjugate",
  dialogue: "Conversation",
  speak: "Speak it",
};

export function PageView(props: Props) {
  const { page } = props;
  return (
    <div className="flex animate-pop flex-col gap-4">
      <span className="eyebrow">{page.type === "explain" ? page.title : EYEBROW[page.type]}</span>
      {page.type === "explain" && <ExplainPage page={page} />}
      {page.type === "choice" && <ChoicePage {...props} page={page} />}
      {page.type === "listen" && <ListenPage {...props} page={page} />}
      {page.type === "match" && <MatchPage {...props} page={page} />}
      {page.type === "build" && <BuildPage {...props} page={page} />}
      {page.type === "type" && <TypePage {...props} page={page} />}
      {page.type === "conjugate" && <ConjugatePage {...props} page={page} />}
      {page.type === "dialogue" && <DialoguePage page={page} />}
      {page.type === "speak" && <SpeakPage {...props} page={page} />}
    </div>
  );
}

type P<T extends Page["type"]> = Props & { page: Extract<Page, { type: T }> };

function ExplainPage({ page }: { page: Extract<Page, { type: "explain" }> }) {
  return (
    <>
      <div className="flex items-end gap-2.5">
        <Sol size={64} />
        <div className="relative flex-1 rounded-[18px_18px_18px_4px] border-3 border-ink bg-paper px-3.5 py-2.5 text-[15px] leading-snug font-semibold shadow-chunky-sm">
          Tap the speaker to hear each one. The turtle plays it slowly.
        </div>
      </div>
      <div className="card py-1">
        {page.items.map((it) => (
          <div key={it.es} className="flex items-center gap-3 border-b-2 border-dashed border-ink/25 px-3.5 py-2.5 last:border-b-0">
            <SpeakIcon text={it.es} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl font-extrabold">{it.es}</div>
              <div className="text-sm font-medium text-muted">{it.en}</div>
              {it.note && <div className="mt-0.5 text-xs font-bold text-ink/80">{it.note}</div>}
            </div>
            <button type="button" className="speak-btn bg-paper" onClick={() => speak(it.es, { slow: true })} aria-label={`Hear slowly: ${it.es}`}>
              <IconTurtle size={18} />
            </button>
          </div>
        ))}
      </div>
      {page.tip && (
        <div className="flex flex-col gap-1.5 rounded-[18px] border-3 border-dashed border-ink bg-paper/60 px-3.5 py-3">
          <span className="self-start rounded-full border-2 border-ink bg-coral px-2 py-0.5 text-xs font-extrabold">{page.tipLabel ?? "Tip"}</span>
          <p className="m-0 text-[15px] leading-snug font-medium">{page.tip}</p>
        </div>
      )}
    </>
  );
}

function ChoicePage({ page, value, setValue, locked }: P<"choice">) {
  const v = value?.kind === "index" ? value.index : -1;
  return (
    <>
      <div className="card flex items-center gap-3.5 p-4">
        {page.say && <SpeakButtons text={page.say} />}
        <h2 className="m-0 font-display text-2xl leading-tight font-extrabold">{page.prompt}</h2>
      </div>
      <ChoiceList options={page.options} value={v} onChange={(i) => setValue({ kind: "index", index: i })} locked={locked} answer={locked ? page.answer : undefined} />
    </>
  );
}

function ListenPage({ page, value, setValue, locked }: P<"listen">) {
  const v = value?.kind === "index" ? value.index : -1;
  useEffect(() => {
    const t = setTimeout(() => speak(page.say), 350);
    return () => clearTimeout(t);
  }, [page.say]);
  return (
    <>
      <div className="card flex items-center gap-4 p-4">
        <button type="button" className="press flex h-[76px] w-[76px] flex-none items-center justify-center rounded-full border-3 border-ink bg-sky shadow-chunky" onClick={() => speak(page.say)} aria-label="Play the audio">
          <IconSpeaker size={34} />
        </button>
        <div>
          <h2 className="m-0 font-display text-xl font-extrabold">{page.prompt}</h2>
          <button type="button" className="mt-1 text-sm font-bold text-ink underline" onClick={() => speak(page.say, { slow: true })}>
            Play slowly
          </button>
          {locked && <div className="mt-1 text-sm font-semibold">“{page.say}”</div>}
        </div>
      </div>
      <ChoiceList options={page.options} value={v} onChange={(i) => setValue({ kind: "index", index: i })} locked={locked} answer={locked ? page.answer : undefined} />
    </>
  );
}

function MatchPage({ page, setValue, locked }: P<"match">) {
  const lefts = useMemo(() => seededShuffle(page.pairs.map((p, i) => ({ i, w: p[0] })), page.pairs.join("|") + "L"), [page.pairs]);
  const rights = useMemo(() => seededShuffle(page.pairs.map((p, i) => ({ i, w: p[1] })), page.pairs.join("|") + "R"), [page.pairs]);
  const [sel, setSel] = useState(-1);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState(-1);
  const pickRight = (i: number) => {
    if (sel < 0) return;
    if (sel === i) {
      const next = [...matched, i];
      setMatched(next);
      setSel(-1);
      if (next.length === page.pairs.length) setValue({ kind: "done" });
    } else {
      setWrong(i);
      setTimeout(() => setWrong(-1), 450);
    }
  };
  const cls = (i: number, side: "l" | "r") =>
    `tile w-full ${matched.includes(i) ? "is-matched" : side === "l" && sel === i ? "is-selected" : side === "r" && wrong === i ? "is-wrong" : ""}`;
  return (
    <>
      <h2 className="m-0 font-display text-2xl leading-tight font-extrabold">Tap a Spanish word, then its meaning.</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">
          {lefts.map(({ i, w }) => (
            <button
              key={w}
              type="button"
              className={cls(i, "l")}
              disabled={matched.includes(i) || locked}
              onClick={() => {
                setSel(i);
                speak(w);
              }}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {rights.map(({ i, w }) => (
            <button key={w} type="button" className={cls(i, "r")} disabled={matched.includes(i) || locked} onClick={() => pickRight(i)}>
              {w}
            </button>
          ))}
        </div>
      </div>
      <div className="text-center text-sm font-bold">
        {matched.length} / {page.pairs.length} matched
      </div>
    </>
  );
}

function BuildPage({ page, value, setValue, locked }: P<"build">) {
  const tiles = useMemo(() => seededShuffle([...page.answer, ...page.extra], page.en), [page]);
  const idx = value?.kind === "tiles" ? value.idx : [];
  return (
    <>
      <div className="flex items-center gap-2.5">
        <SpeakIcon text={page.answer.join(" ")} />
        <div className="flex-1 rounded-[18px_18px_18px_4px] border-3 border-ink bg-paper px-3.5 py-2.5 text-[15px] font-semibold shadow-chunky-sm">{page.en}</div>
      </div>
      <TileBuilder tiles={tiles} value={idx} locked={locked} onChange={(next) => setValue({ kind: "tiles", idx: next, words: next.map((i) => tiles[i]) })} />
    </>
  );
}

function TypePage({ page, value, setValue, locked }: P<"type">) {
  const text = value?.kind === "text" ? value.text : "";
  return <TypeAnswer label={page.prompt} before={page.before} after={page.after} value={text} locked={locked} onChange={(t) => setValue({ kind: "text", text: t })} />;
}

const PRONOUNS: [keyof ConjForms, string][] = [
  ["yo", "yo"],
  ["tu", "tú"],
  ["el", "él / ella / usted"],
  ["nosotros", "nosotros / nosotras"],
  ["vosotros", "vosotros / vosotras"],
  ["ellos", "ellos / ellas / ustedes"],
];

function ConjugatePage({ page, value, setValue, locked }: P<"conjugate">) {
  const forms = value?.kind === "conj" ? value.forms : {};
  return (
    <>
      <div className="card flex items-center gap-3 p-4">
        <SpeakIcon text={page.verb} />
        <div>
          <div className="font-display text-2xl font-extrabold">{page.verb}</div>
          <div className="text-sm font-medium text-muted">{page.en} · fill in the missing forms</div>
        </div>
      </div>
      <div className="card divide-y-2 divide-dashed divide-ink/25 py-1">
        {PRONOUNS.map(([k, label]) => {
          const blank = page.blanks.includes(k);
          return (
            <div key={k} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-[120px] flex-none text-[15px] font-bold">{label}</span>
              {blank ? (
                <input
                  aria-label={`${page.verb}, ${label}`}
                  value={forms[k] ?? ""}
                  disabled={locked}
                  onChange={(e) => setValue({ kind: "conj", forms: { ...forms, [k]: e.target.value } })}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="h-11 min-w-0 flex-1 rounded-xl border-3 border-ink bg-white px-3 font-display text-lg font-extrabold outline-none focus:bg-[#FFF0B3]"
                />
              ) : (
                <span className="font-display text-lg font-extrabold">{page.forms[k]}</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function DialoguePage({ page }: { page: Extract<Page, { type: "dialogue" }> }) {
  return (
    <>
      <h2 className="m-0 font-display text-2xl font-extrabold">{page.title}</h2>
      <DialoguePlayer lines={page.lines} />
    </>
  );
}

/** Dialogue with per-line playback, "play all", slow mode and English on/off. Also used by the Talk tab. */
export function DialoguePlayer({ lines, showControls = true }: { lines: DialogueLine[]; showControls?: boolean }) {
  const [playing, setPlaying] = useState(-1);
  const [auto, setAuto] = useState(false);
  const [slow, setSlow] = useState(false);
  const [showEn, setShowEn] = useState(true);
  const run = useRef(0);

  useEffect(() => () => {
    run.current++;
    stopSpeaking();
  }, []);

  const play = (i: number, chain: boolean, id: number) => {
    if (id !== run.current) return;
    if (i >= lines.length) {
      setPlaying(-1);
      setAuto(false);
      return;
    }
    setPlaying(i);
    let done = false;
    const next = () => {
      if (done || id !== run.current) return;
      done = true;
      if (chain) setTimeout(() => play(i + 1, true, id), 400);
      else setPlaying(-1);
    };
    speak(lines[i].es, { slow, pitch: lines[i].me ? 0.85 : 1.2, onEnd: next });
    setTimeout(next, 2400 + lines[i].es.length * (slow ? 170 : 115));
  };

  const others = [...new Set(lines.filter((l) => !l.me).map((l) => l.who))];

  return (
    <div className="flex flex-col gap-3.5">
      {lines.map((l, i) => (
        <div key={i} className={`flex items-end gap-2 ${l.me ? "flex-row-reverse" : ""}`}>
          <div
            aria-hidden
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border-3 border-ink font-display text-sm font-extrabold ${l.me ? "bg-coral" : others.indexOf(l.who) === 1 ? "bg-mint" : "bg-sky"}`}
          >
            {l.me ? "Tú" : l.who[0]}
          </div>
          <button
            type="button"
            onClick={() => {
              const id = ++run.current;
              setAuto(false);
              play(i, false, id);
            }}
            aria-label={`Play line: ${l.es}`}
            className={`press flex max-w-[270px] flex-col gap-0.5 border-3 border-ink px-3 py-2.5 text-left shadow-chunky-sm transition-transform ${
              l.me ? "rounded-[18px_18px_4px_18px] bg-cream" : "rounded-[18px_18px_18px_4px] bg-paper"
            } ${playing === i ? "scale-[1.03] !bg-sky" : ""}`}
          >
            <span className="text-[11px] font-bold tracking-wide uppercase">{l.me ? "You" : l.who}</span>
            <span className="text-[17px] leading-snug font-bold">{l.es}</span>
            {showEn && <span className="text-[13.5px] leading-snug font-medium text-muted">{l.en}</span>}
            {l.note && <span className="mt-1 rounded-lg border-2 border-dashed border-ink px-2 py-1 text-[12.5px] font-semibold">{l.note}</span>}
          </button>
        </div>
      ))}
      {showControls && (
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            className={`btn flex-1 ${auto ? "btn-ink" : "btn-coral"}`}
            onClick={() => {
              const id = ++run.current;
              if (auto) {
                stopSpeaking();
                setAuto(false);
                setPlaying(-1);
                return;
              }
              setAuto(true);
              play(0, true, id);
            }}
          >
            {auto ? <IconPause /> : <IconPlay />}
            {auto ? "Pause" : "Play conversation"}
          </button>
          <button type="button" aria-pressed={slow} aria-label="Slow speed" onClick={() => setSlow(!slow)} className={`press flex h-14 w-14 flex-none flex-col items-center justify-center rounded-2xl border-3 border-ink text-xs font-extrabold shadow-chunky ${slow ? "bg-mint" : "bg-paper"}`}>
            <IconTurtle size={20} />
            <span>{slow ? "0.6×" : "1×"}</span>
          </button>
          <button type="button" aria-pressed={showEn} aria-label="Show English" onClick={() => setShowEn(!showEn)} className={`press flex h-14 w-14 flex-none flex-col items-center justify-center rounded-2xl border-3 border-ink text-sm font-extrabold shadow-chunky ${showEn ? "bg-mint" : "bg-paper"}`}>
            EN<span className="text-[10px]">{showEn ? "on" : "off"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function SpeakPage({ page, setValue }: P<"speak">) {
  return <SpeechPractice es={page.es} en={page.en} onResult={() => setValue({ kind: "done" })} />;
}
