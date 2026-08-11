import Link from "next/link";
import { Users, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  VerificationStatus,
  LoanStatus,
  TransactionType,
} from "@/generated/prisma/client";
import { StatusPill } from "@/components/dashboard/status-pill";
import { formatNaira } from "@/utils/finance";

const STATUS_META: Record<
  VerificationStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "muted" }
> = {
  VERIFIED: { label: "Verified", variant: "success" },
  PENDING_REVIEW: { label: "Pending", variant: "warning" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  UNVERIFIED: { label: "Unverified", variant: "muted" },
};

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status } = await searchParams;

  const members = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(status ? { verificationStatus: status as VerificationStatus } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { matricNo: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      loans: { where: { status: LoanStatus.ACTIVE }, select: { id: true } },
      transactions: {
        where: { type: TransactionType.CONTRIBUTION },
        select: { amount: true },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row" method="get">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name or matric number"
            className="h-10 w-full rounded-md border border-input bg-input pl-9 pr-3 text-sm"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-md border border-input bg-input px-3 text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Filter
        </button>
      </form>

      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No members match this filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Matric No.</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">
                  Total Contributions
                </th>
                <th className="px-4 py-3 text-left font-medium">Active Loan</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const meta = STATUS_META[m.verificationStatus];
                const total = m.transactions.reduce(
                  (sum, t) => sum + Number(t.amount),
                  0,
                );
                return (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="font-medium text-primary underline underline-offset-4"
                      >
                        {m.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.matricNo}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill label={meta.label} variant={meta.variant} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatNaira(total)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.loans.length > 0 ? "Yes" : "—"}
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