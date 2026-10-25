import { and, asc, eq, lte, ne, sql } from "drizzle-orm";
import { db, reviewCards } from "@/lib/db";
import { getLearner, todayFrom } from "@/lib/server/learner";
import { addXp } from "@/lib/server/progress";
import { body, handle, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

// Leitner intervals in days for boxes 1–5.
const INTERVAL = [0, 1, 2, 4, 8, 16];

export async function GET() {
  return handle(async () => {
    const learner = await getLearner(true);
    const due = await db
      .select()
      .from(reviewCards)
      .where(and(eq(reviewCards.learnerId, learner.id), lte(reviewCards.dueAt, new Date())))
      .orderBy(asc(reviewCards.box), asc(reviewCards.dueAt))
      .limit(15);
    const cards = await Promise.all(
      due.map(async (c) => {
        // Three wrong meanings from the learner's own deck (or fillers when the deck is small).
        const others = await db
          .select({ en: reviewCards.en })
          .from(reviewCards)
          .where(and(eq(reviewCards.learnerId, learner.id), ne(reviewCards.wordId, c.wordId)))
          .orderBy(sql`random()`)
          .limit(3);
        const fillers = ["the house", "to eat", "very well", "the street", "on Monday"].filter((f) => f !== c.en);
        const wrong = [...new Set([...others.map((o) => o.en), ...fillers])].filter((x) => x !== c.en).slice(0, 3);
        const options = [...wrong, c.en].sort(() => Math.random() - 0.5);
        return { wordId: c.wordId, es: c.es, box: c.box, options, answer: options.indexOf(c.en) };
      }),
    );
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(reviewCards)
      .where(eq(reviewCards.learnerId, learner.id));
    return json({ cards, total });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const { wordId, correct, today } = await body<{ wordId: string; correct: boolean; today: string }>(req);
    const learner = await getLearner(true);
    const [card] = await db
      .select()
      .from(reviewCards)
      .where(and(eq(reviewCards.learnerId, learner.id), eq(reviewCards.wordId, String(wordId))))
      .limit(1);
    if (!card) return json({ error: "Card not found" }, 404);
    const box = correct ? Math.min(5, card.box + 1) : 1;
    const dueAt = new Date(Date.now() + INTERVAL[box] * 86400_000);
    await db
      .update(reviewCards)
      .set({ box, dueAt })
      .where(and(eq(reviewCards.learnerId, learner.id), eq(reviewCards.wordId, card.wordId)));
    if (correct) await addXp(learner, 1, todayFrom(today));
    return json({ box, dueAt: dueAt.toISOString() });
  });
}
