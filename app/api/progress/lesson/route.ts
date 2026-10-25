import { db, lessonProgress } from "@/lib/db";
import { getLesson } from "@/content/index";
import { lessonOpen } from "@/lib/progression";
import { getLearner, todayFrom } from "@/lib/server/learner";
import { addWords, addXp, getPath, summary } from "@/lib/server/progress";
import { body, handle, json } from "@/lib/server/http";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  return handle(async () => {
    const { lessonId, score, today: t } = await body<{ lessonId: string; score: number; today: string }>(req);
    const found = lessonId ? getLesson(lessonId) : undefined;
    if (!found) return json({ error: "Unknown lesson" }, 404);
    const learner = await getLearner(true);
    const today = todayFrom(t);
    const { path } = await getPath(learner.id);
    if (!lessonOpen(path, found.lesson.id)) return json({ error: "This lesson is still locked." }, 403);

    const pct = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
    const [prev] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.learnerId, learner.id), eq(lessonProgress.lessonId, found.lesson.id)))
      .limit(1);
    await db
      .insert(lessonProgress)
      .values({ learnerId: learner.id, lessonId: found.lesson.id, bestScore: pct })
      .onConflictDoUpdate({
        target: [lessonProgress.learnerId, lessonProgress.lessonId],
        set: { bestScore: Math.max(pct, prev?.bestScore ?? 0) },
      });
    // First time: 10 XP, +5 for a perfect lesson. Replays (review) still earn 5.
    const xp = prev ? 5 : 10 + (pct === 100 ? 5 : 0);
    const updated = await addXp(learner, xp, today);
    await addWords(learner.id, found.lesson.words);
    return json({ xp, me: await summary(updated, today) });
  });
}
