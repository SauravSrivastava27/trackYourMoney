
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccounts } from "../hooks/useAccounts";
import { useTransactions } from "../hooks/useTransactions";
import LoadingState from "../components/ui/LoadingState";
import Alert from "../components/ui/Alert";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type User = {
  id: string;
  name: string | null;
  email: string;
};

function formatMoney(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function DashboardPage() {
  const router = useRouter();
  const accountsQuery = useAccounts();
  const transactionsQuery = useTransactions();

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        let response = await fetch(
          `${API_URL}/api/v1/auth/me`,
          { credentials: "include", cache: "no-store" }
        );

        if (response.status === 401) {
          const refreshResponse = await fetch(
            `${API_URL}/api/v1/auth/refresh`,
            { method: "POST", credentials: "include" }
          );
          if (refreshResponse.ok) {
            response = await fetch(
              `${API_URL}/api/v1/auth/me`,
              { credentials: "include", cache: "no-store" }
            );
          }
        }

        if (response.status === 401) {
          router.replace("/auth");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to verify your session.");
        }

        const data = await response.json();

        if (active) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          setError(
            "Unable to connect to the server. Please try again."
          );
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    setLoadingLogout(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to sign out. Please try again.");
      }

      router.replace("/auth");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoadingLogout(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
        <p role="alert" className="text-center text-muted-foreground">
          {error || "Redirecting to sign in..."}
        </p>

        {error && (
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            Retry
          </button>
        )}
      </main>
    );
  }

  const firstName =
    user.name?.trim().split(/\s+/)[0] || "there";
  const accounts = accountsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const now = new Date();
  const currentMonthTransactions = transactions.filter((item) => {
    const date = new Date(item.occurredAt);
    return date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear() &&
      item.account.currency === "INR";
  });
  const totalBalance = accounts.reduce(
    (sum, account) => sum + (
      account.currency === "INR" ? Number(account.balance) : 0
    ),
    0
  );
  const monthlyIncome = currentMonthTransactions.reduce(
    (sum, item) => sum + (item.type === "INCOME" ? Number(item.amount) : 0),
    0
  );
  const monthlyExpenses = currentMonthTransactions.reduce(
    (sum, item) => sum + (item.type === "EXPENSE" ? Number(item.amount) : 0),
    0
  );
  const summaryCards = [
    { title: "Total Balance", amount: formatMoney(totalBalance), description: "Current INR account balances, including opening balances", icon: "₹" },
    { title: "Monthly Income", amount: formatMoney(monthlyIncome), description: "INR income this month", icon: "↗" },
    { title: "Monthly Expenses", amount: formatMoney(monthlyExpenses), description: "INR expenses this month", icon: "↘" },
    { title: "Monthly Savings", amount: formatMoney(monthlyIncome - monthlyExpenses), description: "This month's income minus expenses", icon: "◈" },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <section className="mt-10 sm:mt-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Financial overview
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {firstName}!
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Keep track of your money, understand your spending,
            and make progress towards your financial goals.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-border bg-muted p-4 text-sm"
          >
            {error}
          </div>
        )}

        {/* Summary cards */}
        <section
          aria-label="Financial summary"
          className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                  {card.icon}
                </span>
              </div>

              <p className="mt-5 text-2xl font-bold tracking-tight">
                {card.amount}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        {/* Main content */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Transactions */}
          <article className="rounded-2xl border border-border bg-card p-5 sm:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Recent Transactions
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your latest income and expenses
                </p>
              </div>

              <span className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                No transactions yet
              </span>
            </div>

            {transactionsQuery.isPending ? (
              <LoadingState label="Loading recent transactions..." />
            ) : transactionsQuery.isError ? (
              <Alert variant="error">{transactionsQuery.error.message}</Alert>
            ) : transactions.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary">+</div>
                <h3 className="mt-4 font-semibold">Start tracking your money</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Add your first income or expense to see it here.
                </p>
                <Link href="/transactions" className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  Add transaction
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center gap-3 border-t border-border pt-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${transaction.type === "INCOME" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                      {transaction.type === "INCOME" ? "↗" : "↘"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{transaction.title}</p>
                      <p className="text-xs text-muted-foreground">{transaction.account.name} · {new Date(transaction.occurredAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <p className={`text-sm font-semibold ${transaction.type === "INCOME" ? "text-emerald-600" : "text-red-600"}`}>
                      {transaction.type === "INCOME" ? "+" : "−"}{formatMoney(Number(transaction.amount), transaction.account.currency)}
                    </p>
                  </div>
                ))}
                <Link href="/transactions" className="inline-flex pt-2 text-sm font-semibold text-primary hover:underline">
                  View all transactions →
                </Link>
              </div>
            )}
          </article>

          {/* Budget */}
          <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
              Budget Overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor your monthly spending limits
            </p>

            <div className="mt-6 rounded-xl bg-muted/50 px-4 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl text-primary">
                ◈
              </div>

              <h3 className="mt-4 font-semibold">
                No budgets created
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your budget summaries will appear here when
                you start setting monthly limits.
              </p>
            </div>
          </article>
        </section>

        {/* Getting started */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">
            Your next steps
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Set up your finances to get the most out of FinTrack AI.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                number: "01",
                title: "Add an account",
                description:
                  "Set up your cash wallet or bank account.",
              },
              {
                number: "02",
                title: "Record transactions",
                description:
                  "Track the money coming in and going out.",
              },
              {
                number: "03",
                title: "Create a budget",
                description:
                  "Set spending limits for your categories.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-xl border border-border p-4"
              >
                <span className="text-sm font-bold text-primary">
                  {item.number}
                </span>

                <h3 className="mt-3 font-semibold">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
