import { getLearner, todayFrom } from "@/lib/server/learner";
import { submitExam, type ExamAnswer } from "@/lib/server/exams";
import { body, handle, json } from "@/lib/server/http";

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(req: Request) {
  return handle(async () => {
    const { attemptId, answers, today } = await body<{ attemptId: string; answers: Record<string, ExamAnswer>; today: string }>(req);
    if (!attemptId || !UUID.test(attemptId)) return json({ error: "Exam not found" }, 404);
    const learner = await getLearner(true);
    return json(await submitExam(learner, attemptId, answers ?? {}, todayFrom(today)));
  });
}
