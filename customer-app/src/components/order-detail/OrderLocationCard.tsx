import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { SPRING } from "./constants";
import type { OrderType } from "@/types";

export default function OrderLocationCard({
  orderType,
  deliveryAddress,
  tableNumber,
}: {
  orderType: OrderType;
  deliveryAddress?: string;
  tableNumber?: string | number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, ...SPRING }}
      className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={16} className="text-primary" />
        <p className="font-outfit text-[14px] font-bold text-text-primary">
          {orderType === "delivery" ? "Çatdırılma ünvanı" : "Məkan"}
        </p>
      </div>
      <p className="text-[13px] text-text-secondary">
        {orderType === "delivery" && (deliveryAddress ?? "Ünvan göstərilməyib")}
        {orderType === "dine_in" && `Masa ${tableNumber}`}
        {orderType === "take_away" && "Take Away — özünüz alacaqsınız"}
      </p>
    </motion.div>
  );
}
