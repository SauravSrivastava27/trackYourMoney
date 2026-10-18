import type { HTMLAttributes, ReactNode } from "react";

type AlertVariant = "error" | "success" | "warning" | "info";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
};

const variantClasses: Record<AlertVariant, string> = {
  error: "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  warning: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  info: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
};

export default function Alert({
  variant = "info",
  title,
  children,
  className = "",
  ...props
}: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={[
        "rounded-xl border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
