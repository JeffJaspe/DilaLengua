import Link from "next/link";
import type { Metadata } from "next";
import { getCertificate, levelName, verifyUrl } from "@/lib/server/certificates";
import { CertificateCard } from "@/components/certificate/CertificateCard";
import { IconCheck, IconX } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verify a certificate" };

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = await getCertificate(id.toUpperCase());
  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pt-8 pb-10">
      <h1 className="m-0 font-display text-[30px] leading-tight font-extrabold">Certificate check</h1>
      {cert ? (
        <>
          <div className="flex items-center gap-3 rounded-2xl border-3 border-ink bg-mint p-3.5 font-bold shadow-chunky-sm">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-3 border-ink bg-paper">
              <IconCheck size={20} />
            </span>
            This certificate is real. It was issued on {cert.issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
          </div>
          <CertificateCard cert={cert} levelLabel={levelName(cert.level)} verifyUrl={verifyUrl(cert.id)} />
        </>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border-3 border-ink bg-coral p-3.5 font-bold shadow-chunky-sm">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-3 border-ink bg-paper">
            <IconX size={18} />
          </span>
          No certificate has the ID “{id}”. Check the code and try again.
        </div>
      )}
      <Link href="/" className="text-center font-bold text-ink underline">
        Learn Spanish page by page
      </Link>
    </main>
  );
}
