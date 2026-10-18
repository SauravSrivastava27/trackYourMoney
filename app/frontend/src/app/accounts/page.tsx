
"use client";

import {
  useState,
  type FormEvent,
} from "react";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  type Account,
  type AccountInput,
  type AccountType,
} from "../hooks/useAccounts";

const accountTypes: {
  value: AccountType;
  label: string;
}[] = [
  { value: "CHECKING", label: "Bank Account" },
  { value: "SAVINGS", label: "Savings Account" },
  { value: "CASH", label: "Cash" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "OTHER", label: "Other" },
];

const initialForm = {
  name: "",
  type: "CHECKING" as AccountType,
  currency: "INR",
  balance: "0",
};

export default function AccountsPage() {
  const accountsQuery = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] =
    useState<Account | null>(null);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const accounts = accountsQuery.data ?? [];
  const saving =
    createMutation.isPending ||
    updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  const apiError =
    accountsQuery.error ??
    createMutation.error ??
    updateMutation.error ??
    deleteMutation.error;

  const errorMessage =
    formError ||
    (apiError instanceof Error
      ? apiError.message
      : "");

  const totalINR = accounts.reduce(
    (total, account) =>
      total +
      (account.currency === "INR"
        ? Number(account.balance)
        : 0),
    0
  );

  function formatMoney(
    amount: number,
    currency: string
  ) {
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

  function resetForm() {
    setForm({ ...initialForm });
    setEditingId(null);
    setFormError("");
  }

  function startEditing(account: Account) {
    setForm({
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: String(account.balance),
    });

    setEditingId(account.id);
    setFormError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    const name = form.name.trim();
    const balance = Number(form.balance);

    if (!name) {
      setFormError("Account name is required.");
      return;
    }

    if (
      form.balance.trim() === "" ||
      !Number.isFinite(balance) ||
      Math.abs(balance) > 999999999999.99
    ) {
      setFormError("Please enter a valid balance.");
      return;
    }

    const input: AccountInput = {
      name,
      type: form.type,
      currency: form.currency,
      balance,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...input,
        });

        setSuccess("Account updated successfully.");
      } else {
        await createMutation.mutateAsync(input);

        setSuccess("Account created successfully.");
      }

      resetForm();
    } catch {
      // The mutation exposes its error to the UI.
    }
  }

  async function confirmDelete() {
    if (!accountToDelete || deleting) return;

    setFormError("");
    setSuccess("");

    try {
      await deleteMutation.mutateAsync(
        accountToDelete.id
      );

      if (editingId === accountToDelete.id) {
        resetForm();
      }

      setAccountToDelete(null);
      setSuccess("Account deleted successfully.");
    } catch {
      // Keep the modal open so the user can read
      // the deletion error and retry or cancel.
    }
  }

  return (
    <div className="mx-auto w-full space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">
          My Accounts
        </h1>

        <p className="mt-2 text-gray-500">
          Manage your cash, bank accounts and investments.
        </p>
      </div>

      <section className="rounded-2xl bg-emerald-600 p-6 text-white">
        <p className="text-sm text-emerald-100">
          Combined INR balance
        </p>

        <p className="mt-2 text-3xl font-bold">
          {formatMoney(totalINR, "INR")}
        </p>

        <p className="mt-2 text-sm text-emerald-100">
          {accounts.length} account
          {accounts.length === 1 ? "" : "s"}
        </p>

        <p className="mt-1 text-xs text-emerald-100">
          Only INR accounts are included in this total.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit account" : "Add an account"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-5 sm:grid-cols-2"
        >
          <div>
            <label
              htmlFor="account-name"
              className="mb-2 block text-sm font-medium"
            >
              Account name
            </label>

            <input
              id="account-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. HDFC Savings"
              maxLength={100}
              required
              className="w-full rounded-lg border border-gray-300 bg-transparent p-3 dark:border-zinc-600"
            />
          </div>

          <div>
            <label
              htmlFor="account-type"
              className="mb-2 block text-sm font-medium"
            >
              Account type
            </label>

            <select
              id="account-type"
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as AccountType,
                }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-900"
            >
              {accountTypes.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="account-currency"
              className="mb-2 block text-sm font-medium"
            >
              Currency
            </label>

            <select
              id="account-currency"
              value={form.currency}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  currency: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-900"
            >
              <option value="INR">INR - Indian Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="account-balance"
              className="mb-2 block text-sm font-medium"
            >
              {editingId ? "Current balance" : "Opening balance"}
            </label>

            <input
              id="account-balance"
              type="number"
              step="0.01"
              min="-999999999999.99"
              max="999999999999.99"
              value={form.balance}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  balance: event.target.value,
                }))
              }
              required
              className="w-full rounded-lg border border-gray-300 bg-transparent p-3 dark:border-zinc-600"
            />
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {editingId
                ? "This sets the account's current balance directly. Existing transactions are not replayed when you change it."
                : "Enter money already in this account before you start recording transactions. If you are starting from zero and will add your salary as an income transaction, keep this at ₹0."}
            </p>
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="text-sm text-red-600 sm:col-span-2"
            >
              {errorMessage}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="text-sm text-emerald-600 sm:col-span-2"
            >
              {success}
            </p>
          )}

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving || deleting}
              className="rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update account"
                  : "Create account"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border px-5 py-3 font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          Your accounts
        </h2>

        {accountsQuery.isPending ? (
          <LoadingState label="Loading accounts..." className="mt-4" />
        ) : accountsQuery.isError && accounts.length === 0 ? (
          <Alert variant="error" className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{accountsQuery.error.message}</span>
              <Button variant="secondary" onClick={() => void accountsQuery.refetch()}>Retry</Button>
            </div>
          </Alert>
        ) : accounts.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed p-8 text-center">
            <p className="font-medium">No accounts yet</p>
            <p className="mt-2 text-sm text-gray-500">
              Create your first account above.
            </p>
          </div>
        ) : (
          <>
            {accountsQuery.isError && (
              <p
                role="status"
                className="mt-3 text-sm text-amber-600"
              >
                Could not refresh accounts. Showing cached data.
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => {
                const label =
                  accountTypes.find(
                    (item) => item.value === account.type
                  )?.label ?? account.type;

                return (
                  <article
                    key={account.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <p className="text-sm text-gray-500">
                      {label}
                    </p>

                    <h3 className="mt-2 break-words text-lg font-semibold">
                      {account.name}
                    </h3>

                    <p className="mt-4 break-words text-2xl font-bold">
                      {formatMoney(
                        Number(account.balance),
                        account.currency
                      )}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {account.currency}
                    </p>

                    <div className="mt-5 flex gap-3 border-t border-gray-200 pt-4 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => startEditing(account)}
                        disabled={saving || deleting}
                        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-zinc-600 dark:hover:bg-zinc-800"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormError("");
                          setAccountToDelete(account);
                        }}
                        disabled={saving || deleting}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <Modal
        open={Boolean(accountToDelete)}
        onClose={() => {
          if (!deleting) setAccountToDelete(null);
        }}
        title="Delete account?"
        description={accountToDelete
          ? `Are you sure you want to delete “${accountToDelete.name}”? This action cannot be undone.`
          : undefined}
        size="sm"
      >
        {deleteMutation.isError && (
          <Alert variant="error" className="mb-4">
            {deleteMutation.error.message}
          </Alert>
        )}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            disabled={deleting}
            onClick={() => {
              setAccountToDelete(null);
              deleteMutation.reset();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={deleting}
            onClick={() => void confirmDelete()}
          >
            {deleting ? "Deleting..." : "Delete account"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
