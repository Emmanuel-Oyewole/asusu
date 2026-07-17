import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function getPoolBalance() {
  const sums = await prisma.transaction.groupBy({
    by: ["type"],
    _sum: { amount: true },
  });

  const get = (type: TransactionType) =>
    Number(sums.find((s) => s.type === type)?._sum.amount ?? 0);

  return (
    get(TransactionType.CONTRIBUTION) +
    get(TransactionType.REPAYMENT) -
    get(TransactionType.DISBURSEMENT)
  );
}

export async function getTotalContributions(userId: string) {
  const sum = await prisma.transaction.aggregate({
    where: { userId, type: TransactionType.CONTRIBUTION },
    _sum: { amount: true },
  });
  return Number(sum._sum.amount ?? 0);
}
