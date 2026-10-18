"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import LoadingState from "../components/ui/LoadingState";
import Alert from "../components/ui/Alert";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const query = useTransactions();
  const rows = query.data ?? [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const nowTime = now.getTime();

  const filtered = useMemo(() => rows.filter((row) => {
    const date = new Date(row.occurredAt);
    if (row.account.currency !== "INR" || date.getTime() > nowTime) return false;
    if (period === "year") return date.getFullYear() === currentYear;
    if (period === "quarter") {
      return date.getFullYear() === currentYear &&
        Math.floor(date.getMonth() / 3) === Math.floor(currentMonth / 3);
    }
    return date.getFullYear() === now.getFullYear() &&
      date.getMonth() === currentMonth;
  }), [rows, period, currentYear, currentMonth, nowTime]);

  const income = filtered.reduce((sum, row) => sum + (row.type === "INCOME" ? Number(row.amount) : 0), 0);
  const expenses = filtered.reduce((sum, row) => sum + (row.type === "EXPENSE" ? Number(row.amount) : 0), 0);
  const categories = new Map<string, number>();
  filtered.filter((row) => row.type === "EXPENSE").forEach((row) => {
    const name = row.category?.name ?? "Uncategorized";
    categories.set(name, (categories.get(name) ?? 0) + Number(row.amount));
  });
  const categoryRows = [...categories.entries()].sort((a, b) => b[1] - a[1]);
  const maxCategory = categoryRows[0]?.[1] ?? 0;

  return (
    <div className="mx-auto w-full space-y-7 py-8">
      <PageHeader
        eyebrow="Insights"
        title="Reports & Analytics"
        description="Understand income and spending from your recorded transactions."
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Reporting period">
        {([
          ["month", "This month"],
          ["quarter", "This quarter"],
          ["year", "This year"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setPeriod(value)}
            aria-pressed={period === value}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${period === value ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      {query.isPending ? <LoadingState label="Calculating report..." /> : null}
      {query.isError ? <Alert variant="error" title="Report unavailable">{query.error.message}</Alert> : null}

      {!query.isPending && !query.isError && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Income" value={money(income)} tone="positive" />
            <StatCard title="Expenses" value={money(expenses)} tone="negative" />
            <StatCard
              title="Net cash flow"
              value={money(income - expenses)}
              tone={income >= expenses ? "positive" : "negative"}
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Expenses by category</h2>
            <p className="mt-1 text-sm text-muted-foreground">Only INR transactions in the selected period are included. The report is based on the latest 100 transactions returned by the API.</p>
            {categoryRows.length === 0 ? (
              <p className="mt-6 rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                No expenses found for this period. Add categories and transactions to get a breakdown.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                {categoryRows.map(([name, amount]) => (
                  <div key={name}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{name}</span>
                      <span className="tabular-nums text-muted-foreground">{money(amount)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${maxCategory ? (amount / maxCategory) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
