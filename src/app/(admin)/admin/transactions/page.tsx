import { ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import { formatNaira } from "@/utils/finance";

const TYPE_LABELS: Record<TransactionType, string> = {
  CONTRIBUTION: "Contribution",
  DISBURSEMENT: "Disbursement",
  REPAYMENT: "Repayment",
};

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    q?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { type, q, from, to } = await searchParams;

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(type ? { type: type as TransactionType } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
          }
        : {}),
      ...(q ? { user: { name: { contains: q, mode: "insensitive" } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, matricNo: true } } },
  });

  const total = transactions.reduce(
    (sum, t) =>
      sum + (t.type === "DISBURSEMENT" ? -Number(t.amount) : Number(t.amount)),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          {transactions.length} record{transactions.length !== 1 ? "s" : ""} ·
          Net {formatNaira(total)}
        </p>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search member name"
          className="h-10 rounded-md border border-input bg-input px-3 text-sm"
        />
        <select
          name="type"
          defaultValue={type ?? ""}
          className="h-10 rounded-md border border-input bg-input px-3 text-sm"
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="h-10 rounded-md border border-input bg-input px-3 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="h-10 rounded-md border border-input bg-input px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Filter
        </button>
      </form>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <ReceiptText className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No transactions match this filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Reference</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.createdAt.toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{t.user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {TYPE_LABELS[t.type]}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {t.nombaReference ?? "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${t.type === "DISBURSEMENT" ? "text-destructive" : "text-success"}`}
                  >
                    {t.type === "DISBURSEMENT" ? "−" : "+"}
                    {formatNaira(Number(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
