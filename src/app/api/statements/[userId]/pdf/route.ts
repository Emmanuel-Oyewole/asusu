import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateStatementPdf } from "@/lib/pdf/statement";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const requesterId = await getCurrentUserId();

  // Ownership check — a student can only ever download their own statement
  if (userId !== requesterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const periodLabel =
    from || to ? `${from ?? "Start"} — ${to ?? "Present"}` : "All Time";

  const pdfBytes = await generateStatementPdf({
    title: "Member Statement",
    subtitle: "Record of contributions, disbursements, and repayments",
    memberName: user.name,
    memberMatricNo: user.matricNo,
    periodLabel,
    transactions: transactions.map((t) => ({
      createdAt: t.createdAt,
      type: t.type,
      amount: Number(t.amount),
      nombaReference: t.nombaReference,
    })),
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="statement-${user.matricNo}.pdf"`,
    },
  });
}
