import { CartItem } from "@/types";
import { motion } from "framer-motion";
import { SPRING } from "./constants";
import { useT } from "@/hooks/useT";

export default function OrderItemsCard({ items }: { items: CartItem[] }) {
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, ...SPRING }}
      className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border-light">
        <p className="font-outfit text-[15px] font-bold text-text-primary">
          {t.order.items}
        </p>
      </div>
      {items.map((item, i) => (
        <div
          key={`${item.product.id}-${i}`}
          className={`flex items-center gap-3 px-4 py-3 ${
            i < items.length - 1 ? "border-b border-border-light" : ""
          }`}
        >
          <img
            src={item.product.image}
            alt={item.product.name}
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-text-primary truncate">
              {item.product.name}
            </p>
            <p className="text-[12px] text-text-secondary">
              {item.selectedSize.label}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[13px] font-semibold text-text-primary">
              x{item.quantity}
            </p>
            <p className="text-primary font-bold text-[13px]">
              {(item.unitPrice * item.quantity).toFixed(2)} {t.common.currency}
            </p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
