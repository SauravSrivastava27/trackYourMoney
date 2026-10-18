
"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<
  Props,
  State
> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(
    error: Error,
    info: React.ErrorInfo
  ) {
    // Connect your error-monitoring service here later.
    console.error(
      "React rendering error:",
      error,
      info.componentStack
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <section
            role="alert"
            className="mx-auto my-8 w-full max-w-xl rounded-2xl border border-border bg-card p-6 text-card-foreground"
          >
            <h2 className="text-xl font-semibold">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected UI error occurred.
              You can try rendering this section again.
            </p>

            <button
              type="button"
              onClick={() =>
                this.setState({ hasError: false })
              }
              className="mt-5 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            >
              Try again
            </button>
          </section>
        )
      );
    }

    return this.props.children;
  }
}
