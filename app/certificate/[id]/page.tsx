import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCertificate, levelName, verifyUrl } from "@/lib/server/certificates";
import { CertificateCard } from "@/components/certificate/CertificateCard";
import { ShareButtons } from "@/components/certificate/ShareButtons";
import { Confetti } from "@/components/Confetti";
import { IconBack } from "@/components/icons";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const cert = await getCertificate((await params).id);
  return { title: cert ? `${cert.name} · Spanish ${cert.level} certificate` : "Certificate" };
}

export default async function CertificatePage({ params }: Params) {
  const cert = await getCertificate((await params).id);
  if (!cert) notFound();
  const url = verifyUrl(cert.id);
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Confetti />
      <header className="relative flex items-center gap-2 px-4 pt-[18px] pb-1">
        <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-xl" aria-label="Back to the path">
          <IconBack />
        </Link>
        <h1 className="m-0 font-display text-2xl font-extrabold">¡Lo lograste!</h1>
      </header>
      <main className="relative flex flex-1 flex-col gap-[18px] px-5 pt-2 pb-8">
        <CertificateCard cert={cert} levelLabel={levelName(cert.level)} verifyUrl={url} />
        <ShareButtons id={cert.id} verifyUrl={url} />
        <Link href="/" className="btn btn-ink">
          Back to the path
        </Link>
      </main>
    </div>
  );
}
