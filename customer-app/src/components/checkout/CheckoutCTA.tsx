import type { OrderType, PaymentMethod } from "@/types";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { useT } from "@/hooks/useT";

interface CheckoutCTAProps {
  orderType: OrderType;
  isLoggedIn: boolean;
  hasAddr: boolean;
  effectivePayMethod: PaymentMethod;
  selectedCardId: number;
  showNewCard: boolean;
  loading: boolean;
  total: number;
  itemsEmpty: boolean;
  onOrder: () => void;
}

function WarningBox({ msg }: { msg: string }) {
  return (
    <div className="w-full flex items-center gap-2 p-3.5 bg-warning/10 rounded-xl border border-warning/30">
      <AlertCircle size={15} className="text-warning shrink-0" />
      <p className="text-[13px] text-warning font-medium">{msg}</p>
    </div>
  );
}

export default function CheckoutCTA({
  orderType,
  isLoggedIn,
  hasAddr,
  effectivePayMethod,
  selectedCardId,
  showNewCard,
  loading,
  total,
  itemsEmpty,
  onOrder,
}: CheckoutCTAProps) {
  const t = useT();

  if (orderType === "delivery" && !isLoggedIn)
    return <WarningBox msg={t.checkout.loginForDelivery} />;
  if (orderType === "delivery" && !hasAddr)
    return <WarningBox msg={t.checkout.chooseDeliveryAddress} />;
  if (effectivePayMethod === "card" && !selectedCardId && !showNewCard)
    return <WarningBox msg={t.checkout.chooseCard} />;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onOrder}
      disabled={loading || itemsEmpty || showNewCard}
      className="w-full py-4 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2 shadow-primary-glow disabled:opacity-70"
      style={{ background: "linear-gradient(135deg,#00c2e8,#00c2a8)" }}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : effectivePayMethod === "card" ? (
        <>
          <Lock size={16} /> {t.checkout.pay} — {total.toFixed(2)} {t.common.currency}
        </>
      ) : (
        `${t.checkout.placeOrder} — ${total.toFixed(2)} ${t.common.currency}`
      )}
    </motion.button>
  );
}
