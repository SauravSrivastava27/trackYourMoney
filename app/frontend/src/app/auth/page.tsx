
"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");

  // Redirect users who already have a valid session.
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/auth/me`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        if (response.ok && !cancelled) {
          router.replace("/dashboard");
        }
      } catch {
        // Keep the form accessible if the API is unavailable.
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, router]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setPassword("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "signup" && name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "signup" ? "signup" : "signin";

      const payload =
        mode === "signup"
          ? {
              name: name.trim(),
              email: normalizedEmail,
              password,
            }
          : {
              email: normalizedEmail,
              password,
            };

      const response = await fetch(
        `${apiUrl}/api/v1/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            (mode === "signup"
              ? "Unable to create your account."
              : "Invalid email or password.")
        );
      }

      // Verify the session cookie before redirecting.
      const sessionResponse = await fetch(
        `${apiUrl}/api/v1/auth/me`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!sessionResponse.ok) {
        throw new Error(
          "Your session could not be verified. Please sign in again."
        );
      }

      setSuccess(
        mode === "signup"
          ? "Account created successfully!"
          : "Signed in successfully!"
      );

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">
          Checking your session...
        </span>
      </div>
    );
  }

  return (
    <section className="flex flex-1 items-center justify-center py-8 sm:py-10">
      {/* Fixed desktop height for both tabs */}
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl lg:h-[660px] lg:grid-cols-2">

        {/* Left brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:h-full">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/20" />

          <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full border border-white/20" />

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Wallet className="h-6 w-6" />
            </div>

            <h1 className="mt-8 text-4xl font-bold leading-tight">
              Your money,
              <br />
              clearly in focus.
            </h1>

            <p className="mt-5 max-w-sm leading-7 opacity-85">
              Track your spending, plan your budgets,
              and work towards your financial goals
              with FinTrack AI.
            </p>
          </div>

          <div className="relative flex items-center gap-2 text-sm opacity-85">
            <ShieldCheck className="h-5 w-5" />
            Your personal finance companion
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-6 sm:p-8 lg:flex lg:h-full lg:min-h-0 lg:items-center lg:overflow-hidden">
          <div className="mx-auto w-full max-w-md py-4">

            {/* Mobile branding */}
            <div className="mb-6 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-6 w-6" />
              </div>

              <h1 className="mt-4 text-2xl font-bold">
                FinTrack AI
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Your money, clearly in focus.
              </p>
            </div>

            {/* Sign In / Create Account tabs */}
            <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => changeMode("signin")}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  mode === "signin"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => changeMode("signup")}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form heading */}
            <div className="mt-5">
              <h2 className="text-2xl font-bold tracking-tight">
                {mode === "signin"
                  ? "Welcome back"
                  : "Create your account"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to continue managing your finances."
                  : "Get started with a clearer view of your money."}
              </p>
            </div>

            {/* Form fields */}
            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-4"
            >
              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Full name
                  </label>

                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Enter your full name"
                    required
                    minLength={2}
                    disabled={loading}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "signin"
                        ? "current-password"
                        : "new-password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    disabled={loading}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              {success && (
                <p
                  role="status"
                  className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary"
                >
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}

                {loading
                  ? "Please wait..."
                  : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
              </button>
            </form>

            {/* Legal note */}
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
              By continuing, you agree to use FinTrack AI
              responsibly. Finalize your Terms of Service
              and Privacy Policy before public launch.
            </p>

            {/* Switch authentication mode */}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "signin"
                ? "New to FinTrack AI?"
                : "Already have an account?"}{" "}

              <button
                type="button"
                onClick={() =>
                  changeMode(
                    mode === "signin" ? "signup" : "signin"
                  )
                }
                className="font-semibold text-primary hover:underline"
              >
                {mode === "signin"
                  ? "Create an account"
                  : "Sign in"}
              </button>
            </p>

            {/* Back to landing page */}
            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-sm text-muted-foreground transition hover:text-primary"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
