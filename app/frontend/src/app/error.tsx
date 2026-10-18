
"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route rendering error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-start justify-center">
      <h1 className="text-2xl font-bold">
        Something went wrong
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        We could not display this page. Try again.
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
      >
        Try again
      </button>
    </main>
  );
}
