"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, today } from "@/lib/client/api";
import { speak } from "@/lib/client/audio";
import { useProgress } from "@/lib/client/store";
import { BottomNav } from "../BottomNav";
import { ChoiceList } from "../lesson/widgets";
import { Sol } from "../Sol";
import { IconSpeaker } from "../icons";

type Card = { wordId: string; es: string; box: number; options: string[]; answer: number };

export function ReviewDeck() {
  const refresh = useProgress((s) => s.refresh);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [total, setTotal] = useState(0);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(-1);
  const [right, setRight] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ cards: Card[]; total: number }>("/api/review")
      .then((r) => {
        setCards(r.cards);
        setTotal(r.total);
      })
      .catch((e) => setError(e.message));
  }, []);

  const card = cards?.[i];
  useEffect(() => {
    if (card) speak(card.es);
  }, [card]);

  const choose = async (n: number) => {
    if (!card || pick >= 0) return;
    setPick(n);
    const ok = n === card.answer;
    if (ok) setRight((r) => r + 1);
    api("/api/review", { body: { wordId: card.wordId, correct: ok, today: today() } }).catch(() => {});
  };
  const next = () => {
    setPick(-1);
    setI(i + 1);
    if (cards && i + 1 >= cards.length) refresh();
  };

  return (
    <>
      <header className="px-5 pt-6">
        <h1 className="m-0 font-display text-[34px] leading-none font-extrabold">Review</h1>
        <p className="mt-1.5 text-[15px] font-medium">Words come back just before you'd forget them. {total ? `${total} words in your deck.` : ""}</p>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-6">
        {error && <p className="card p-3 font-semibold">{error}</p>}
        {!cards && !error && <p className="font-semibold">Loading your cards…</p>}
        {cards && cards.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-8 text-center">
            <Sol size={110} />
            <h2 className="m-0 font-display text-2xl font-extrabold">{total ? "All caught up!" : "No words yet"}</h2>
            <p className="m-0 max-w-[280px]">{total ? "Nothing is due right now. Come back tomorrow, or learn a new lesson." : "Finish a lesson and its words land here for review."}</p>
            <Link href="/" className="btn btn-coral mt-2">
              Go to lessons
            </Link>
          </div>
        )}
        {cards && card && (
          <div key={card.wordId} className="flex animate-pop flex-col gap-4">
            <div className="text-sm font-bold">
              Card {i + 1} of {cards.length} · box {card.box} of 5
            </div>
            <div className="card flex items-center gap-4 p-5">
              <button type="button" className="speak-btn h-14 w-14 rounded-2xl" onClick={() => speak(card.es)} aria-label={`Hear: ${card.es}`}>
                <IconSpeaker size={26} />
              </button>
              <div className="font-display text-[30px] leading-tight font-extrabold">{card.es}</div>
            </div>
            <ChoiceList options={card.options} value={pick} onChange={choose} locked={pick >= 0} answer={pick >= 0 ? card.answer : undefined} />
            {pick >= 0 && (
              <button type="button" className="btn btn-ink animate-pop" onClick={next}>
                {pick === card.answer ? "¡Bien! Next" : "Next"}
              </button>
            )}
          </div>
        )}
        {cards && cards.length > 0 && !card && (
          <div className="flex animate-pop flex-col items-center gap-3 pt-8 text-center">
            <Sol size={120} mood="cheer" />
            <h2 className="m-0 font-display text-3xl font-extrabold">Review done</h2>
            <p className="m-0">
              {right} of {cards.length} remembered. Missed words go back to box 1 and return tomorrow.
            </p>
            <Link href="/" className="btn btn-ink mt-2">
              Back to the path
            </Link>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
