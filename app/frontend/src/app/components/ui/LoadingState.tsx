type LoadingStateProps = {
  label?: string;
  className?: string;
};

export default function LoadingState({
  label = "Loading...",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={["flex items-center justify-center gap-3 py-8 text-sm text-muted-foreground", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent"
      />
      <span>{label}</span>
    </div>
  );
}
