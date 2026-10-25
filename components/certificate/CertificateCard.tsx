import QRCode from "qrcode";
import { Sol } from "../Sol";

type Cert = { id: string; name: string; level: string; score: number; topicsPassed: number; issuedAt: Date };

export async function CertificateCard({ cert, levelLabel, verifyUrl }: { cert: Cert; levelLabel: string; verifyUrl: string }) {
  const qr = await QRCode.toString(verifyUrl, { type: "svg", margin: 0, color: { dark: "#1E1B3A", light: "#FFFBF0" } });
  const issued = cert.issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <div className="card animate-pop p-2.5">
      <div className="flex flex-col items-center gap-2 rounded-[14px] border-[2.5px] border-dashed border-ink px-4 pt-[18px] pb-3.5 text-center">
        <Sol size={64} mood="cheer" />
        <div className="text-xs font-bold tracking-[2.5px] uppercase">Certificado de finalización</div>
        <div className="text-sm font-medium">This certifies that</div>
        <div className="font-display text-[32px] leading-[1.05] font-extrabold break-words">{cert.name}</div>
        <div className="text-sm font-medium">has completed all {cert.topicsPassed} topics and passed the final exam of</div>
        <div className="rounded-full border-3 border-ink bg-sun px-3.5 py-1.5 font-display text-[15px] font-extrabold">Spanish · {levelLabel}</div>
        <div className="mt-1 flex w-full gap-2">
          {[
            ["Final exam", `${cert.score}%`, "bg-mint-soft"],
            ["Topic tests", `${cert.topicsPassed} / ${cert.topicsPassed}`, "bg-[#D3EEF9]"],
            ["Date", issued, "bg-[#FFE0DA]"],
          ].map(([k, v, bg]) => (
            <div key={k} className={`flex flex-1 flex-col gap-px rounded-xl border-[2.5px] border-ink px-1 py-2 ${bg}`}>
              <span className="text-[10px] font-bold tracking-wider uppercase">{k}</span>
              <span className="font-display text-[15px] font-extrabold">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex w-full items-center gap-3 border-t-[2.5px] border-dashed border-ink pt-2.5 text-left">
          <div className="h-[62px] w-[62px] flex-none rounded-lg border-[2.5px] border-ink bg-paper p-1 [&_svg]:h-full [&_svg]:w-full" role="img" aria-label="QR code to verify this certificate" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="min-w-0 text-[12.5px] leading-snug">
            <div className="font-extrabold">ID {cert.id}</div>
            <div className="break-all">Verify at {verifyUrl.replace(/^https?:\/\//, "")}</div>
          </div>
        </div>
        <div className="mt-1 text-[11px] leading-snug text-muted">Course certificate aligned with CEFR {cert.level} descriptors. Not an official DELE or SIELE diploma.</div>
      </div>
    </div>
  );
}
