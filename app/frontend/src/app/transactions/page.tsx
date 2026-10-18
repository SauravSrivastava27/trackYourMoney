"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
  type Transaction,
  type TransactionInput,
  type TransactionType,
} from "../hooks/useTransactions";
import { useAccounts } from "../hooks/useAccounts";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";

type FormState = {
  title: string;
  amount: string;
  type: TransactionType;
  occurredAt: string;
  note: string;
  accountId: string;
};

function todayForInput() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const emptyForm: FormState = {
  title: "",
  amount: "",
  type: "EXPENSE",
  occurredAt: todayForInput(),
  note: "",
  accountId: "",
};

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | TransactionType>("ALL");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const filters = useMemo(() => ({
    search,
    ...(typeFilter === "ALL" ? {} : { type: typeFilter }),
  }), [search, typeFilter]);

  const transactionsQuery = useTransactions(filters);
  const accountsQuery = useAccounts();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const transactions = transactionsQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const saving = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  const closeForm = useCallback(() => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setForm({ ...emptyForm, accountId: accounts[0]?.id ?? "" });
    setFormError("");
  }, [saving, accounts]);

  function openCreate() {
    setEditing(null);
    setFormError("");
    setSuccess("");
    setForm({ ...emptyForm, accountId: accounts[0]?.id ?? "" });
    setFormOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setEditing(transaction);
    setFormError("");
    setSuccess("");
    setForm({
      title: transaction.title,
      amount: String(transaction.amount),
      type: transaction.type,
      occurredAt: todayForInputFrom(transaction.occurredAt),
      note: transaction.note ?? "",
      accountId: transaction.accountId,
    });
    setFormOpen(true);
  }

  function todayForInputFrom(value: string) {
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    const amount = Number(form.amount);
    if (!form.title.trim()) {
      setFormError("Description is required.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99) {
      setFormError("Enter an amount greater than zero.");
      return;
    }
    if (!form.accountId) {
      setFormError("Create or select an account first.");
      return;
    }

    const input: TransactionInput = {
      title: form.title.trim(),
      amount,
      type: form.type,
      occurredAt: new Date(`${form.occurredAt}T12:00:00`).toISOString(),
      note: form.note.trim() || null,
      accountId: form.accountId,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...input });
        setSuccess("Transaction updated.");
      } else {
        await createMutation.mutateAsync(input);
        setSuccess("Transaction added.");
      }
      setFormOpen(false);
      setEditing(null);
      setForm({ ...emptyForm, accountId: accounts[0]?.id ?? "" });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save transaction.");
    }
  }

  async function handleDelete() {
    if (!selectedForDelete || deleting) return;
    try {
      await deleteMutation.mutateAsync(selectedForDelete.id);
      setSelectedForDelete(null);
      setSuccess("Transaction deleted.");
      deleteMutation.reset();
    } catch {
      // Mutation error is shown in the confirmation dialog.
    }
  }

  const totalIncome = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="mx-auto w-full space-y-7 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Money management
          </p>
          <h1 className="mt-2 text-3xl font-bold">Transactions</h1>
          <p className="mt-2 text-muted-foreground">
            Record and review income and expenses across your accounts.
          </p>
        </div>
        <Button onClick={openCreate} disabled={accountsQuery.isPending || accounts.length === 0}>
          + Add transaction
        </Button>
      </header>

      {success && <Alert variant="success">{success}</Alert>}
      {accountsQuery.isError && <Alert variant="error">{accountsQuery.error.message}</Alert>}
      {!accountsQuery.isPending && accounts.length === 0 && (
        <Alert variant="warning" title="Add an account first">
          Transactions must belong to one of your accounts. Go to Accounts and create one before recording a transaction.
        </Alert>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Income in current results</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatMoney(totalIncome, "INR")}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Expenses in current results</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatMoney(totalExpense, "INR")}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Search transactions</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by description..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Transaction type</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "ALL" | TransactionType)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <option value="ALL">All transactions</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expenses</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        {transactionsQuery.isPending ? (
          <LoadingState label="Loading transactions..." />
        ) : transactionsQuery.isError ? (
          <Alert variant="error" title="Unable to load transactions">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{transactionsQuery.error.message}</span>
              <Button variant="secondary" onClick={() => void transactionsQuery.refetch()}>Retry</Button>
            </div>
          </Alert>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <h2 className="font-semibold">No transactions found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your first transaction or adjust the search filters.
            </p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <article
              key={transaction.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
            >
              <div className={[
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold",
                transaction.type === "INCOME"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-red-500/10 text-red-600",
              ].join(" ")}>
                {transaction.type === "INCOME" ? "↗" : "↘"}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-semibold">{transaction.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {transaction.account.name} · {formatDate(transaction.occurredAt)}
                  {transaction.category ? ` · ${transaction.category.name}` : ""}
                </p>
                {transaction.note && (
                  <p className="mt-1 break-words text-xs text-muted-foreground">{transaction.note}</p>
                )}
              </div>
              <p className={[
                "text-lg font-bold tabular-nums",
                transaction.type === "INCOME" ? "text-emerald-600" : "text-red-600",
              ].join(" ")}>
                {transaction.type === "INCOME" ? "+" : "−"}
                {formatMoney(Number(transaction.amount), transaction.account.currency)}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => openEdit(transaction)}>Edit</Button>
                <Button variant="danger" onClick={() => setSelectedForDelete(transaction)}>Delete</Button>
              </div>
            </article>
          ))
        )}
      </section>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit transaction" : "Add transaction"}
        description="Amounts are stored in the selected account's currency."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Description</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              maxLength={120}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              placeholder="e.g. Groceries, salary"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Amount</span>
              <input
                type="number"
                min="0.01"
                max="999999999999.99"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                placeholder="0.00"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Type</span>
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as TransactionType }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Account</span>
              <select
                value={form.accountId}
                onChange={(event) => setForm((current) => ({ ...current, accountId: event.target.value }))}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Date</span>
              <input
                type="date"
                value={form.occurredAt}
                onChange={(event) => setForm((current) => ({ ...current, occurredAt: event.target.value }))}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Note (optional)</span>
            <textarea
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              maxLength={1000}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              placeholder="Add a note..."
            />
          </label>
          {formError && <Alert variant="error">{formError}</Alert>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeForm} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Add transaction"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedForDelete)}
        onClose={() => !deleting && setSelectedForDelete(null)}
        title="Delete transaction?"
        description={selectedForDelete ? `This will permanently delete “${selectedForDelete.title}”.` : undefined}
        size="sm"
      >
        {deleteMutation.isError && (
          <Alert variant="error" className="mb-4">{deleteMutation.error.message}</Alert>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" disabled={deleting} onClick={() => {
            setSelectedForDelete(null);
            deleteMutation.reset();
          }}>Cancel</Button>
          <Button variant="danger" disabled={deleting} onClick={() => void handleDelete()}>
            {deleting ? "Deleting..." : "Delete transaction"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
