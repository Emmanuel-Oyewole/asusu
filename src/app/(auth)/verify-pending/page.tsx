import { redirect } from "next/navigation";
import { Clock, XCircle, ShieldCheck, Landmark } from "lucide-react";
import { requireAuthProfile, getCurrentUserId } from "@/lib/auth";
import { VerificationStatus, Role } from "../../../generated/prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AdmissionLetterUpload } from "@/components/forms/admission-letter-upload";

export default async function VerifyPendingPage() {
  const profile = await requireAuthProfile();

  if (profile.role === Role.ADMIN) redirect("/admin");
  if (profile.verificationStatus === VerificationStatus.VERIFIED)
    redirect("/dashboard");

  const userId = await getCurrentUserId();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex items-center gap-2 mb-8">
        <Landmark className="size-6 text-primary" />
        <span className="text-lg font-semibold">ABU Cooperative</span>
      </div>

      <Card className="w-full max-w-md">
        {profile.verificationStatus === VerificationStatus.PENDING_REVIEW && (
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-warning/10">
              <Clock className="size-6 text-warning" />
            </div>
            <CardTitle>Your account is under verification</CardTitle>
            <CardDescription>
              We've received your admission letter. An administrator is
              reviewing it — your account will be activated once verification is
              complete. This usually takes 1–2 business days.
            </CardDescription>
          </CardHeader>
        )}

        {profile.verificationStatus === VerificationStatus.REJECTED && (
          <>
            <CardHeader className="items-center text-center">
              <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="size-6 text-destructive" />
              </div>
              <CardTitle>Verification unsuccessful</CardTitle>
              <CardDescription>
                {profile.rejectionReason ||
                  "Your submitted document could not be verified."}{" "}
                Please upload a clearer copy of your admission letter to try
                again.
              </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <AdmissionLetterUpload userId={userId} />
            </div>
          </>
        )}

        {profile.verificationStatus === VerificationStatus.UNVERIFIED && (
          <>
            <CardHeader className="items-center text-center">
              <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-secondary">
                <ShieldCheck className="size-6 text-primary" />
              </div>
              <CardTitle>One last step</CardTitle>
              <CardDescription>
                Upload your admission letter so we can verify your account.
                You'll get access to the cooperative once it's reviewed.
              </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <AdmissionLetterUpload userId={userId} />
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
