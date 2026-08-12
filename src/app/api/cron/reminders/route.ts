import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications/notify";
import {
  InstallmentStatus,
  ContributionStatus,
  NotificationType,
  Role,
  VerificationStatus,
} from "@/generated/prisma/client";

import { currentPeriod } from "@/utils/time";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    dueReminders: 0,
    overdueFlipped: 0,
    contributionReminders: 0,
  };

  // ── 1. Installments due within the reminder window, not yet reminded ──
  const reminderThreshold = new Date();
  reminderThreshold.setDate(
    reminderThreshold.getDate() + Number(process.env.DUE_REMINDER_WINDOW_DAYS),
  );

  const dueSoon = await prisma.loanInstallment.findMany({
    where: {
      status: InstallmentStatus.PENDING,
      dueReminderSentAt: null,
      dueDate: { lte: reminderThreshold, gte: new Date() },
    },
    include: { loan: true },
  });

  for (const inst of dueSoon) {
    await notifyUser(
      inst.loan.userId,
      NotificationType.INSTALLMENT_DUE,
      "Installment due soon",
      `Your installment of ₦${Number(inst.amountDue).toLocaleString("en-NG")} is due on ${inst.dueDate.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}.`,
      `/loans/${inst.loanId}`,
    );
    await prisma.loanInstallment.update({
      where: { id: inst.id },
      data: { dueReminderSentAt: new Date() },
    });
    results.dueReminders++;
  }

  // ── 2. Installments past due, still PENDING → flip to OVERDUE + notify ──
  // This is also where lib/eligibility.ts's checkLoanEligibility could switch
  // from checking dueDate directly to trusting this stored status, per the
  // decision we made back at Sprint 3 planning — worth revisiting now that
  // this actually exists, though not required for this cron to work correctly.
  const overdue = await prisma.loanInstallment.findMany({
    where: { status: InstallmentStatus.PENDING, dueDate: { lt: new Date() } },
    include: { loan: true },
  });

  for (const inst of overdue) {
    await prisma.loanInstallment.update({
      where: { id: inst.id },
      data: { status: InstallmentStatus.OVERDUE },
    });
    await notifyUser(
      inst.loan.userId,
      NotificationType.INSTALLMENT_OVERDUE,
      "Installment overdue",
      `Your installment of ₦${Number(inst.amountDue).toLocaleString("en-NG")} was due on ${inst.dueDate.toLocaleDateString("en-NG", { day: "numeric", month: "short" })} and is now overdue. Please pay as soon as possible.`,
      `/loans/${inst.loanId}`,
    );
    results.overdueFlipped++;
  }

  // ── 3. Monthly contribution reminder ──
  // No dedicated "reminded" field needed here — a Contribution row for the
  // current period simply doesn't exist yet until the student starts paying
  // (see payContribution's create-on-demand logic), so we instead check
  // whether a CONTRIBUTION_DUE notification already went out this period,
  // using the Notification log itself as the duplicate guard.
  const period = currentPeriod();
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );

  const verifiedStudents = await prisma.user.findMany({
    where: {
      role: Role.STUDENT,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    select: { id: true },
  });

  for (const student of verifiedStudents) {
    const [paidThisPeriod, alreadyReminded] = await Promise.all([
      prisma.contribution.findUnique({
        where: { userId_period: { userId: student.id, period } },
        select: { status: true },
      }),
      prisma.notification.findFirst({
        where: {
          userId: student.id,
          type: NotificationType.CONTRIBUTION_DUE,
          createdAt: { gte: monthStart },
        },
      }),
    ]);

    if (paidThisPeriod?.status === ContributionStatus.PAID || alreadyReminded)
      continue;

    await notifyUser(
      student.id,
      NotificationType.CONTRIBUTION_DUE,
      "Contribution due",
      "Don't forget to make your monthly contribution to the cooperative.",
      "/contributions",
    );
    results.contributionReminders++;
  }

  return NextResponse.json({ success: true, ...results });
}
