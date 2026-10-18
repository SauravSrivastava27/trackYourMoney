type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  tone?: "default" | "positive" | "negative";
};

const toneClasses = {
  default: "text-foreground",
  positive: "text-emerald-600",
  negative: "text-red-600",
};

export default function StatCard({
  title,
  value,
  description,
  tone = "default",
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`mt-2 break-words text-2xl font-bold tabular-nums ${toneClasses[tone]}`}>
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </article>
  );
}
