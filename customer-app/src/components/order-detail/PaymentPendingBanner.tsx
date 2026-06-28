import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";

export default function PaymentPendingBanner({
  onPayNow,
}: {
  onPayNow: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
        <CreditCard size={18} className="text-warning" />
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-bold text-warning">Ödəniş gözlənilir</p>
        <p className="text-[12px] text-warning/70">
          Sifarişi təsdiqləmək üçün ödəyin
        </p>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onPayNow}
        className="px-3 py-1.5 rounded-lg bg-warning text-white text-[12px] font-bold shrink-0"
      >
        İndi Ödə
      </motion.button>
    </motion.div>
  );
}
