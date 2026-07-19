import { LoanStatus } from "@/generated/prisma/client";
import { Clock, CheckCircle2, XCircle, HandCoins, Trophy } from "lucide-react";

export const LOAN_STATUS_META: Record<
  LoanStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "muted";
    icon: React.ElementType;
  }
> = {
  PENDING: {
    label: "Pending Review",
    variant: "warning",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved — Awaiting Disbursement",
    variant: "success",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
  },
  ACTIVE: {
    label: "Active",
    variant: "success",
    icon: HandCoins,
  },
  COMPLETED: {
    label: "Completed",
    variant: "muted",
    icon: Trophy,
  },
};
