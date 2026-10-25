import { getLearner } from "@/lib/server/learner";
import { startExam, type ExamKind } from "@/lib/server/exams";
import { body, handle, json } from "@/lib/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const { kind, id } = await body<{ kind: ExamKind; id: string }>(req);
    if (kind !== "topic" && kind !== "final") return json({ error: "Unknown exam" }, 400);
    const learner = await getLearner(true);
    return json(await startExam(learner, kind, String(id ?? "")));
  });
}
