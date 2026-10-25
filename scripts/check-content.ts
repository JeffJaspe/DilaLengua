// Validates every lesson and question bank. Run: npm run content:check
import { LEVELS } from "../content/index";
import { checkBuild, checkSpoken, normalize } from "../lib/answers";

const errors: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const ids = new Set<string>();
let pages = 0;
let questions = 0;
const counts: Record<string, number> = {};

for (const level of LEVELS) {
  for (const topic of level.topics) {
    if (topic.lessons.length < 4) err(topic.id, "fewer than 4 lessons");
    if (topic.bank.length < 10) err(topic.id, `bank has ${topic.bank.length} questions, need at least 10`);
    if (topic.bank.length < level.final.perTopic) err(topic.id, "bank too small for the final exam");
    for (const lesson of topic.lessons) {
      if (ids.has(lesson.id)) err(lesson.id, "duplicate lesson id");
      ids.add(lesson.id);
      if (lesson.pages.length < 5) err(lesson.id, "fewer than 5 pages");
      lesson.pages.forEach((p, i) => {
        pages++;
        counts[p.type] = (counts[p.type] ?? 0) + 1;
        const at = `${lesson.id} page ${i + 1} (${p.type})`;
        switch (p.type) {
          case "choice":
          case "listen":
            if (p.answer < 0 || p.answer >= p.options.length) err(at, "answer index out of range");
            if (new Set(p.options).size !== p.options.length) err(at, "duplicate options");
            break;
          case "match":
            if (p.pairs.length < 3) err(at, "fewer than 3 pairs");
            if (new Set(p.pairs.map((x) => x[0])).size !== p.pairs.length) err(at, "duplicate left side");
            if (new Set(p.pairs.map((x) => x[1])).size !== p.pairs.length) err(at, "duplicate right side");
            break;
          case "build":
            if (!checkBuild(p.answer, p.answer)) err(at, "answer does not check");
            for (const x of p.extra) if (p.answer.map(normalize).includes(normalize(x))) err(at, `extra tile "${x}" is also in the answer`);
            break;
          case "type":
            if (!p.accept.length) err(at, "no accepted answers");
            break;
          case "conjugate":
            if (!p.blanks.length) err(at, "no blanks");
            break;
          case "explain":
            if (!p.items.length) err(at, "no items");
            break;
          case "dialogue":
            if (p.lines.length < 4) err(at, "dialogue shorter than 4 lines");
            break;
          case "speak":
            break;
        }
      });
    }
    for (const qn of topic.bank) {
      questions++;
      if (ids.has(qn.id)) err(qn.id, "duplicate question id");
      ids.add(qn.id);
      if ((qn.type === "choice" || qn.type === "listen") && (qn.answer < 0 || qn.answer >= qn.options.length)) err(qn.id, "answer out of range");
      if (qn.type === "build") for (const x of qn.extra) if (qn.answer.map(normalize).includes(normalize(x))) err(qn.id, `extra tile "${x}" is in the answer`);
      if (qn.type === "speak") {
        try {
          qn.patterns.forEach((p) => new RegExp(p));
        } catch (e) {
          err(qn.id, `bad pattern: ${(e as Error).message}`);
        }
        if (!checkSpoken(qn.sample, qn.patterns)) err(qn.id, `sample "${qn.sample}" does not match its own patterns`);
      }
    }
    const skills = new Set(topic.bank.map((x) => x.skill));
    for (const s of ["listening", "reading", "vocabulary", "speaking"]) if (!skills.has(s as never)) err(topic.id, `bank has no ${s} questions`);
  }
}

console.log(`Checked ${ids.size} ids: ${pages} lesson pages, ${questions} exam questions.`);
console.log("Page types:", counts);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log("Content OK.");
