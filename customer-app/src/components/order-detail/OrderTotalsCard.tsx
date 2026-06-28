import { motion } from "framer-motion";
import { SPRING } from "./constants";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, ...SPRING }}
      className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs p-4 space-y-2"
    >
      <Row label="Aratoplam" value={`${subtotal.toFixed(2)} AZN`} />
      <Row label="Servis haqqı" value={`${serviceFee.toFixed(2)} AZN`} />
      {discount > 0 && (
        <Row
          label="Endirim"
          value={`-${discount.toFixed(2)} AZN`}
          valueClass="text-success"
        />
      )}
      <div className="flex justify-between text-[15px] pt-2 border-t border-border-light">
        <span className="font-bold text-text-primary">Cəmi</span>
        <span className="font-bold text-primary">{total.toFixed(2)} AZN</span>
      </div>
      <div className="flex justify-between text-[12px] pt-1">
        <span className="text-text-secondary">Ödəniş üsulu</span>
        <span
          className={`font-semibold ${paymentStatus === "paid" ? "text-success" : "text-warning"}`}
        >
          {paymentMethod === "card" ? "Kart" : "Nağd"} •{" "}
          {paymentStatus === "paid" ? "Ödənildi" : "Gözlənilir"}
        </span>
      </div>
    </motion.div>
  );
}
