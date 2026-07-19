import Link from "next/link";
import { HandCoins } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { LoanStatus } from "@/generated/prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { LOAN_STATUS_META } from "@/lib/loan-status";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/utils/finance";
import { cn } from "@/lib/utils";

type Filter = {
  key: string;
  label: string;
  statuses: LoanStatus[] | null;
};

const FILTERS: Filter[] = [
  { key: "all", label: "All", statuses: null },
  { key: "active", label: "Active", statuses: [LoanStatus.ACTIVE] },
  {
    key: "pending",
    label: "Pending",
    statuses: [LoanStatus.PENDING, LoanStatus.APPROVED],
  },
  { key: "completed", label: "Completed", statuses: [LoanStatus.COMPLETED] },
  { key: "rejected", label: "Rejected", statuses: [LoanStatus.REJECTED] },
];


export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const userId = await getCurrentUserId();
  const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const loans = await prisma.loan.findMany({
    where: {
      userId,
      ...(activeFilter.statuses
        ? { status: { in: activeFilter.statuses } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Loans</h1>
        <Button  size="sm">
          <Link href="/loans/apply">Apply</Link>
        </Button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/loans" : `/loans?filter=${f.key}`}
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
        <div className="flex flex-col gap-3">
          {loans.map((loan) => {
            const meta = LOAN_STATUS_META[loan.status];
            return (
              <Link key={loan.id} href={`/loans/${loan.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg tabular-nums">
                        {formatNaira(Number(loan.principalAmount))}
                      </CardTitle>
                      <CardDescription>{loan.purpose}</CardDescription>
                    </div>
                    <StatusPill
                      label={meta.label}
                      variant={meta.variant}
                      icon={meta.icon}
                    />
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
