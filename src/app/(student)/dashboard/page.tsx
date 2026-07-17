import Link from "next/link";
import {
  PiggyBank,
  HandCoins,
  FileDown,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNaira, getTotalContributions } from "@/utils/finance";
import { currentPeriod } from "@/utils/time";
import { getCurrentUserId } from "@/lib/auth";
import {
  LoanStatus,
  InstallmentStatus,
  ContributionStatus,
} from "@/generated/prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const period = currentPeriod();

  const [totalContributions, thisMonthContribution, activeLoan] =
    await Promise.all([
      getTotalContributions(userId),
      prisma.contribution.findUnique({
        where: { userId_period: { userId, period } },
      }),
      prisma.loan.findFirst({
        where: { userId, status: LoanStatus.ACTIVE },
        include: { installments: { orderBy: { installmentNo: "asc" } } },
      }),
    ]);

  const contributionPaid =
    thisMonthContribution?.status === ContributionStatus.PAID;

  let loanBalanceRemaining = 0;
  let nextInstallment:
    | (typeof activeLoan extends null
        ? never
        : NonNullable<typeof activeLoan>["installments"][number])
    | null = null;

  if (activeLoan) {
    const paidTotal = activeLoan.installments
      .filter((i) => i.status === InstallmentStatus.PAID)
      .reduce((sum, i) => sum + Number(i.amountDue), 0);
    loanBalanceRemaining = Number(activeLoan.principalAmount) - paidTotal;
    nextInstallment =
      activeLoan.installments.find(
        (i) => i.status !== InstallmentStatus.PAID,
      ) ?? null;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Contribution card */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
              <PiggyBank className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>This month's contribution</CardTitle>
              <CardDescription>
                {contributionPaid ? "Paid — thank you" : "Not yet paid"}
              </CardDescription>
            </div>
          </div>
          {contributionPaid ? (
            <CheckCircle2 className="size-5 text-success" />
          ) : (
            <Clock className="size-5 text-warning" />
          )}
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-2xl font-bold tabular-nums">
            {formatNaira(totalContributions)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              total saved
            </span>
          </p>
          {!contributionPaid && (
            <Button asChild className="w-full">
              <Link href="/contributions">Pay this month's contribution</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active loan card */}
      {activeLoan ? (
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
              <HandCoins className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Active loan</CardTitle>
              <CardDescription>
                Balance remaining: {formatNaira(loanBalanceRemaining)}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {nextInstallment && (
              <p className="mb-3 text-sm text-muted-foreground">
                Next installment:{" "}
                {formatNaira(Number(nextInstallment.amountDue))} due{" "}
                {nextInstallment.dueDate.toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href={`/loans/${activeLoan.id}`}>View loan details</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-secondary">
              <HandCoins className="size-6 text-primary" />
            </div>
            <CardTitle>No active loan</CardTitle>
            <CardDescription>
              You can borrow up to 3x your total contributions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/loans/apply">Apply for a loan</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline">
          <Link href="/loans">
            <HandCoins className="size-4" />
            My Loans
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/statements">
            <FileDown className="size-4" />
            Statements
          </Link>
        </Button>
      </div>
    </div>
  );
}
