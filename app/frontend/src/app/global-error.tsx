
"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "2rem",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <main>
          <h1>FinTrack encountered an error</h1>

          <p>
            The application could not load correctly.
            Please try again.
          </p>

          <button type="button" onClick={reset}>
            Reload application
          </button>
        </main>
      </body>
    </html>
  );
}
