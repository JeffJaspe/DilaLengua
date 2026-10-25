import { getLearner } from "@/lib/server/learner";
import { issueCertificate } from "@/lib/server/certificates";
import { body, handle, json } from "@/lib/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const { name } = await body<{ name: string }>(req);
    const learner = await getLearner(true);
    const cert = await issueCertificate(learner, String(name ?? ""));
    return json({ id: cert!.id });
  });
}
