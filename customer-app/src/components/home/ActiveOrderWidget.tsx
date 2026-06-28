import { useOrderStore, useUIStore } from "@/store";
import type { OrderStatus } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";

import { SPRING } from "@/utils/motion";

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  payment_pending: "Ödəniş gözlənilir",
  new: "Qəbul edildi",
  preparing: "Hazırlanır",
  ready: "Hazırdır!",
  served: "Servis edildi",
  on_the_way: "Yolda",
};

export default function ActiveOrderWidget() {
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const activeOrder =
    currentOrder &&
    !["delivered", "completed", "cancelled"].includes(currentOrder.status)
      ? currentOrder
      : null;

  return (
    <AnimatePresence>
      {activeOrder && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={SPRING}
          className="mx-4 mt-3 overflow-hidden"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("orders")}
            className="w-full flex items-center gap-3 bg-primary/10 border border-primary/25 rounded-2xl px-4 py-3"
          >
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0"
            >
              <Clock size={16} className="text-white" />
            </motion.div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-bold text-primary leading-tight">
                {STATUS_LABELS[activeOrder.status] ?? "Sifarişiniz"}
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                #{activeOrder.id.slice(-5)} • {activeOrder.total.toFixed(2)} AZN
              </p>
            </div>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronRight size={18} className="text-primary" />
            </motion.div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
