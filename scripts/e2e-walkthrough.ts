// Browser walkthrough of the whole A1 journey against a running server.
//   npx tsx scripts/e2e-walkthrough.ts [baseUrl] [screenshotDir]
// Needs Playwright with Chromium installed. Not part of the app build.
import { createRequire } from "node:module";
import type { Page, APIRequestContext } from "playwright";
const { chromium } = createRequire(import.meta.url)("playwright") as typeof import("playwright");
import { mkdirSync } from "node:fs";
import { A1, getLesson, getQuestion } from "../content/index";
import type { Question } from "../content/types";

const BASE = process.argv[2] ?? "http://localhost:3000";
const SHOTS = process.argv[3] ?? "screens";
mkdirSync(SHOTS, { recursive: true });
const TODAY = "2026-10-25";
let shot = 0;
const snap = async (page: Page, name: string) => {
  shot++;
  await page.screenshot({ path: `${SHOTS}/${String(shot).padStart(2, "0")}-${name}.png`, fullPage: false });
};
const log = (...a: unknown[]) => console.log("•", ...a);
const fail = (msg: string) => {
  throw new Error(msg);
};

async function playLesson(page: Page, lessonId: string, shots = false) {
  const { lesson } = getLesson(lessonId)!;
  await page.goto(`${BASE}/lesson/${lessonId}`);
  for (const [i, p] of lesson.pages.entries()) {
    await page.waitForTimeout(150);
    if (shots && ["explain", "match", "build", "type", "conjugate", "listen", "speak", "dialogue"].includes(p.type)) await snap(page, `lesson-${p.type}-${i + 1}`);
    const main = page.locator("main");
    switch (p.type) {
      case "explain":
        await page.getByRole("button", { name: "¡Entendido! Got it" }).click();
        continue;
      case "dialogue":
        await page.getByRole("button", { name: /^(Continue|Finish lesson)$/ }).click();
        continue;
      case "speak":
        await page.getByRole("button", { name: /Skip for now|Continue|Finish lesson/ }).click();
        continue;
      case "match":
        for (const [es, en] of p.pairs) {
          await main.getByRole("button", { name: es, exact: true }).click();
          await main.getByRole("button", { name: en, exact: true }).click();
        }
        if (shots) await snap(page, `lesson-match-done`);
        await page.getByRole("button", { name: /^(Continue|Finish lesson)$/ }).click();
        continue;
      case "choice":
      case "listen":
        await main.getByRole("radio", { name: new RegExp(`^${p.answer + 1}\\s*${escape(p.options[p.answer])}$`) }).click();
        break;
      case "build": {
        const bank = main.locator("div.justify-center");
        for (const w of p.answer) await bank.locator("button:not(.is-used)", { hasText: new RegExp(`^${escape(w)}$`) }).first().click();
        break;
      }
      case "type":
        await main.locator("input").fill(p.accept[0]);
        break;
      case "conjugate": {
        const labels = { yo: "yo", tu: "tú", el: "él / ella / usted", nosotros: "nosotros / nosotras", vosotros: "vosotros / vosotras", ellos: "ellos / ellas / ustedes" } as const;
        for (const b of p.blanks) await main.getByLabel(`${p.verb}, ${labels[b]}`).fill(p.forms[b]);
        break;
      }
    }
    await page.getByRole("button", { name: "Check" }).click();
    const fb = page.locator("footer");
    await fb.getByText(/Muy bien|Excelente|Perfecto|Eso es|Genial|Bien hecho|Bien!/).first().waitFor({ timeout: 4000 }).catch(async () => {
      await snap(page, `FAIL-${lessonId}-${i + 1}`);
      fail(`${lessonId} page ${i + 1} (${p.type}) was not marked correct`);
    });
    if (shots && (p.type === "choice" || p.type === "build")) await snap(page, `lesson-${p.type}-checked`);
    await page.getByRole("button", { name: /^(Continue|Finish lesson)$/ }).click();
  }
  await page.getByText("¡Lección completa!").waitFor({ timeout: 8000 });
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function answerFor(q: Question): unknown {
  switch (q.type) {
    case "choice":
    case "listen":
      return q.answer;
    case "type":
      return q.accept[0];
    case "build":
      return q.answer;
    case "speak":
      return { transcript: q.sample };
  }
}

async function apiExam(req: APIRequestContext, kind: "topic" | "final", id: string, wrong = false) {
  const start = await req.post(`${BASE}/api/exam/start`, { data: { kind, id } });
  if (!start.ok()) fail(`start ${kind} ${id}: ${start.status()} ${await start.text()}`);
  const s = (await start.json()) as { attemptId: string; questions: { id: string }[] };
  const answers = Object.fromEntries(s.questions.map((q) => [q.id, wrong ? null : answerFor(getQuestion(q.id)!)]));
  const sub = await req.post(`${BASE}/api/exam/submit`, { data: { attemptId: s.attemptId, answers, today: TODAY } });
  if (!sub.ok()) fail(`submit ${kind} ${id}: ${sub.status()}`);
  return (await sub.json()) as { score: number; passed: boolean; retryAt: string | null };
}

async function apiLessons(req: APIRequestContext, topicIndex: number) {
  for (const l of A1.topics[topicIndex].lessons) {
    const r = await req.post(`${BASE}/api/progress/lesson`, { data: { lessonId: l.id, score: 100, today: TODAY } });
    if (!r.ok()) fail(`lesson ${l.id}: ${r.status()} ${await r.text()}`);
  }
}

(async () => {
  const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  // Keep the run deterministic: no CDN (Whisper) and no Google Fonts.
  await ctx.route(/cdn\.jsdelivr\.net|huggingface\.co/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|fonts\.g|net::ERR/.test(m.text()) && errors.push(`console: ${m.text()}`));

  // 1. New learner home
  await page.goto(BASE);
  await page.getByText("Continue: En la casa").waitFor();
  await snap(page, "home-new");
  log("home loads, first lesson is next");

  // Locked lesson cannot be saved
  const locked = await page.request.post(`${BASE}/api/progress/lesson`, { data: { lessonId: "es-a1-t01-l03", score: 100, today: TODAY } });
  if (locked.status() !== 403) fail(`locked lesson accepted: ${locked.status()}`);
  log("locked lesson rejected by the server");

  // 2. Play lesson 1 through the UI
  await playLesson(page, "es-a1-t01-l01", true);
  await snap(page, "lesson-done");
  log("lesson 1 completed through the UI");

  // 3. Lesson with conjugation + speak page through the UI (topic 3, lesson 3 needs topic 1+2; use topic 1 lessons first)
  for (const id of ["es-a1-t01-l02", "es-a1-t01-l03", "es-a1-t01-l04", "es-a1-t01-l05"]) await playLesson(page, id, id === "es-a1-t01-l05");
  log("all topic 1 lessons completed through the UI");

  // Topic test locked → open now
  await page.goto(`${BASE}/topic/es-a1-t01`);
  await page.getByRole("link", { name: "Start the test" }).waitFor();
  await snap(page, "topic-page");

  // 4. Topic 1 test through the UI
  await page.goto(`${BASE}/exam/topic/es-a1-t01`);
  await snap(page, "exam-intro");
  const startResp = page.waitForResponse((r) => r.url().endsWith("/api/exam/start"));
  await page.getByRole("button", { name: "Start the test" }).click();
  const started = (await (await startResp).json()) as { questions: { id: string; type: string; tiles?: string[] }[] };
  for (const [k, cq] of started.questions.entries()) {
    const q = getQuestion(cq.id)!;
    const main = page.locator("main");
    await page.waitForTimeout(120);
    if (q.type === "choice" || q.type === "listen") await main.getByRole("radio", { name: new RegExp(`^${q.answer + 1}\\s*${escape(q.options[q.answer])}$`) }).click();
    if (q.type === "type") await main.locator("input").fill(q.accept[0]);
    if (q.type === "build") {
      const bank = main.locator("div.justify-center");
      for (const w of q.answer) await bank.locator("button:not(.is-used)", { hasText: new RegExp(`^${escape(w)}$`) }).first().click();
    }
    if (q.type === "speak") {
      await main.getByRole("button", { name: "Tap and speak" }).click();
      await page.waitForTimeout(800);
      await main.getByRole("button", { name: "Stop recording" }).click().catch(() => {});
      await main.getByRole("button", { name: /Skip this question/ }).click({ timeout: 15000 });
    }
    if (k === 1 || q.type === "build" || q.type === "speak") await snap(page, `exam-q${k + 1}-${q.type}`);
    await page.getByRole("button", { name: /^(Next|Finish test)$/ }).click();
  }
  await page.getByText("APROBADO", { exact: true }).waitFor({ timeout: 10000 });
  await snap(page, "exam-passed");
  log("topic 1 test passed through the UI (spoken questions skipped, not counted)");

  // 5. Practice mode on a passed topic doesn't change status
  const practice = await apiExam(page.request, "topic", "es-a1-t01", true);
  if (practice.passed) fail("wrong practice answers passed");
  const prog = await (await page.request.get(`${BASE}/api/progress?today=${TODAY}`)).json();
  if (!prog.progress.topics["es-a1-t01"].passed) fail("practice re-locked a passed topic");
  log("practice test with wrong answers keeps the topic passed");

  // 6. Topics 2–8 via the API, with one failed attempt first on topic 2
  await apiLessons(page.request, 1);
  const failT2 = await apiExam(page.request, "topic", "es-a1-t02", true);
  if (failT2.passed || failT2.score !== 0) fail("empty answers should fail");
  const t3early = await page.request.post(`${BASE}/api/progress/lesson`, { data: { lessonId: "es-a1-t03-l01", score: 100, today: TODAY } });
  if (t3early.status() !== 403) fail("topic 3 opened before passing topic 2");
  log("failing a topic test keeps the next topic locked");
  for (let t = 1; t < A1.topics.length; t++) {
    if (t > 1) await apiLessons(page.request, t);
    const r = await apiExam(page.request, "topic", A1.topics[t].id);
    if (!r.passed) fail(`topic ${t + 1} test failed with right answers: ${r.score}`);
  }
  log("topics 2–8 passed");

  // Conjugation tables with vosotros (Spain standard), played through the UI
  await playLesson(page, "es-a1-t06-l02", true);
  log("conjugation lesson with vosotros completed through the UI");

  await page.goto(BASE);
  await page.getByText("Final exam A1").first().waitFor();
  await page.getByText("Continue: Final exam").waitFor();
  await snap(page, "home-final-open");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await snap(page, "home-path-bottom");

  // 7. Talk, review, me screens
  await page.goto(`${BASE}/talk/es-a1-t05`);
  await snap(page, "talk");
  await page.goto(`${BASE}/review`);
  await page.getByText(/Card 1 of/).waitFor();
  await snap(page, "review");
  await page.getByRole("radio").first().click();
  await snap(page, "review-answered");
  await page.goto(`${BASE}/me`);
  await snap(page, "me");

  // 8. Final exam via the API, then certificate through the UI
  const fin = await apiExam(page.request, "final", "A1");
  if (!fin.passed || fin.score !== 100) fail(`final with right answers: ${fin.score}`);
  log("final exam passed (40 questions)");
  await page.goto(`${BASE}/certificate/claim`);
  await page.getByPlaceholder("Your full name").fill("Juan dela Cruz");
  await snap(page, "cert-claim");
  await page.getByRole("button", { name: "Create my certificate" }).click();
  await page.waitForURL(/\/certificate\/ES-A1-/);
  await page.getByText("Juan dela Cruz").waitFor();
  await snap(page, "certificate");
  const certId = page.url().split("/").pop()!;
  const pdf = await page.request.get(`${BASE}/api/certificate/${certId}/pdf`);
  if (pdf.headers()["content-type"] !== "application/pdf" || (await pdf.body()).length < 2000) fail("certificate PDF missing");
  await (await import("node:fs/promises")).writeFile(`${SHOTS}/certificate.pdf`, await pdf.body());
  await page.goto(`${BASE}/verify/${certId}`);
  await page.getByText("This certificate is real").waitFor();
  await snap(page, "verify");
  await page.goto(`${BASE}/verify/ES-A1-AAAA-BBBB`);
  await page.getByText("No certificate has the ID").waitFor();
  log("certificate issued, PDF generated, verify page works", certId);

  // 9. A second learner fails the final → must wait 24 hours
  const ctx2 = await browser.newContext();
  const r2 = ctx2.request;
  await r2.get(`${BASE}/api/progress?today=${TODAY}`);
  const early = await r2.post(`${BASE}/api/exam/start`, { data: { kind: "final", id: "A1" } });
  if (early.status() !== 403) fail(`final should be locked for a new learner: ${early.status()}`);
  for (let t = 0; t < A1.topics.length; t++) {
    await apiLessons(r2, t);
    await apiExam(r2, "topic", A1.topics[t].id);
  }
  const bad = await apiExam(r2, "final", "A1", true);
  if (bad.passed || !bad.retryAt) fail("failed final should set a retry time");
  const again = await r2.post(`${BASE}/api/exam/start`, { data: { kind: "final", id: "A1" } });
  if (again.status() !== 429) fail(`retake within 24h should be refused: ${again.status()}`);
  const cert2 = await r2.post(`${BASE}/api/certificate`, { data: { name: "Not Passed" } });
  if (cert2.status() !== 403) fail("certificate issued without passing");
  log("failed final: 24-hour wait enforced, no certificate");

  if (errors.length) {
    console.log("\nBrowser errors:\n" + errors.join("\n"));
  }
  await browser.close();
  console.log(`\nAll checks passed. ${shot} screenshots in ${SHOTS}/`);
})().catch(async (e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
