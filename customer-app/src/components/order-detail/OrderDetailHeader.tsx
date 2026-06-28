import { motion } from "framer-motion";
import { ChevronLeft, ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";
import type { OrderType } from "@/types";
import { useT } from "@/hooks/useT";

export default function OrderDetailHeader({
  orderId,
  createdAt,
  orderType,
  onBack,
}: {
  orderId: string;
  createdAt: string;
  orderType: OrderType;
  onBack: () => void;
}) {
  const t = useT();

  return (
    <div className="bg-white dark:bg-[#1a1a2e] px-4 py-4 border-b border-border-light flex items-center gap-3">
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center"
      >
        <ChevronLeft size={20} className="text-text-primary" />
      </motion.button>
      <div className="flex-1">
        <h1 className="font-outfit text-[20px] font-bold text-text-primary">
          {t.order.orderNo}{orderId.slice(-6)}
        </h1>
        <p className="text-text-secondary text-[13px]">{createdAt}</p>
      </div>
      <div className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center">
        {orderType === "dine_in" && (
          <UtensilsCrossed size={16} className="text-text-secondary" />
        )}
        {orderType === "take_away" && (
          <ShoppingBag size={16} className="text-text-secondary" />
        )}
        {orderType === "delivery" && (
          <Truck size={16} className="text-text-secondary" />
        )}
      </div>
    </div>
  );
}
