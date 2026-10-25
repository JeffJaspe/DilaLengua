import { and, count, desc, eq, lte } from "drizzle-orm";
import { certificates, db, examAttempts, learners, lessonProgress, reviewCards, topicStatus } from "../db";
import { computePath, type ProgressData } from "../progression";
import { getOutline } from "../../content/outline";
import { A1 } from "../../content/index";
import type { LearnerRow } from "./learner";
import type { Word } from "../../content/types";

export const FINAL_KEY = `final:${A1.code}`;
export const RETRY_HOURS = 24;
export const DAILY_GOAL = 20;

export async function getProgressData(learnerId: string): Promise<ProgressData> {
  const [lessons, topics, finals, certs] = await Promise.all([
    db.select({ lessonId: lessonProgress.lessonId }).from(lessonProgress).where(eq(lessonProgress.learnerId, learnerId)),
    db.select().from(topicStatus).where(eq(topicStatus.learnerId, learnerId)),
    db
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.learnerId, learnerId), eq(examAttempts.examKey, FINAL_KEY)))
      .orderBy(desc(examAttempts.startedAt)),
    db.select({ id: certificates.id }).from(certificates).where(and(eq(certificates.learnerId, learnerId), eq(certificates.level, A1.code))).limit(1),
  ]);
  const finished = finals.filter((f) => f.finishedAt);
  const finalPassed = finished.some((f) => f.passed);
  const bestFinal = finished.reduce((m, f) => Math.max(m, f.score ?? 0), 0);
  const lastFail = finished.find((f) => !f.passed);
  const retryAt =
    !finalPassed && lastFail?.finishedAt && finished[0] === lastFail
      ? new Date(lastFail.finishedAt.getTime() + RETRY_HOURS * 3600_000)
      : null;
  return {
    completed: lessons.map((l) => l.lessonId),
    topics: Object.fromEntries(topics.map((t) => [t.topicId, { passed: t.passed, bestScore: t.bestScore }])),
    final: { passed: finalPassed, bestScore: bestFinal, retryAt: retryAt && retryAt > new Date() ? retryAt.toISOString() : null },
    certificateId: certs[0]?.id ?? null,
  };
}

export async function getPath(learnerId: string) {
  const data = await getProgressData(learnerId);
  return { data, path: computePath(getOutline(), data) };
}

/** Add XP and keep the daily streak: same day = no change, next day = +1, a gap = back to 1. */
export async function addXp(learner: LearnerRow, amount: number, today: string) {
  const last = learner.lastActiveDate;
  let streak = learner.streak;
  let xpToday = learner.xpToday;
  if (last !== today) {
    const yesterday = new Date(Date.parse(today) - 86400_000).toISOString().slice(0, 10);
    streak = last === yesterday ? streak + 1 : 1;
    xpToday = 0;
  }
  const [row] = await db
    .update(learners)
    .set({
      xp: learner.xp + amount,
      xpToday: xpToday + amount,
      streak,
      longestStreak: Math.max(learner.longestStreak, streak),
      lastActiveDate: today,
    })
    .where(eq(learners.id, learner.id))
    .returning();
  return row;
}

export const wordId = (es: string) =>
  es
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** New words go into box 1, due today. Words already in the deck keep their box. */
export async function addWords(learnerId: string, words: Word[]) {
  if (!words.length) return;
  const unique = new Map(words.map((w) => [wordId(w.es), w]));
  await db
    .insert(reviewCards)
    .values([...unique].map(([id, w]) => ({ learnerId, wordId: id, es: w.es, en: w.en })))
    .onConflictDoNothing();
}

export async function reviewDueCount(learnerId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(reviewCards)
    .where(and(eq(reviewCards.learnerId, learnerId), lte(reviewCards.dueAt, new Date())));
  return row?.n ?? 0;
}

export async function summary(learner: LearnerRow, today: string) {
  const yesterday = new Date(Date.parse(today) - 86400_000).toISOString().slice(0, 10);
  const alive = learner.lastActiveDate === today || learner.lastActiveDate === yesterday;
  return {
    name: learner.name,
    xp: learner.xp,
    xpToday: learner.lastActiveDate === today ? learner.xpToday : 0,
    dailyGoal: DAILY_GOAL,
    streak: alive ? learner.streak : 0,
    longestStreak: learner.longestStreak,
    reviewDue: await reviewDueCount(learner.id),
  };
}

