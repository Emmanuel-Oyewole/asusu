import { notFound } from "next/navigation";
import { Mail, Phone, GraduationCap, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { LOAN_STATUS_META } from "@/lib/loan-status";
import { PromoteAdminButton } from "@/components/admin/promote-admin-button";
import { formatNaira } from "@/utils/finance";
import Link from "next/link";

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = await prisma.user.findUnique({
    where: { id },
    include: {
      loans: { orderBy: { createdAt: "desc" } },
      contributions: { orderBy: { period: "desc" } },
    },
  });
  if (!member) notFound();

  const totalContributions = member.contributions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{member.name}</h1>
          <p className="text-sm text-muted-foreground">
            {member.matricNo} · {member.department}
          </p>
        </div>
        {member.role === Role.STUDENT && (
          <PromoteAdminButton userId={member.id} />
        )}
        {member.role === Role.ADMIN && (
          <StatusPill label="Admin" variant="success" />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Row icon={Mail} label="Email" value={member.email} />
            <Row icon={Phone} label="Phone" value={member.phone} />
            <Row
              icon={GraduationCap}
              label="Department"
              value={member.department}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total contributions</span>
              <span className="font-medium tabular-nums">
                {formatNaira(totalContributions)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Max loan eligibility (3x)
              </span>
              <span className="font-medium tabular-nums">
                {formatNaira(totalContributions * 3)}
              </span>
            </div>
            {member.admissionLetterPath && (
              <Link
                href={`/admin/verifications/${member.id}`}
                className="mt-2 flex items-center gap-2 text-primary underline underline-offset-4"
              >
                <FileText className="size-4" />
                View admission letter
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loan history</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {member.loans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No loans.</p>
          ) : (
            member.loans.map((loan) => {
              const meta = LOAN_STATUS_META[loan.status];
              return (
                <Link
                  key={loan.id}
                  href={`/admin/loans/${loan.id}`}
                  className="flex items-center justify-between py-3 text-sm hover:bg-muted/50"
                >
                  <span className="tabular-nums">
                    {formatNaira(Number(loan.principalAmount))}
                  </span>
                  <StatusPill
                    label={meta.label}
                    variant={meta.variant}
                    icon={meta.icon}
                  />
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
