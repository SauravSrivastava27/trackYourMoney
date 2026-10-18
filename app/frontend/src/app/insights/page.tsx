"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTransactions } from "../hooks/useTransactions";
import LoadingState from "../components/ui/LoadingState";
import Alert from "../components/ui/Alert";

export default function InsightsPage() {
  const query = useTransactions();
  const transactions = query.data ?? [];
  const insights = useMemo(() => {
    const expenses = transactions.filter((item) => item.type === "EXPENSE");
    const income = transactions.filter((item) => item.type === "INCOME");
    const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);
    const categoryTotals = new Map<string, number>();
    expenses.forEach((item) => {
      const name = item.category?.name ?? "Uncategorized";
      categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + Number(item.amount));
    });
    const largestCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];
    const newest = transactions[0];
    const result = [];

    if (transactions.length === 0) {
      result.push({
        title: "Start with a transaction",
        body: "Record a few income and expense entries to unlock useful summaries.",
        tone: "info",
      });
    } else {
      result.push({
        title: totalIncome >= totalExpense ? "Recorded cash flow is positive" : "Recorded spending exceeds income",
        body: totalIncome >= totalExpense
          ? "Across the transactions currently loaded, recorded income is at least as high as recorded expenses."
          : "Across the transactions currently loaded, recorded expenses exceed recorded income. Review the entries and period before making changes.",
        tone: totalIncome >= totalExpense ? "success" : "warning",
      });
      if (largestCategory) {
        result.push({
          title: "Largest recorded expense category",
          body: `${largestCategory[0]} has the highest combined expense amount in the currently loaded transactions.`,
          tone: "info",
        });
      }
      if (newest) {
        result.push({
          title: "Keep records current",
          body: `Your latest loaded transaction is “${newest.title}”. Regularly recording transactions makes these summaries more useful.`,
          tone: "info",
        });
      }
    }
    return result;
  }, [transactions]);

  return (
    <div className="mx-auto w-full space-y-7 py-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Planning</p>
        <h1 className="mt-2 text-3xl font-bold">Money Insights</h1>
        <p className="mt-2 text-muted-foreground">Simple observations based on your recorded transactions.</p>
      </header>

      <Alert variant="info" title="Advisory only">
        These are rule-based summaries of the latest transactions, not AI-generated financial advice. Check your records and account currencies before making decisions.
      </Alert>

      {query.isPending && <LoadingState label="Reviewing your transactions..." />}
      {query.isError && <Alert variant="error">{query.error.message}</Alert>}
      {!query.isPending && !query.isError && (
        <section className="grid gap-4 md:grid-cols-2">
          {insights.map((item) => (
            <article key={item.title} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.tone === "success" ? "bg-emerald-500/10 text-emerald-600" : item.tone === "warning" ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"}`}>
                {item.tone === "success" ? "Positive" : item.tone === "warning" ? "Review" : "Observation"}
              </span>
              <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/transactions" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Review transactions</Link>
        <Link href="/reports" className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted">Open reports</Link>
      </div>
    </div>
  );
}
