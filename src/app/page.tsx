import Link from "next/link";
import {
  Landmark,
  PiggyBank,
  HandCoins,
  ShieldCheck,
  Construction,
} from "lucide-react";
import { InstallPrompt } from "@/components/dashboard/install-prompt";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const steps = [
  {
    icon: PiggyBank,
    title: "Save",
    description:
      "Contribute monthly to build your standing in the cooperative pool.",
  },
  {
    icon: HandCoins,
    title: "Borrow",
    description:
      "Request a loan of up to 3x your total contributions, reviewed by the admin.",
  },
  {
    icon: ShieldCheck,
    title: "Repay",
    description:
      "Pay back in fixed monthly installments, tracked automatically.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Landmark className="size-6 text-primary" />
            <span className="text-xl font-bold text-foreground font-sans">
              ABU Cooperative
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Install prompt — first thing visible */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-6">
        <InstallPrompt />
      </div>

      {/* Work-in-progress banner */}
      <div className="bg-warning/10 border-b border-warning/20">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3 text-sm text-warning font-sans">
          <Construction className="size-4 shrink-0" />
          <span className="font-medium">
            This platform is under active development. Some features shown below
            are not yet live.
          </span>
        </div>
      </div>

      {/* Green accent bar */}
      <div className="h-1 bg-primary"></div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/30 rounded-full px-4 py-2 mb-6 font-sans">
              <ShieldCheck className="size-4" />
              <span className="text-sm font-medium">
                Built for ABU students
              </span>
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight font-sans">
            Save together.
            <br />
            <span className="text-primary-foreground/90">
              Borrow with trust.
            </span>
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl leading-relaxed font-sans">
            A transparent, digital home for your cooperative — track every
            contribution, request loans against your savings, and see the fund's
            health in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:opacity-90 transition-opacity font-semibold"
            >
              <Link href="/register">Get started</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 transition-colors font-semibold"
            >
              <Link href="/login">Log in</Link>
            </Button>
          </div>
          <p className="text-primary-foreground/70 text-sm mt-6 font-sans">
            Registration opens soon — check back shortly.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-background px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-3 font-sans">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground font-sans">
              Three simple steps to start saving and borrowing within your
              cooperative
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <Card
                key={step.title}
                className="border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card"
              >
                <CardHeader>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <step.icon className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground font-sans">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-2 font-sans">
                    {step.description}
                  </CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-primary text-primary-foreground py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center font-semibold mb-2 font-sans">
            ABU Cooperative Management System
          </p>
          <p className="text-center text-primary-foreground/70 text-sm font-sans">
            Final Year Project
          </p>
        </div>
      </footer>
    </main>
  );
}
