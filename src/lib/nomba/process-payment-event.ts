import { prisma } from "@/lib/prisma";
import {
  ContributionStatus,
  InstallmentStatus,
  LoanStatus,
  TransactionType,
} from "@/generated/prisma/client";

type PaymentSuccessPayload = {
  event_type: "payment_success";
  requestId: string;
  data: {
    transaction: {
      transactionId: string;
      transactionAmount: number;
      time: string;
    };
    order: { orderReference: string; amount: number };
  };
};

export async function processPaymentEvent(payload: PaymentSuccessPayload) {
  if (payload.event_type !== "payment_success") return;

  const { orderReference } = payload.data.order;
  const { transactionId, transactionAmount } = payload.data.transaction;

  if (orderReference.startsWith("contrib_")) {
    await handleContributionPayment(
      orderReference,
      transactionId,
      transactionAmount,
    );
  } else if (orderReference.startsWith("install_")) {
    await handleInstallmentPayment(
      orderReference,
      transactionId,
      transactionAmount,
    );
  } else {
    console.warn(`Unrecognized orderReference pattern: ${orderReference}`);
  }
}

async function handleContributionPayment(
  orderReference: string,
  transactionId: string,
  amount: number,
) {
  const contribution = await prisma.contribution.findUnique({
    where: { nombaOrderReference: orderReference },
  });
  if (!contribution || contribution.status === ContributionStatus.PAID) return;

  await prisma.$transaction([
    prisma.contribution.update({
      where: { id: contribution.id },
      data: { status: ContributionStatus.PAID, paidAt: new Date() },
    }),
    prisma.transaction.create({
      data: {
        type: TransactionType.CONTRIBUTION,
        userId: contribution.userId,
        contributionId: contribution.id,
        amount,
        nombaReference: transactionId,
      },
    }),
  ]);
}

async function handleInstallmentPayment(
  orderReference: string,
  transactionId: string,
  amount: number,
) {
  const installment = await prisma.loanInstallment.findUnique({
    where: { nombaOrderReference: orderReference },
    include: { loan: { include: { installments: true } } },
  });
  if (!installment || installment.status === InstallmentStatus.PAID) return;

  const isLastUnpaid =
    installment.loan.installments.filter(
      (i) => i.status !== InstallmentStatus.PAID,
    ).length === 1;

  await prisma.$transaction([
    prisma.loanInstallment.update({
      where: { id: installment.id },
      data: { status: InstallmentStatus.PAID, paidAt: new Date() },
    }),
    prisma.transaction.create({
      data: {
        type: TransactionType.REPAYMENT,
        userId: installment.loan.userId,
        loanId: installment.loanId,
        loanInstallmentId: installment.id,
        amount,
        nombaReference: transactionId,
      },
    }),
    ...(isLastUnpaid
      ? [
          prisma.loan.update({
            where: { id: installment.loanId },
            data: { status: LoanStatus.COMPLETED },
          }),
        ]
      : []),
  ]);
}