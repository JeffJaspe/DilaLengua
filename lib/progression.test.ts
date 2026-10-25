import { test } from "node:test";
import assert from "node:assert/strict";
import { computePath, emptyProgress, lessonOpen, type Outline } from "./progression.ts";

const outline: Outline = {
  code: "A1",
  name: "Principiante",
  en: "Beginner",
  unit: "",
  desc: "",
  final: { questions: 40, minutes: 30 },
  topics: [
    { id: "t1", n: 1, title: "T1", en: "", conversation: "", lessons: [{ id: "t1l1", title: "", en: "" }, { id: "t1l2", title: "", en: "" }] },
    { id: "t2", n: 2, title: "T2", en: "", conversation: "", lessons: [{ id: "t2l1", title: "", en: "" }, { id: "t2l2", title: "", en: "" }] },
  ],
};

test("a new learner can only open the first lesson", () => {
  const p = computePath(outline, emptyProgress());
  assert.deepEqual(p.topics[0].lessonStates.map((l) => l.status), ["open", "locked"]);
  assert.equal(p.topics[1].unlocked, false);
  assert.equal(p.topics[0].test, "locked");
  assert.deepEqual(p.current, { kind: "lesson", id: "t1l1" });
});

test("finishing all lessons opens the topic test, not the next topic", () => {
  const p = computePath(outline, { ...emptyProgress(), completed: ["t1l1", "t1l2"] });
  assert.equal(p.topics[0].test, "open");
  assert.equal(p.topics[1].unlocked, false);
  assert.deepEqual(p.current, { kind: "test", id: "t1" });
  assert.equal(lessonOpen(p, "t2l1"), false);
});

test("passing the test opens the next topic and keeps the old one open for review", () => {
  const p = computePath(outline, { ...emptyProgress(), completed: ["t1l1", "t1l2"], topics: { t1: { passed: true, bestScore: 90 } } });
  assert.equal(p.topics[0].test, "passed");
  assert.equal(p.topics[1].unlocked, true);
  assert.equal(lessonOpen(p, "t1l1"), true);
  assert.deepEqual(p.current, { kind: "lesson", id: "t2l1" });
});

test("the final opens only when every topic is passed", () => {
  const all = { t1: { passed: true, bestScore: 90 }, t2: { passed: true, bestScore: 88 } };
  const p = computePath(outline, { ...emptyProgress(), completed: ["t1l1", "t1l2", "t2l1", "t2l2"], topics: all });
  assert.equal(p.final, "open");
  assert.deepEqual(p.current, { kind: "final", id: "A1" });
});
