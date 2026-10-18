"use client";

import { useState, type FormEvent } from "react";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import { useCategories, useCreateCategory } from "../hooks/useCategoryOptions";

export default function CategoriesPage() {
  const query = useCategories();
  const create = useCreateCategory();
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      await create.mutateAsync({ name: name.trim(), type });
      setName("");
      setMessage("Category created successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create category.");
    }
  }

  const categories = query.data ?? [];
  const incomeCategories = categories.filter((item) => item.type === "INCOME");
  const expenseCategories = categories.filter((item) => item.type === "EXPENSE");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 py-8">
      <PageHeader
        eyebrow="Money management"
        title="Categories"
        description="Create categories to organize your income and expenses."
      />

      {message && (
        <Alert variant={create.isError ? "error" : "success"}>{message}</Alert>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Add category</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px_auto] sm:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Category name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={1}
              maxLength={60}
              placeholder="e.g. Groceries"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Type</span>
            <select value={type} onChange={(event) => setType(event.target.value as "INCOME" | "EXPENSE")}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </label>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Saving..." : "Create category"}
          </Button>
        </form>
      </section>

      {query.isPending ? <LoadingState label="Loading categories..." /> : null}
      {query.isError ? <Alert variant="error">{query.error.message}</Alert> : null}

      {!query.isPending && !query.isError && (
        <section className="grid gap-5 md:grid-cols-2">
          {[
            { title: "Expense categories", items: expenseCategories },
            { title: "Income categories", items: incomeCategories },
          ].map((group) => (
            <article key={group.title} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold">{group.title}</h2>
              {group.items.length === 0 ? (
                <EmptyState title="No categories yet" description="Create a category above to organize transactions." />
              ) : (
                <ul className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
                      <span>{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.type === "INCOME" ? "Income" : "Expense"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
