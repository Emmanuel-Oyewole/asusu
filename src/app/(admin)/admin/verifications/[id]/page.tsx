import { notFound } from "next/navigation";
import { FileText, Mail, Phone, GraduationCap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { VerificationReviewActions } from "@/components/admin/verification-review-actions";

export default async function VerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await prisma.user.findUnique({ where: { id } });
  if (!student) notFound();

  let signedUrl: string | null = null;
  if (student.admissionLetterPath) {
    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin.storage
      .from("admission-letters")
      .createSignedUrl(student.admissionLetterPath, 60 * 10); // valid 10 minutes
    signedUrl = data?.signedUrl ?? null;
  }

  const isImage = student.admissionLetterPath?.match(/\.(jpg|jpeg|png)$/i);
  const isPdf = student.admissionLetterPath?.match(/\.pdf$/i);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{student.name}</h1>
        <p className="text-sm text-muted-foreground">Verification review</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <DetailRow icon={GraduationCap} label="Matric Number" value={student.matricNo} />
            <DetailRow icon={GraduationCap} label="Department" value={student.department} />
            <DetailRow icon={Mail} label="Email" value={student.email} />
            <DetailRow icon={Phone} label="Phone" value={student.phone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admission letter</CardTitle>
          </CardHeader>
          <CardContent>
            {!signedUrl && <p className="text-sm text-muted-foreground">No document uploaded.</p>}

            {signedUrl && isImage && (
              // Signed Supabase Storage URLs are dynamic/per-request, so next/image's
              // static remotePatterns config isn't worth it here — plain <img> is fine
              // for an internal admin-only view.
              <img
                src={signedUrl}
                alt="Admission letter"
                className="max-h-96 w-full rounded-lg border border-border object-contain"
              />
            )}

            {signedUrl && isPdf && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary underline underline-offset-4"
              >
                <FileText className="size-4" />
                Open PDF document
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision</CardTitle>
        </CardHeader>
        <CardContent>
          <VerificationReviewActions userId={student.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
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