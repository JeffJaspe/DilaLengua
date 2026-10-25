import { randomInt } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, examAttempts, topicStatus } from "../db";
import { A1, getQuestion, getTopic } from "../../content/index";
import type { Question, Skill } from "../../content/types";
import { checkBuild, checkSpoken, checkTyped } from "../answers";
import { PASS_MARK } from "../progression";
import { addXp, FINAL_KEY, getPath } from "./progress";
import type { LearnerRow } from "./learner";

export type ExamKind = "topic" | "practice" | "final";

/** What the browser sees: no answers, no accepted lists, no patterns. */
export type ClientQuestion =
  | { id: string; skill: Skill; type: "choice"; prompt: string; options: string[] }
  | { id: string; skill: Skill; type: "listen"; say: string; prompt: string; options: string[] }
  | { id: string; skill: Skill; type: "type"; prompt: string; before?: string; after?: string }
  | { id: string; skill: Skill; type: "build"; en: string; tiles: string[] }
  | { id: string; skill: Skill; type: "speak"; say: string; prompt: string };

export type ExamAnswer = number | string | string[] | { transcript: string } | { skipped: true } | null;

export class ExamError extends Error {
  constructor(
    message: string,
    public status = 400,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

const TOPIC_QUESTIONS = 10;
const TOPIC_MINUTES = 10;
const SKILL_ORDER: Skill[] = ["listening", "reading", "vocabulary", "speaking"];

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 10 random questions from one topic: at most 2 spoken, at least 2 listening. */
function pickTopic(bank: Question[]): Question[] {
  const speaking = shuffle(bank.filter((q) => q.skill === "speaking")).slice(0, 2);
  const listening = shuffle(bank.filter((q) => q.skill === "listening")).slice(0, 2);
  const chosen = new Set([...speaking, ...listening]);
  const rest = shuffle(bank.filter((q) => !chosen.has(q) && q.skill !== "speaking"));
  return shuffle([...chosen, ...rest.slice(0, TOPIC_QUESTIONS - chosen.size)]);
}

/** Final: 5 per topic, one of them spoken where possible, then grouped by skill. */
function pickFinal(): Question[] {
  const picked: Question[] = [];
  for (const topic of A1.topics) {
    const spoken = shuffle(topic.bank.filter((q) => q.skill === "speaking")).slice(0, 1);
    const others = shuffle(topic.bank.filter((q) => q.skill !== "speaking")).slice(0, A1.final.perTopic - spoken.length);
    picked.push(...spoken, ...others);
  }
  return SKILL_ORDER.flatMap((s) => shuffle(picked.filter((q) => q.skill === s)));
}

function toClient(q: Question, tiles?: string[]): ClientQuestion {
  switch (q.type) {
    case "choice":
      return { id: q.id, skill: q.skill, type: q.type, prompt: q.prompt, options: q.options };
    case "listen":
      return { id: q.id, skill: q.skill, type: q.type, say: q.say, prompt: q.prompt, options: q.options };
    case "type":
      return { id: q.id, skill: q.skill, type: q.type, prompt: q.prompt, before: q.before, after: q.after };
    case "build":
      return { id: q.id, skill: q.skill, type: q.type, en: q.en, tiles: tiles ?? shuffle([...q.answer, ...q.extra]) };
    case "speak":
      return { id: q.id, skill: q.skill, type: q.type, say: q.say, prompt: q.prompt };
  }
}

function examMeta(kind: ExamKind, id: string) {
  if (kind === "final") return { key: FINAL_KEY, title: `Examen final ${A1.code}`, minutes: A1.final.minutes };
  const t = getTopic(id);
  if (!t) throw new ExamError("Unknown topic", 404);
  return { key: `topic:${t.topic.id}`, title: t.topic.title, minutes: TOPIC_MINUTES, topic: t.topic };
}

export async function startExam(learner: LearnerRow, kind: ExamKind, id: string) {
  const meta = examMeta(kind, id);
  const { data, path } = await getPath(learner.id);

  if (kind === "final") {
    if (path.final === "locked") throw new ExamError("Pass every topic test to unlock the final exam.", 403);
    if (data.final.passed) throw new ExamError("You already passed this final exam.", 409, { certificateId: data.certificateId });
    if (data.final.retryAt) throw new ExamError("You can retake the final exam after the waiting time.", 429, { retryAt: data.final.retryAt });
  } else {
    const t = path.topics.find((x) => x.id === meta.topic!.id)!;
    if (t.test === "locked") throw new ExamError("Finish every lesson in this topic first.", 403);
    // A passed topic can always be practised; the score never changes progress.
    kind = t.passed ? "practice" : "topic";
  }

  const key = kind === "practice" ? `practice:${meta.topic!.id}` : meta.key;

  // Resume an unfinished, unexpired attempt (e.g. after a page refresh).
  const [open] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.learnerId, learner.id), eq(examAttempts.examKey, key), isNull(examAttempts.finishedAt)))
    .orderBy(desc(examAttempts.startedAt))
    .limit(1);
  if (open && open.expiresAt > new Date()) {
    const qs = open.questionIds.map((qid) => getQuestion(qid)).filter((q): q is Question => !!q);
    return {
      attemptId: open.id,
      kind,
      title: meta.title,
      minutes: meta.minutes,
      expiresAt: open.expiresAt.toISOString(),
      questions: qs.map((q) => toClient(q, open.tileOrder?.[q.id])),
    };
  }

  const questions = kind === "final" ? pickFinal() : pickTopic(meta.topic!.bank);
  const tileOrder: Record<string, string[]> = {};
  for (const q of questions) if (q.type === "build") tileOrder[q.id] = shuffle([...q.answer, ...q.extra]);
  const expiresAt = new Date(Date.now() + (meta.minutes + 1) * 60_000);
  const [row] = await db
    .insert(examAttempts)
    .values({ learnerId: learner.id, examKey: key, kind, questionIds: questions.map((q) => q.id), tileOrder, expiresAt })
    .returning();

  return {
    attemptId: row.id,
    kind,
    title: meta.title,
    minutes: meta.minutes,
    expiresAt: expiresAt.toISOString(),
    questions: questions.map((q) => toClient(q, tileOrder[q.id])),
  };
}

const show = (a: ExamAnswer, q: Question): string => {
  if (a === null || a === undefined) return "No answer";
  if ((q.type === "choice" || q.type === "listen") && typeof a === "number") return q.options[a] ?? "No answer";
  if (Array.isArray(a)) return a.join(" ") || "No answer";
  if (typeof a === "string") return a || "No answer";
  if (typeof a === "object" && "transcript" in a) return `“${a.transcript}”`;
  if (typeof a === "object" && "skipped" in a) return "Skipped (no microphone)";
  return "No answer";
};

const correctText = (q: Question): string => {
  switch (q.type) {
    case "choice":
    case "listen":
      return q.options[q.answer];
    case "type":
      return [q.before, q.accept[0], q.after].filter(Boolean).join("");
    case "build":
      return q.answer.join(" ");
    case "speak":
      return `For example: “${q.sample}”`;
  }
};

function grade(q: Question, a: ExamAnswer): { ok: boolean; counted: boolean } {
  switch (q.type) {
    case "choice":
    case "listen":
      return { ok: a === q.answer, counted: true };
    case "type":
      return { ok: typeof a === "string" && checkTyped(a, q.accept).ok, counted: true };
    case "build":
      return { ok: Array.isArray(a) && checkBuild(a, q.answer), counted: true };
    case "speak":
      if (a && typeof a === "object" && "skipped" in a) return { ok: false, counted: false };
      return { ok: !!a && typeof a === "object" && "transcript" in a && checkSpoken(a.transcript, q.patterns), counted: true };
  }
}

export async function submitExam(learner: LearnerRow, attemptId: string, answers: Record<string, ExamAnswer>, today: string) {
  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.learnerId, learner.id)))
    .limit(1);
  if (!attempt) throw new ExamError("Exam not found", 404);
  if (attempt.finishedAt) throw new ExamError("This exam was already submitted.", 409);

  const review = attempt.questionIds.map((qid) => {
    const q = getQuestion(qid)!;
    const a = answers?.[qid] ?? null;
    const g = grade(q, a);
    const prompt = q.type === "build" ? `Build: “${q.en}”` : q.type === "listen" ? `${q.prompt} (audio: “${q.say}”)` : q.type === "speak" ? `${q.prompt}${q.say ? ` (“${q.say}”)` : ""}` : q.prompt;
    return { id: qid, skill: q.skill, prompt, yours: show(a, q), correct: correctText(q), ok: g.ok, counted: g.counted };
  });
  const counted = review.filter((r) => r.counted);
  const right = counted.filter((r) => r.ok).length;
  const score = counted.length ? Math.round((right / counted.length) * 100) : 0;
  const passed = score >= PASS_MARK;

  await db
    .update(examAttempts)
    .set({ answers, score, passed, finishedAt: new Date() })
    .where(eq(examAttempts.id, attempt.id));

  let xp = 0;
  if (attempt.kind === "topic") {
    const topicId = attempt.examKey.slice("topic:".length);
    const [prev] = await db
      .select()
      .from(topicStatus)
      .where(and(eq(topicStatus.learnerId, learner.id), eq(topicStatus.topicId, topicId)))
      .limit(1);
    const firstPass = passed && !prev?.passed;
    await db
      .insert(topicStatus)
      .values({ learnerId: learner.id, topicId, passed, bestScore: score, passedAt: passed ? new Date() : null })
      .onConflictDoUpdate({
        target: [topicStatus.learnerId, topicStatus.topicId],
        set: {
          passed: passed || !!prev?.passed,
          bestScore: Math.max(score, prev?.bestScore ?? 0),
          passedAt: prev?.passedAt ?? (passed ? new Date() : null),
        },
      });
    xp = firstPass ? 20 : 0;
  } else if (attempt.kind === "practice") {
    xp = 5;
  } else if (attempt.kind === "final" && passed) {
    xp = 100;
  }
  if (xp) await addXp(learner, xp, today);

  const retryAt = attempt.kind === "final" && !passed ? new Date(Date.now() + 24 * 3600_000).toISOString() : null;
  return { kind: attempt.kind, score, passed, right, total: counted.length, passMark: PASS_MARK, xp, retryAt, review };
}
