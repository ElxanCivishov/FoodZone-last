import { motion } from "framer-motion";
import { SPRING } from "./constants";
import { useT } from "@/hooks/useT";

interface OrderTotalsCardProps {
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

function Row({
  label,
  value,
  valueClass = "text-text-primary",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function OrderTotalsCard({
  subtotal,
  serviceFee,
  discount,
  total,
  paymentMethod,
  paymentStatus,
}: OrderTotalsCardProps) {
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, ...SPRING }}
      className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs p-4 space-y-2"
    >
      <Row label={t.cart.subtotal} value={`${subtotal.toFixed(2)} ${t.common.currency}`} />
      <Row label={t.cart.serviceFee} value={`${serviceFee.toFixed(2)} ${t.common.currency}`} />
      {discount > 0 && (
        <Row
          label={t.checkout.discount}
          value={`-${discount.toFixed(2)} ${t.common.currency}`}
          valueClass="text-success"
        />
      )}
      <div className="flex justify-between text-[15px] pt-2 border-t border-border-light">
        <span className="font-bold text-text-primary">{t.cart.total}</span>
        <span className="font-bold text-primary">{total.toFixed(2)} {t.common.currency}</span>
      </div>
      <div className="flex justify-between text-[12px] pt-1">
        <span className="text-text-secondary">{t.checkout.paymentMethod}</span>
        <span
          className={`font-semibold ${paymentStatus === "paid" ? "text-success" : "text-warning"}`}
        >
          {paymentMethod === "card" ? t.checkout.card : t.checkout.cash} •{" "}
          {paymentStatus === "paid" ? t.order.paid : t.order.pending}
        </span>
      </div>
    </motion.div>
  );
}
