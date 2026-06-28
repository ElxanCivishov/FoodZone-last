import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { SPRING, type StatusConfigEntry, type TimelineStep } from "./constants";
import type { OrderStatus, OrderType } from "@/types";
import { useT } from "@/hooks/useT";

interface StatusCardProps {
  status: OrderStatus;
  cfg: StatusConfigEntry;
  orderType: OrderType;
  tableNumber?: string | number;
  estimatedTime?: number;
  steps: TimelineStep[];
  currentStatusIndex: number;
}

export default function StatusCard({
  status,
  cfg,
  orderType,
  tableNumber,
  estimatedTime,
  steps,
  currentStatusIndex,
}: StatusCardProps) {
  const t = useT();
  const StatusIcon = cfg.icon;
  const statusLabels: Record<OrderStatus, string> = {
    payment_pending: t.order.paymentPending,
    new: t.order.trackingSteps.new.title,
    preparing: t.order.trackingSteps.preparing.title,
    ready: t.order.trackingSteps.readyDineIn.title,
    served: t.order.trackingSteps.served.title,
    on_the_way: t.order.trackingSteps.onTheWay.title,
    delivered: t.order.trackingSteps.delivered.title,
    completed: t.order.trackingSteps.completed.title,
    cancelled: t.order.cancelled,
  };
  const getStepText = (stepStatus: OrderStatus) => {
    if (stepStatus === "ready") {
      if (orderType === "delivery") return t.order.trackingSteps.readyDelivery;
      if (orderType === "take_away") return t.order.trackingSteps.readyTakeAway;
      return t.order.trackingSteps.readyDineIn;
    }
    if (stepStatus === "on_the_way") return t.order.trackingSteps.onTheWay;
    return t.order.trackingSteps[stepStatus as keyof typeof t.order.trackingSteps] ?? t.order.trackingSteps.new;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, ...SPRING }}
      className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs p-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}
        >
          <StatusIcon size={18} className={cfg.color} />
        </div>
        <div>
          <p className="text-[16px] font-bold text-text-primary">{statusLabels[status]}</p>
          <p className="text-[12px] text-text-secondary">
            {orderType === "dine_in" && `${t.checkout.table} ${tableNumber}`}
            {orderType === "take_away" && "Take Away"}
            {orderType === "delivery" && t.checkout.orderTypes.delivery.label} • ~{estimatedTime} {t.common.minutes}
          </p>
        </div>
      </div>

      {status !== "cancelled" && status !== "payment_pending" && (
        <div className="relative mt-4">
          <div className="absolute left-[15px] top-8 bottom-8 w-0.5 bg-border-light">
            <motion.div
              initial={{ height: 0 }}
              animate={{
                height: `${(currentStatusIndex / Math.max(steps.length - 1, 1)) * 100}%`,
              }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="w-full bg-success"
            />
          </div>
          <div className="flex flex-col">
            {steps.map((step, i) => {
              const done = i < currentStatusIndex;
              const active = i === currentStatusIndex;
              const pending = i > currentStatusIndex;
              const Icon = step.icon;
              const copy = getStepText(step.status);
              return (
                <motion.div
                  key={step.status}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, ...SPRING }}
                  className="flex gap-4 pb-5 last:pb-0 relative"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-[1] transition-all ${
                      done
                        ? "bg-success text-white"
                        : active
                          ? "bg-primary text-white"
                          : "bg-surface-elevated text-text-tertiary border-2 border-border"
                    }`}
                    style={active ? { animation: "pulseGlow 2s infinite" } : {}}
                  >
                    <Icon size={14} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p
                      className={`text-[13px] font-semibold ${pending ? "text-text-tertiary" : "text-text-primary"}`}
                    >
                      {copy.title}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      {copy.subtitle}
                    </p>
                  </div>
                  {done && (
                    <CheckCircle2
                      size={15}
                      className="text-success self-center shrink-0"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
