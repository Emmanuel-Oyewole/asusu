import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generateStatementPdf } from "@/lib/pdf/statement";

export async function GET(req: NextRequest) {
  await requireAdmin(); // throws/redirects if not an admin — but this is a Route Handler, not a page,
  // so on failure this will redirect the raw fetch, not the browser tab context.
  // Acceptable here since the link to trigger this always originates from an
  // already-guarded /admin page.

  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const transactions = await prisma.transaction.findMany({
    where:
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
          }
        : {},
    orderBy: { createdAt: "asc" },
  });

  const periodLabel =
    from || to ? `${from ?? "Start"} — ${to ?? "Present"}` : "All Time";

  const pdfBytes = await generateStatementPdf({
    title: "Cooperative Financial Report",
    subtitle: "Aggregate contributions, disbursements, and repayments",
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
      "Content-Disposition": `attachment; filename="cooperative-report.pdf"`,
    },
  });
}
