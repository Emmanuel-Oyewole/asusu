import { cn } from "@/lib/utils";

const variantClasses = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function StatusPill({
  label,
  variant,
  icon: Icon,
}: {
  label: string;
  variant: keyof typeof variantClasses;
  icon?: React.ElementType;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {label}
    </span>
  );
}
