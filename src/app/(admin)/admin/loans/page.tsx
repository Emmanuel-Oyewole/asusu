import Link from "next/link";
import { HandCoins } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LoanStatus } from "@/generated/prisma/client";
import { StatusPill } from "@/components/dashboard/status-pill";
import { LOAN_STATUS_META } from "@/lib/loan-status";
import { formatNaira } from "@/utils/finance";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "pending", label: "Pending Review", statuses: [LoanStatus.PENDING] },
  {
    key: "approved",
    label: "Awaiting Disbursement",
    statuses: [LoanStatus.APPROVED],
  },
  { key: "active", label: "Active", statuses: [LoanStatus.ACTIVE] },
  { key: "completed", label: "Completed", statuses: [LoanStatus.COMPLETED] },
  { key: "rejected", label: "Rejected", statuses: [LoanStatus.REJECTED] },
  { key: "all", label: "All", statuses: null },
] as const;

export default async function AdminLoansQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "pending" } = await searchParams;
  const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const loans = await prisma.loan.findMany({
    where: activeFilter.statuses
      ? { status: { in: activeFilter.statuses } }
      : {},
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, matricNo: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Loan Requests</h1>
        <p className="text-sm text-muted-foreground">
          {loans.length} loan{loans.length !== 1 ? "s" : ""} in this view
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/loans?filter=${f.key}`}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium",
              activeFilter.key === f.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {loans.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <HandCoins className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No loans in this category.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Term</th>
                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const meta = LOAN_STATUS_META[loan.status];
                return (
                  <tr key={loan.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium">{loan.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {loan.user.matricNo}
                      </p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatNaira(Number(loan.principalAmount))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {loan.termMonths} months
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {loan.createdAt.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={meta.label}
                        variant={meta.variant}
                        icon={meta.icon}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/loans/${loan.id}`}
                        className="text-primary underline underline-offset-4"
                      >
                        {loan.status === LoanStatus.APPROVED
                          ? "Disburse"
                          : "Review"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
