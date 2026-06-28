import { motion } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Truck,
  CreditCard,
  UtensilsCrossed,
  ShoppingBag,
  Banknote,
} from "lucide-react";
import { useUIStore, useOrderStore } from "@/store";
import type { Order, OrderStatus, OrderType } from "@/types";
import { useT } from "@/hooks/useT";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: typeof Package }
> = {
  payment_pending: {
    label: "Ödəniş gözlənilir",
    color: "text-warning bg-warning/10",
    icon: CreditCard,
  },
  new: { label: "Qəbul edildi", color: "text-info bg-info/10", icon: Package },
  preparing: {
    label: "Hazırlanır",
    color: "text-warning bg-warning/10",
    icon: Clock,
  },
  ready: {
    label: "Hazırdır",
    color: "text-success bg-success/10",
    icon: CheckCircle2,
  },
  served: {
    label: "Təqdim edildi",
    color: "text-success bg-success/10",
    icon: CheckCircle2,
  },
  on_the_way: {
    label: "Yoldadır",
    color: "text-primary bg-primary/10",
    icon: Truck,
  },
  delivered: {
    label: "Çatdırıldı",
    color: "text-success bg-success/10",
    icon: CheckCircle2,
  },
  completed: {
    label: "Tamamlandı",
    color: "text-success bg-success/10",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Ləğv edildi",
    color: "text-coral bg-coral/10",
    icon: XCircle,
  },
};

const TYPE_ICON: Record<OrderType, typeof UtensilsCrossed> = {
  dine_in: UtensilsCrossed,
  take_away: ShoppingBag,
  delivery: Truck,
};
const TYPE_LABEL: Record<OrderType, string> = {
  dine_in: "Masa",
  take_away: "Take Away",
  delivery: "Çatdırılma",
};

export default function OrderHistory() {
  const t = useT();
  const { setScreen } = useUIStore();
  const orders = useOrderStore((s) => s.orders);
  const setCurrentOrderFn = useOrderStore((s) => s.setCurrentOrder);

  /* payment_pending sifarişlər siyahıda göstərilmir */
  const visibleOrders = orders.filter((o) => o.status !== "payment_pending");

  const viewOrder = (order: Order) => {
    setCurrentOrderFn(order);
    setScreen("orderDetail");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      <div className="bg-white dark:bg-[#1a1a2e] px-4 py-4 border-b border-border-light">
        <h1 className="font-outfit text-[20px] font-bold text-text-primary">
          {t.order.myOrders}
        </h1>
        <p className="text-text-secondary text-[13px] mt-0.5">
          {visibleOrders.length} {t.profile.orders}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {visibleOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mb-4">
              <Package size={36} className="text-primary" />
            </div>
            <p className="font-outfit text-[17px] font-bold text-text-primary">
              {t.order.noOrders}
            </p>
            <p className="text-text-secondary text-[13px] mt-1 text-center">
              {t.order.firstOrder}
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                (useUIStore.getState() as any).setActiveTab("home")
              }
              className="mt-5 px-6 py-3 rounded-xl text-[14px] font-semibold text-white shadow-primary-glow"
              style={{
                background: "linear-gradient(135deg, #00c2e8, #00c2a8)",
              }}
            >
              {t.order.viewMenu}
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleOrders.map((order, i) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.new;
              const Icon = cfg.icon;
              const otype = (order.orderType ?? "dine_in") as OrderType;
              const TypeIcon = TYPE_ICON[otype] ?? UtensilsCrossed;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, ...SPRING }}
                  className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-4 shadow-xs border border-border-light"
                >
                  {/* Top row: id + status badge */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-outfit text-[15px] font-bold text-text-primary">
                        {t.order.orderNo}
                        {order.id.slice(-6)}
                      </p>
                      <p className="text-[12px] text-text-secondary mt-0.5">
                        {order.createdAt}
                      </p>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.color}`}
                    >
                      <Icon size={12} />
                      {order.status === "payment_pending"
                        ? t.order.statuses.paymentPending
                        : order.status === "new"
                          ? t.order.statuses.new
                          : order.status === "preparing"
                            ? t.order.statuses.preparing
                            : order.status === "ready"
                              ? t.order.statuses.ready
                              : order.status === "served"
                                ? t.order.statuses.served
                                : order.status === "on_the_way"
                                  ? t.order.statuses.onTheWay
                                  : order.status === "cancelled"
                                    ? t.order.cancelled
                                    : order.status === "completed"
                                      ? t.waiter.statuses.resolved
                                      : cfg.label}
                    </span>
                  </div>

                  {/* Type + payment badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-elevated text-[11px] font-semibold text-text-secondary">
                      <TypeIcon size={11} />
                      {otype === "dine_in"
                        ? t.checkout.table
                        : otype === "delivery"
                          ? t.checkout.orderTypes.delivery.label
                          : "Take Away"}
                    </span>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        order.paymentStatus === "paid"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {order.paymentMethod === "card" ? (
                        <CreditCard size={11} />
                      ) : (
                        <Banknote size={11} />
                      )}
                      {order.paymentMethod === "card"
                        ? t.checkout.card
                        : t.checkout.cash}{" "}
                      ·{" "}
                      {order.paymentStatus === "paid"
                        ? t.order.paid
                        : t.order.pending}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="space-y-1 mb-3">
                    {order.items.slice(0, 2).map((item, j) => (
                      <div key={j} className="flex justify-between text-[12px]">
                        <span className="text-text-secondary truncate flex-1 pr-2">
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="text-text-primary font-medium shrink-0">
                          {(item.unitPrice * item.quantity).toFixed(2)}{" "}
                          {t.common.currency}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[11px] text-text-tertiary">
                        +{order.items.length - 2} {t.order.moreItems}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border-light">
                    <span className="font-outfit text-[15px] font-bold text-primary">
                      {order.total.toFixed(2)} {t.common.currency}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => viewOrder(order)}
                      className="flex items-center gap-1 text-[12px] font-semibold text-primary"
                    >
                      {t.order.viewDetails} <ChevronRight size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
