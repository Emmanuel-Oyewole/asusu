import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatNaira } from "@/utils/finance";

type StatementTransaction = {
  createdAt: Date;
  type: string;
  amount: number;
  nombaReference: string | null;
};

type GenerateStatementInput = {
  title: string;
  subtitle: string;
  memberName?: string;
  memberMatricNo?: string;
  periodLabel: string;
  transactions: StatementTransaction[];
};

const GREEN = rgb(0.051, 0.396, 0.212); // matches --primary
const GRAY = rgb(0.4, 0.4, 0.4);
const BLACK = rgb(0.1, 0.1, 0.1);

export async function generateStatementPdf(input: GenerateStatementInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([595, 842]); // A4
  const margin = 50;
  let y = 792;

  function drawText(text: string, x: number, yPos: number, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}) {
    page.drawText(text, {
      x,
      y: yPos,
      size: opts.size ?? 10,
      font: opts.bold ? boldFont : font,
      color: opts.color ?? BLACK,
    });
  }

  function newPageIfNeeded(spaceNeeded: number) {
    if (y - spaceNeeded < margin) {
      page = doc.addPage([595, 842]);
      y = 792;
    }
  }

  // Header
  drawText("ABU Cooperative", margin, y, { size: 16, bold: true, color: GREEN });
  y -= 20;
  drawText(input.title, margin, y, { size: 12, bold: true });
  y -= 16;
  drawText(input.subtitle, margin, y, { size: 9, color: GRAY });
  y -= 30;

  if (input.memberName) {
    drawText(`Member: ${input.memberName}`, margin, y, { size: 10 });
    y -= 14;
    drawText(`Matric No: ${input.memberMatricNo}`, margin, y, { size: 10 });
    y -= 14;
  }
  drawText(`Period: ${input.periodLabel}`, margin, y, { size: 10 });
  y -= 14;
  drawText(`Generated: ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`, margin, y, { size: 10 });
  y -= 30;

  // Table header
  const colX = { date: margin, type: margin + 90, ref: margin + 220, amount: 545 };
  drawText("Date", colX.date, y, { bold: true, size: 9 });
  drawText("Type", colX.type, y, { bold: true, size: 9 });
  drawText("Reference", colX.ref, y, { bold: true, size: 9 });
  drawText("Amount", colX.amount - 60, y, { bold: true, size: 9 });
  y -= 6;
  page.drawLine({ start: { x: margin, y }, end: { x: 545, y }, thickness: 0.5, color: GRAY });
  y -= 16;

  let runningTotal = 0;

  for (const tx of input.transactions) {
    newPageIfNeeded(20);

    const signedAmount = tx.type === "DISBURSEMENT" ? -tx.amount : tx.amount;
    runningTotal += signedAmount;

    drawText(tx.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }), colX.date, y, { size: 9 });
    drawText(tx.type.charAt(0) + tx.type.slice(1).toLowerCase(), colX.type, y, { size: 9 });
    drawText(tx.nombaReference?.slice(0, 24) ?? "—", colX.ref, y, { size: 8, color: GRAY });
    const amountText = `${signedAmount < 0 ? "-" : "+"}${formatNaira(Math.abs(signedAmount))}`;
    drawText(amountText, colX.amount - font.widthOfTextAtSize(amountText, 9), y, {
      size: 9,
      color: signedAmount < 0 ? rgb(0.7, 0.1, 0.1) : rgb(0.1, 0.5, 0.2),
    });
    y -= 16;
  }

  newPageIfNeeded(40);
  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: 545, y }, thickness: 0.5, color: GRAY });
  y -= 20;
  drawText("Net Total", colX.type, y, { bold: true, size: 10 });
  const totalText = formatNaira(runningTotal);
  drawText(totalText, colX.amount - boldFont.widthOfTextAtSize(totalText, 10), y, { bold: true, size: 10 });

  return doc.save();
}