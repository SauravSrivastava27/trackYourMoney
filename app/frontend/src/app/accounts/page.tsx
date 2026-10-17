
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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [type, setType] =
    useState<AccountType>("CHECKING");
  const [currency, setCurrency] = useState("INR");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load accounts."
        );
      }

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

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const numericBalance = Number(balance);

    if (!Number.isFinite(numericBalance)) {
      setError("Please enter a valid balance.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/accounts`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            type,
            currency,
            balance: numericBalance,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to create account."
        );
      }

      setAccounts((current) => [
        result.data,
        ...current,
      ]);

      setName("");
      setType("CHECKING");
      setCurrency("INR");
      setBalance("0");
      setSuccess("Account created successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account."
      );
    } finally {
      setSaving(false);
    }
  }

  const totalBalance = accounts.reduce(
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
    <div className="mx-auto w-full py-8 space-y-8">
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
          {formatMoney(totalBalance, "INR")}
        </p>

        <p className="mt-2 text-sm text-emerald-100">
          {accounts.length} account
          {accounts.length === 1 ? "" : "s"}
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold">
          Add an account
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
              value={name}
              onChange={(event) =>
                setName(event.target.value)
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
              value={type}
              onChange={(event) =>
                setType(event.target.value as AccountType)
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
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value)
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
              Opening balance
            </label>

            <input
              id="account-balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(event) =>
                setBalance(event.target.value)
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

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Create account"}
            </button>
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

                  <h3 className="mt-2 text-lg font-semibold">
                    {account.name}
                  </h3>

                  <p className="mt-4 text-2xl font-bold">
                    {formatMoney(
                      Number(account.balance),
                      account.currency
                    )}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
