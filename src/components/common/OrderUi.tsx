import React from "react";
import { OrderStatus } from "@/types";
import { cn } from "@/utils/cn";

export function InfoChip({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone?: string;
}) {
  return (
    <div
      className={cn(
        "w-full h-7 rounded-lg bg-foreground-muted/5 border border-border flex items-center justify-center gap-1 px-1.5 text-xs",
        tone ?? "text-foreground-muted",
      )}
    >
      {icon}
      <span className="truncate font-medium">{label}</span>
    </div>
  );
}

export function StatusBadge({
  status,
  t,
}: {
  status: OrderStatus | string;
  t: (key: string) => string;
}) {
  const styles: Record<string, string> = {
    pending: "bg-orange-500/10 text-orange-500",
    confirmed: "bg-orange-600/10 text-orange-600",
    preparing: "bg-yellow-500/10 text-yellow-600",
    ready: "bg-success-500/10 text-success-500",
    served: "bg-blue-500/10 text-blue-500",
    cancelled: "bg-danger-500/10 text-danger-500",
    accepted: "bg-blue-500/10 text-blue-500",
    done: "bg-success-500/10 text-success-500",
    rejected: "bg-danger-500/10 text-danger-500",
  };
  const key = `order.status.${status}`;
  const label = t(key);
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap",
        styles[status] ?? "bg-foreground-muted/10 text-foreground-muted",
      )}
    >
      {label === key ? status : label}
    </span>
  );
}
