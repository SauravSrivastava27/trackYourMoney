
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000";

type AccountType =
  | "CASH"
  | "SAVINGS"
  | "CHECKING"
  | "CREDIT_CARD"
  | "INVESTMENT"
  | "OTHER";

type Account = {
  id: string;
  name: string;
  currency: string;
  type: AccountType;
  balance: string | number;
  createdAt: string;
};

type AccountForm = {
  name: string;
  type: AccountType;
  currency: string;
  balance: string;
};

type ApiResult<T> = {
  message?: string;
  data?: T;
  errors?: {
    field: string;
    message: string;
  }[];
};

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

const initialForm: AccountForm = {
  name: "",
  type: "CHECKING",
  currency: "INR",
  balance: "0",
};

async function readResponse<T>(
  response: Response
): Promise<ApiResult<T>> {
  const result =
    (await response.json()) as ApiResult<T>;

  if (!response.ok) {
    const details = result.errors
      ?.map((item) => item.message)
      .join(" ");

    throw new Error(
      details ||
        result.message ||
        "Something went wrong."
    );
  }

  return result;
}

export default function AccountsPage() {
  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [form, setForm] =
    useState<AccountForm>(initialForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/accounts`,
        { credentials: "include" }
      );

      const result =
        await readResponse<Account[]>(response);

      setAccounts(result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load accounts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  function updateForm<K extends keyof AccountForm>(
    field: K,
    value: AccountForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({ ...initialForm });
    setEditingId(null);
  }

  function startEditing(account: Account) {
    setForm({
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: String(account.balance),
    });

    setEditingId(account.id);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const numericBalance = Number(form.balance);

    if (!name) {
      setError("Account name is required.");
      return;
    }

    if (
      form.balance.trim() === "" ||
      !Number.isFinite(numericBalance) ||
      Math.abs(numericBalance) > 999999999999.99
    ) {
      setError("Please enter a valid balance.");
      return;
    }

    setSaving(true);

    try {
      const isEditing = editingId !== null;

      const url = isEditing
        ? `${API_URL}/api/v1/accounts/${editingId}`
        : `${API_URL}/api/v1/accounts`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type: form.type,
          currency: form.currency,
          balance: numericBalance,
        }),
      });

      const result =
        await readResponse<Account>(response);

      const savedAccount = result.data;

      if (!savedAccount) {
        throw new Error(
          "Account data was missing from the response."
        );
      }

      if (isEditing) {
        setAccounts((current) =>
          current.map((account) =>
            account.id === savedAccount.id
              ? savedAccount
              : account
          )
        );

        setSuccess("Account updated successfully.");
      } else {
        setAccounts((current) => [
          savedAccount,
          ...current,
        ]);

        setSuccess("Account created successfully.");
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save account."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(account: Account) {
    const confirmed = window.confirm(
      `Delete "${account.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(account.id);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/accounts/${account.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      await readResponse<{ id: string }>(response);

      setAccounts((current) =>
        current.filter(
          (item) => item.id !== account.id
        )
      );

      if (editingId === account.id) {
        resetForm();
      }

      setSuccess("Account deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete account."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalINR = accounts.reduce(
    (total, account) =>
      total +
      (account.currency === "INR"
        ? Number(account.balance)
        : 0),
    0
  );

  const formatMoney = (
    amount: number,
    currencyCode: string
  ) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);

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

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
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
                updateForm("name", event.target.value)
              }
              placeholder="e.g. HDFC Savings"
              maxLength={100}
              required
              className="w-full rounded-lg border p-3"
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
                updateForm(
                  "type",
                  event.target.value as AccountType
                )
              }
              className="w-full rounded-lg border bg-white p-3"
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
                updateForm("currency", event.target.value)
              }
              className="w-full rounded-lg border bg-white p-3"
            >
              <option value="INR">
                INR - Indian Rupee
              </option>
              <option value="USD">
                USD - US Dollar
              </option>
              <option value="EUR">
                EUR - Euro
              </option>
              <option value="GBP">
                GBP - British Pound
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="account-balance"
              className="mb-2 block text-sm font-medium"
            >
              Balance
            </label>

            <input
              id="account-balance"
              type="number"
              step="0.01"
              min="-999999999999.99"
              max="999999999999.99"
              value={form.balance}
              onChange={(event) =>
                updateForm("balance", event.target.value)
              }
              required
              className="w-full rounded-lg border p-3"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm text-red-600 sm:col-span-2"
            >
              {error}
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
              disabled={
                saving || deletingId !== null
              }
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
                className="rounded-lg border px-5 py-3 font-medium hover:bg-gray-50 disabled:opacity-60"
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

        {loading ? (
          <p className="mt-4 text-gray-500">
            Loading accounts...
          </p>
        ) : accounts.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed p-8 text-center">
            <p className="font-medium">
              No accounts yet
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Create your first account above.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const label =
                accountTypes.find(
                  (item) => item.value === account.type
                )?.label ?? account.type;

              return (
                <article
                  key={account.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5"
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

                  <div className="mt-5 flex gap-3 border-t pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        startEditing(account)
                      }
                      disabled={
                        saving || deletingId !== null
                      }
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleDelete(account)
                      }
                      disabled={
                        saving || deletingId !== null
                      }
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === account.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
