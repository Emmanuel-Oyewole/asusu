import { Landmark, Users, HandCoins, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Role, LoanStatus } from "@/generated/prisma/client";
import { formatNaira, getPoolBalance } from "@/utils/finance";

export default async function AdminOverviewPage() {
  const [
    poolBalance,
    totalMembers,
    activeLoans,
    overdueInstallments,
    recentTransactions,
  ] = await Promise.all([
    getPoolBalance(),
    prisma.user.count({ where: { role: Role.STUDENT } }),
    prisma.loan.count({ where: { status: LoanStatus.ACTIVE } }),
    prisma.loanInstallment.count({
      where: { status: "PENDING", dueDate: { lt: new Date() } },
    }),
    prisma.transaction.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { label: "Pool Balance", value: formatNaira(poolBalance), icon: Landmark },
    {
      label: "Total Members",
      value: totalMembers.toLocaleString(),
      icon: Users,
    },
    {
      label: "Active Loans",
      value: activeLoans.toLocaleString(),
      icon: HandCoins,
    },
    {
      label: "Overdue Installments",
      value: overdueInstallments.toLocaleString(),
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Live snapshot of the cooperative
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{tx.user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {tx.type.toLowerCase()} ·{" "}
                      {tx.createdAt.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums">
                    {formatNaira(Number(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
