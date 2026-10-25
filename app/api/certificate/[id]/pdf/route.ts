import { certificatePdf, getCertificate } from "@/lib/server/certificates";
import { handle, json } from "@/lib/server/http";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const cert = await getCertificate(id);
    if (!cert) return json({ error: "Certificate not found" }, 404);
    const bytes = await certificatePdf(cert);
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${cert.id}.pdf"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  });
}
