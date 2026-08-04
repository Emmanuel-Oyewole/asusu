import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { InstallPrompt } from "@/components/dashboard/install-prompt";
import { PushNotificationManager } from "@/components/dashboard/push-notification-manager";
import { BankDetailsForm } from "@/components/forms/bank-details-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">{user.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>
            {user.matricNo} · {user.department}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span>{user.phone}</span>
          </div>
        </CardContent>
      </Card>

      <BankDetailsForm
        defaults={{
          bankCode: user.bankCode,
          bankAccountNumber: user.bankAccountNumber,
          bankAccountName: user.bankAccountName,
        }}
      />

      <InstallPrompt />
      <PushNotificationManager />
    </div>
  );
}
