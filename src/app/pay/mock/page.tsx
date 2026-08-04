import { Landmark, ShieldCheck } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { simulateMockPayment } from "@/lib/nomba/mock-actions";
import { isNombaMockMode } from "@/lib/nomba/mock-mode";
import { formatNaira } from "@/utils/finance";

export default async function MockCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; amount?: string; callback?: string }>;
}) {
  const { ref, amount, callback } = await searchParams;

  if (!isNombaMockMode() || !ref || !amount || !callback) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">
          This payment link is invalid or has expired.
        </p>
      </main>
    );
  }

  const amountNumber = Number(amount);

  async function confirmPayment() {
    "use server";
    await simulateMockPayment(ref!, amountNumber, callback!);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-secondary">
            <Landmark className="size-6 text-primary" />
          </div>
          <CardTitle>Confirm Payment</CardTitle>
          <CardDescription>
            Simulated checkout — sandbox environment
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatNaira(amountNumber)}
            </p>
          </div>

          <form action={confirmPayment}>
            <Button type="submit" className="w-full">
              Simulate Successful Payment
            </Button>
          </form>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            No real payment is processed in this environment
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
