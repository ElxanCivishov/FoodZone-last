import { useOrderStore, useUIStore } from "@/store";
import type { OrderStatus, OrderType } from "@/types";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Flame,
  Package,
  Star,
  Truck,
  Utensils,
} from "lucide-react";
import { useT } from "@/hooks/useT";

interface TimelineStep {
  status: OrderStatus;
  icon: typeof CheckCircle2;
}

const STEPS_BY_TYPE: Record<OrderType, TimelineStep[]> = {
  dine_in: [
    { status: "new", icon: CheckCircle2 },
    { status: "preparing", icon: Flame },
    { status: "ready", icon: Package },
    { status: "served", icon: Utensils },
    { status: "completed", icon: Star },
  ],
  take_away: [
    { status: "new", icon: CheckCircle2 },
    { status: "preparing", icon: Flame },
    { status: "ready", icon: Package },
    { status: "completed", icon: Star },
  ],
  delivery: [
    { status: "new", icon: CheckCircle2 },
    { status: "preparing", icon: Flame },
    { status: "ready", icon: Package },
    { status: "on_the_way", icon: Truck },
    { status: "delivered", icon: CheckCircle2 },
  ],
};

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

export default function OrderTracking() {
  const { goBack, openModal } = useUIStore();
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const t = useT();

  const orderType = (currentOrder?.orderType ?? "dine_in") as OrderType;
  const STEPS = STEPS_BY_TYPE[orderType] ?? STEPS_BY_TYPE.dine_in;

  const currentStatusIndex = currentOrder
    ? Math.max(
        0,
        STEPS.findIndex((s) => s.status === currentOrder.status),
      )
    : 0;

  const progressPercent = ((currentStatusIndex + 1) / STEPS.length) * 100;
  const estimatedTime = currentOrder?.estimatedTime ?? 12;
  const orderId = currentOrder?.id ?? "#1001";
  const stepText = t.order.trackingSteps;

  const getStepText = (status: OrderStatus) => {
    if (status === "ready") {
      if (orderType === "delivery") return stepText.readyDelivery;
      if (orderType === "take_away") return stepText.readyTakeAway;
      return stepText.readyDineIn;
    }
    if (status === "on_the_way") return stepText.onTheWay;
    return stepText[status as keyof typeof stepText] ?? stepText.new;
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-border-light">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <h2 className="font-outfit text-[17px] font-bold text-text-primary">
          {t.order.trackingTitle} {orderId}
        </h2>
        <div className="w-10" />
      </div>

      {/* Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 mb-16">
        {/* ETA Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...SPRING }}
          className="bg-white rounded-2xl p-6 shadow-xs border border-border-light"
        >
          {/* Time */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{
                background: "linear-gradient(135deg, #00c2e8, #00c2a8)",
              }}
            >
              <Clock size={28} className="text-white" />
            </div>
            <p className="text-[13px] text-text-secondary font-medium">
              {t.order.preparationTime}
            </p>
            <p className="font-outfit text-[34px] font-bold text-text-primary mt-1 leading-none">
              {estimatedTime}{" "}
              <span className="text-lg font-semibold text-text-secondary">
                {t.common.minutes}
              </span>
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
              className="h-full rounded-full progress-shimmer"
              style={{ background: "linear-gradient(90deg, #00c2e8, #00c2a8)" }}
            />
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-8 bottom-8 w-0.5 bg-border-light">
              <motion.div
                initial={{ height: 0 }}
                animate={{
                  height: `${(currentStatusIndex / (STEPS.length - 1)) * 100}%`,
                }}
                transition={{ duration: 1.2, delay: 0.6 }}
                className="w-full bg-success"
              />
            </div>

            <div className="flex flex-col">
              {STEPS.map((step, i) => {
                const done = i <= currentStatusIndex;
                const active = i === currentStatusIndex;
                const pending = i > currentStatusIndex;
                const Icon = step.icon;
                const copy = getStepText(step.status);

                return (
                  <motion.div
                    key={step.status}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, ...SPRING }}
                    className="flex gap-4 pb-6 last:pb-0 relative"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-[1] transition-all ${
                        done && !active
                          ? "bg-success text-white"
                          : active
                            ? "bg-primary text-white"
                            : "bg-surface-elevated text-text-tertiary border-2 border-border"
                      }`}
                      style={
                        active ? { animation: "pulseGlow 2s infinite" } : {}
                      }
                    >
                      <Icon size={14} strokeWidth={2.5} />
                    </div>

                    <div className="flex-1 pt-0.5">
                      <p
                        className={`text-sm font-semibold ${pending ? "text-text-tertiary" : "text-text-primary"}`}
                      >
                        {copy.title}
                      </p>
                      <p className="text-[12px] text-text-tertiary mt-0.5">
                        {copy.subtitle}
                      </p>
                    </div>

                    {done && !active && (
                      <CheckCircle2
                        size={16}
                        className="text-success self-center shrink-0"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Order Items */}
        {currentOrder && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ...SPRING }}
            className="bg-white rounded-2xl p-5 shadow-xs border border-border-light"
          >
            <h3 className="font-outfit text-[15px] font-bold text-text-primary mb-4">
              {t.order.details}
            </h3>
            {currentOrder.items.map((item, i) => (
              <div
                key={`${item.product.id}-${i}`}
                className="flex gap-3 py-3 border-b border-border-light last:border-0"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {item.product.name}
                  </p>
                  <p className="text-[12px] text-text-secondary mt-0.5">
                    {item.quantity} × {item.unitPrice.toFixed(2)}{" "}
                    {t.common.currency}
                  </p>
                </div>
                <span className="text-sm font-bold text-text-primary self-center">
                  {(item.unitPrice * item.quantity).toFixed(2)}{" "}
                  {t.common.currency}
                </span>
              </div>
            ))}

            <div className="mt-3 pt-3 border-t border-border-light space-y-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">{t.cart.subtotal}</span>
                <span className="text-text-primary font-medium">
                  {currentOrder.subtotal.toFixed(2)} {t.common.currency}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">{t.cart.serviceFee}</span>
                <span className="text-text-secondary">
                  {currentOrder.serviceFee.toFixed(2)} {t.common.currency}
                </span>
              </div>
              {currentOrder.discount > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-secondary">
                    {t.checkout.discount}
                  </span>
                  <span className="text-success font-medium">
                    -{currentOrder.discount.toFixed(2)} {t.common.currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border-light">
                <span className="font-outfit text-[16px] font-bold text-text-primary">
                  {t.cart.total}
                </span>
                <span className="font-outfit text-[16px] font-bold text-primary">
                  {currentOrder.total.toFixed(2)} {t.common.currency}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Rate button */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, ...SPRING }}
          whileTap={{ scale: 0.97 }}
          onClick={() => openModal("feedback")}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[15px] font-semibold text-white shadow-primary-glow"
          style={{ background: "linear-gradient(135deg, #00c2e8, #00c2a8)" }}
        >
          <Star size={18} className="fill-white text-white" />
          {t.order.rate}
        </motion.button>
      </div>
    </motion.div>
  );
}
