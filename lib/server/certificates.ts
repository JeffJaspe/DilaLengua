import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { certificates, db, learners, topicStatus } from "../db";
import { A1 } from "../../content/index";
import { getProgressData } from "./progress";
import type { LearnerRow } from "./learner";

// No 0/O, 1/I/L, so codes are easy to read and type.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const block = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
export const newCertificateId = (level: string) => `ES-${level}-${block()}-${block()}`;

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const verifyUrl = (id: string) => `${siteUrl()}/verify/${id}`;

export class CertificateError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Issue the A1 certificate once the final is passed. Calling it again returns the same certificate. */
export async function issueCertificate(learner: LearnerRow, rawName: string) {
  const name = rawName.replace(/\s+/g, " ").trim().slice(0, 60);
  if (name.length < 2) throw new CertificateError("Please enter the name to print on your certificate.");
  const data = await getProgressData(learner.id);
  if (!data.final.passed) throw new CertificateError("Pass the final exam to earn your certificate.", 403);
  if (data.certificateId) return getCertificate(data.certificateId);

  const passedTopics = await db
    .select({ id: topicStatus.topicId })
    .from(topicStatus)
    .where(and(eq(topicStatus.learnerId, learner.id), eq(topicStatus.passed, true)));
  const [row] = await db
    .insert(certificates)
    .values({
      id: newCertificateId(A1.code),
      learnerId: learner.id,
      name,
      level: A1.code,
      score: data.final.bestScore,
      topicsPassed: passedTopics.length,
    })
    .returning();
  await db.update(learners).set({ name }).where(eq(learners.id, learner.id));
  return row;
}

export async function getCertificate(id: string) {
  if (!/^ES-[A-C][12]-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(id)) return null;
  const [row] = await db.select().from(certificates).where(eq(certificates.id, id)).limit(1);
  return row ?? null;
}

export const levelName = (code: string) => (code === A1.code ? `${A1.code} ${A1.name}` : code);

// Helvetica (WinAnsi) covers Spanish letters; drop anything it cannot draw.
const safe = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, "");

function center(page: PDFPage, text: string, y: number, size: number, font: PDFFont, color = rgb(0.118, 0.106, 0.227)) {
  const t = safe(text);
  const w = font.widthOfTextAtSize(t, size);
  page.drawText(t, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

export async function certificatePdf(cert: NonNullable<Awaited<ReturnType<typeof getCertificate>>>) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Spanish ${cert.level} certificate — ${safe(cert.name)}`);
  const page = pdf.addPage([842, 595]); // A4 landscape
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.118, 0.106, 0.227);
  const sun = rgb(1, 0.824, 0.247);
  const paper = rgb(1, 0.984, 0.941);
  const coral = rgb(1, 0.42, 0.341);
  const W = page.getWidth();
  const H = page.getHeight();

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: sun });
  page.drawRectangle({ x: 28, y: 28, width: W - 56, height: H - 56, color: paper, borderColor: ink, borderWidth: 4 });
  page.drawRectangle({ x: 44, y: 44, width: W - 88, height: H - 88, borderColor: ink, borderWidth: 1.2, borderDashArray: [6, 5] });

  // Sol, the mascot, as the seal.
  const cx = W / 2;
  const cy = H - 112;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    page.drawLine({
      start: { x: cx + Math.cos(a) * 34, y: cy + Math.sin(a) * 34 },
      end: { x: cx + Math.cos(a) * 48, y: cy + Math.sin(a) * 48 },
      thickness: 7,
      color: rgb(1, 0.624, 0.11),
    });
  }
  page.drawCircle({ x: cx, y: cy, size: 28, color: rgb(1, 0.624, 0.11), borderColor: ink, borderWidth: 2.5 });
  page.drawCircle({ x: cx - 9, y: cy + 5, size: 3, color: ink });
  page.drawCircle({ x: cx + 9, y: cy + 5, size: 3, color: ink });
  page.drawCircle({ x: cx - 16, y: cy - 4, size: 4, color: coral, opacity: 0.8 });
  page.drawCircle({ x: cx + 16, y: cy - 4, size: 4, color: coral, opacity: 0.8 });
  page.drawSvgPath("M -10 0 Q 0 12 10 0", { x: cx, y: cy - 4, borderColor: ink, borderWidth: 2.5 }); // SVG y points down: a smile

  center(page, "CERTIFICADO DE FINALIZACIÓN", H - 190, 13, bold);
  center(page, "This certifies that", H - 222, 13, regular);
  center(page, cert.name, H - 270, 36, bold, ink);
  center(page, `has completed all ${cert.topicsPassed} topics and passed the final exam of`, H - 302, 13, regular);

  const label = safe(`Spanish · ${levelName(cert.level)}`);
  const lw = bold.widthOfTextAtSize(label, 18);
  page.drawRectangle({ x: (W - lw) / 2 - 18, y: H - 352, width: lw + 36, height: 34, color: sun, borderColor: ink, borderWidth: 2 });
  center(page, label, H - 341, 18, bold);

  const issued = cert.issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  center(page, `Final exam score ${cert.score}%   ·   Issued ${issued}`, H - 390, 12, regular);

  const qr = await QRCode.toBuffer(verifyUrl(cert.id), { margin: 1, width: 240, color: { dark: "#1E1B3AFF", light: "#FFFBF0FF" } });
  const qrImg = await pdf.embedPng(qr);
  page.drawImage(qrImg, { x: 70, y: 66, width: 88, height: 88 });
  page.drawText(safe(`Certificate ID ${cert.id}`), { x: 172, y: 120, size: 11, font: bold, color: ink });
  page.drawText(safe(`Verify at ${verifyUrl(cert.id)}`), { x: 172, y: 102, size: 10, font: regular, color: ink });

  const note = "Course certificate aligned with CEFR A1 descriptors. Not an official DELE or SIELE diploma.";
  page.drawText(note, { x: W - 70 - regular.widthOfTextAtSize(note, 9), y: 70, size: 9, font: regular, color: rgb(0.24, 0.22, 0.34) });

  return pdf.save();
}
