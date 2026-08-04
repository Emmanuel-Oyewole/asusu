import { PiggyBank, CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { TransactionType, ContributionStatus } from "@/generated/prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { PayContributionButton } from "@/components/forms/pay-contribution-button";
import { formatNaira } from "@/utils/finance";
import { currentPeriod, formatPeriod } from "@/utils/time";

export default async function ContributionsPage() {
  const userId = await getCurrentUserId();
  const period = currentPeriod();

  const [totalSum, history, thisMonth] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: TransactionType.CONTRIBUTION },
      _sum: { amount: true },
    }),
    prisma.contribution.findMany({
      where: { userId },
      orderBy: { period: "desc" },
    }),
    prisma.contribution.findUnique({
      where: { userId_period: { userId, period } },
    }),
  ]);

  const totalContributions = Number(totalSum._sum.amount ?? 0);
  const isPaidThisMonth = thisMonth?.status === ContributionStatus.PAID;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Contributions</h1>
        <p className="text-sm text-muted-foreground">
          Your monthly savings history
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
            <PiggyBank className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl tabular-nums">
              {formatNaira(totalContributions)}
            </CardTitle>
            <CardDescription>Total saved</CardDescription>
          </div>
        </CardHeader>
        {!isPaidThisMonth && (
          <CardContent>
            <PayContributionButton />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No contributions yet.
            </p>
          ) : (
            history.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{formatPeriod(c.period)}</p>
                  {c.paidAt && (
                    <p className="text-xs text-muted-foreground">
                      Paid{" "}
                      {c.paidAt.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium tabular-nums">
                    {formatNaira(Number(c.amount))}
                  </span>
                  {c.status === ContributionStatus.PAID ? (
                    <StatusPill
                      label="Paid"
                      variant="success"
                      icon={CheckCircle2}
                    />
                  ) : (
                    <StatusPill
                      label="Pending"
                      variant="warning"
                      icon={Clock}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}