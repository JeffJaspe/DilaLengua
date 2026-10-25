// Unlock rules, shared by the server (to enforce) and the browser (to draw the path).
// A topic opens when the previous topic's test is passed with 85% or more.
// Inside an open topic, lessons open one after another; once a topic is passed,
// everything in it stays open for review.

export const PASS_MARK = 85;

export type OutlineLesson = { id: string; title: string; en: string };
export type OutlineTopic = { id: string; n: number; title: string; en: string; lessons: OutlineLesson[]; conversation: string };
export type Outline = {
  code: string;
  name: string;
  en: string;
  unit: string;
  desc: string;
  topics: OutlineTopic[];
  final: { questions: number; minutes: number };
};

export type ProgressData = {
  completed: string[];
  topics: Record<string, { passed: boolean; bestScore: number }>;
  final: { passed: boolean; bestScore: number; retryAt: string | null };
  certificateId: string | null;
};

export type LessonStatus = "done" | "open" | "locked";
export type TestStatus = "locked" | "open" | "passed";

export type TopicState = OutlineTopic & {
  unlocked: boolean;
  passed: boolean;
  bestScore: number;
  lessonStates: (OutlineLesson & { status: LessonStatus })[];
  lessonsDone: number;
  test: TestStatus;
};

export type PathState = {
  topics: TopicState[];
  allTopicsPassed: boolean;
  final: "locked" | "open" | "passed";
  current: { kind: "lesson" | "test" | "final" | "done"; id: string } | null;
};

export function computePath(outline: Outline, p: ProgressData): PathState {
  const done = new Set(p.completed);
  let prevPassed = true;
  const topics: TopicState[] = outline.topics.map((t) => {
    const st = p.topics[t.id];
    const passed = !!st?.passed;
    const unlocked = prevPassed;
    let prevDone = true;
    const lessonStates = t.lessons.map((l) => {
      const isDone = done.has(l.id);
      const status: LessonStatus = isDone ? "done" : unlocked && (prevDone || passed) ? "open" : "locked";
      prevDone = isDone;
      return { ...l, status };
    });
    const lessonsDone = lessonStates.filter((l) => l.status === "done").length;
    const test: TestStatus = passed ? "passed" : unlocked && lessonsDone === t.lessons.length ? "open" : "locked";
    prevPassed = passed;
    return { ...t, unlocked, passed, bestScore: st?.bestScore ?? 0, lessonStates, lessonsDone, test };
  });
  const allTopicsPassed = topics.every((t) => t.passed);
  const final = p.final.passed ? "passed" : allTopicsPassed ? "open" : "locked";

  let current: PathState["current"] = null;
  for (const t of topics) {
    if (!t.unlocked) break;
    const next = t.lessonStates.find((l) => l.status === "open");
    if (next) {
      current = { kind: "lesson", id: next.id };
      break;
    }
    if (t.test === "open") {
      current = { kind: "test", id: t.id };
      break;
    }
  }
  if (!current) current = final === "open" ? { kind: "final", id: outline.code } : final === "passed" ? { kind: "done", id: outline.code } : null;

  return { topics, allTopicsPassed, final, current };
}

/** Is this lesson open for this learner? Used by the server before saving a completion. */
export function lessonOpen(path: PathState, lessonId: string): boolean {
  return path.topics.some((t) => t.lessonStates.some((l) => l.id === lessonId && l.status !== "locked"));
}

export const emptyProgress = (): ProgressData => ({
  completed: [],
  topics: {},
  final: { passed: false, bestScore: 0, retryAt: null },
  certificateId: null,
});
