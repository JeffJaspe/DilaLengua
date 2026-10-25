import { getLearner, todayFrom } from "@/lib/server/learner";
import { getProgressData, summary } from "@/lib/server/progress";
import { handle, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const learner = await getLearner(true);
    const today = todayFrom(new URL(req.url).searchParams.get("today"));
    const [me, progress] = await Promise.all([summary(learner, today), getProgressData(learner.id)]);
    return json({ me, progress });
  });
}
