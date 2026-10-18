"use client";

import { useState, type FormEvent } from "react";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  type CategoryOption,
} from "../hooks/useCategoryOptions";

export default function CategoriesPage() {
  const query = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [editing, setEditing] = useState<CategoryOption | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageIsError(false);

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, name: name.trim() });
        setMessage("Category updated successfully.");
      } else {
        await create.mutateAsync({ name: name.trim(), type });
        setMessage("Category created successfully.");
      }
      setName("");
      setEditing(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save category.");
      setMessageIsError(true);
    }
  }

  function startEditing(category: CategoryOption) {
    setEditing(category);
    setName(category.name);
    setType(category.type);
    setMessage("");
    setMessageIsError(false);
  }

  function cancelEditing() {
    setEditing(null);
    setName("");
    setType("EXPENSE");
    setMessage("");
    setMessageIsError(false);
  }

  const categories = query.data ?? [];
  const incomeCategories = categories.filter((item) => item.type === "INCOME");
  const expenseCategories = categories.filter((item) => item.type === "EXPENSE");
  const saving = create.isPending || update.isPending;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 py-8">
      <PageHeader
        eyebrow="Money management"
        title="Categories"
        description="Create and rename categories to organize your income and expenses."
      />

      {message && (
        <Alert variant={messageIsError ? "error" : "success"}>{message}</Alert>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{editing ? "Edit category" : "Add category"}</h2>
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
            <select
              value={type}
              disabled={Boolean(editing)}
              onChange={(event) => setType(event.target.value as "INCOME" | "EXPENSE")}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm disabled:opacity-60"
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
            {editing && <span className="mt-1 block text-xs text-muted-foreground">Category type stays fixed to preserve transaction reporting.</span>}
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create category"}
            </Button>
            {editing && (
              <Button type="button" variant="secondary" onClick={cancelEditing} disabled={saving}>
                Cancel
              </Button>
            )}
          </div>
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
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="break-words font-medium">{item.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.type === "INCOME" ? "Income" : "Expense"}</p>
                      </div>
                      <Button type="button" variant="secondary" size="sm" onClick={() => startEditing(item)}>
                        Edit
                      </Button>
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
