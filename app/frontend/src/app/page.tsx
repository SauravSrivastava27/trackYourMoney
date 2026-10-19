
"use client";


import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  Target,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

const features = [
  {
    icon: ArrowLeftRight,
    title: "Track Every Transaction",
    description:
      "Keep your income and expenses organized in one place. Understand where your money goes.",
  },
  {
    icon: PiggyBank,
    title: "Plan Your Budgets",
    description:
      "Set spending limits, monitor your progress, and make more intentional financial decisions.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Understand Your Money",
    description:
      "Turn your financial activity into clear insights that help you build better money habits.",
  },
  {
    icon: Target,
    title: "Reach Your Goals",
    description:
      "Stay focused on your savings goals and track your progress as you move forward.",
  },
];

const benefits = [
  "One place for your financial activity",
  "Clear income and expense tracking",
  "Budget and savings goal planning",
  "Privacy-conscious account access",
];

export default function HomePage() {
  const user = null;
  const checkingSession = false;

  const displayName =
    user?.name?.trim() ||
    user?.fullName?.trim() ||
    "there";

  return (
    <div className="w-full space-y-20 pb-12 pt-8 sm:space-y-28 sm:pt-14">

      {/* Hero */}
      <section className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Your personal finance companion
          </div>

          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.12]">
            Take control of your money.
            <span className="mt-2 block text-primary">
              One smart step at a time.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Track your spending, plan your budgets, and
            work towards your financial goals with
            FinTrack AI. Your money, clearly in focus.
          </p>

          {/* Auth-based hero buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {checkingSession ? (
              <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-muted px-6 py-3.5 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Checking session...
              </div>
            ) : user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {!checkingSession && (
              <Link
                href={user ? "/dashboard" : "/auth"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-semibold text-foreground transition hover:bg-muted"
              >
                {user ? "View Dashboard" : "Sign In / Sign Up"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Personal finance management
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Simple and organized
            </span>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-primary/5 blur-2xl" />

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Your overview
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  Financial snapshot
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-xl bg-primary p-5 text-primary-foreground">
                <p className="text-sm opacity-80">
                  Total balance
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  ₹ 00,000.00
                </p>
                <p className="mt-3 text-xs opacity-75">
                  Your accounts, all in one view
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                    Income
                  </div>
                  <p className="mt-3 text-lg font-bold">
                    ₹ 00,000
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This month
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                      <ArrowLeftRight className="h-4 w-4" />
                    </span>
                    Expenses
                  </div>
                  <p className="mt-3 text-lg font-bold">
                    ₹ 00,000
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This month
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      Your next financial goal
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Start planning your savings
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Illustrative preview · Not live account data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Everything in one place
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Make your money easier to manage
          </h2>

          <p className="mt-4 leading-7 text-muted-foreground">
            Get a clearer picture of your finances with
            tools designed to make everyday money
            management simpler.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="grid items-center gap-10 rounded-3xl border border-border bg-card p-6 sm:p-10 lg:grid-cols-2 lg:p-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Built around your goals
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Better visibility.
            <span className="block">Better decisions.</span>
          </h2>

          <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
            Build a clearer picture of your financial
            habits and make progress at your own pace.
            Start with the basics and grow from there.
          </p>
        </div>

        <ul className="space-y-4">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm leading-6 sm:text-base">
                {benefit}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Auth-based Final CTA */}
      <section className="rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Wallet className="h-6 w-6" />
          </div>

          {checkingSession ? (
            <>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Your money, clearly in focus.
              </h2>

              <div className="mt-7 flex justify-center">
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </div>
            </>
          ) : user ? (
            <>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back, {displayName}!
              </h2>

              <p className="mt-4 leading-7 opacity-85">
                Keep track of your money, understand your
                spending, and make progress towards your
                financial goals.
              </p>

              <Link
                href="/dashboard"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-emerald-800 transition hover:bg-white/90"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Your financial journey starts here.
              </h2>

              <p className="mt-4 leading-7 opacity-85">
                Create your account and take the first step
                towards more organized money management.
              </p>

              <Link
                href="/auth"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-emerald-800 transition hover:bg-white/90"
              >
                Create Your Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
