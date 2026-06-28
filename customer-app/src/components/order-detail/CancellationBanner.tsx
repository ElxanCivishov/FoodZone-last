import { motion } from "framer-motion";
import { XCircle } from "lucide-react";

export default function CancellationBanner({ reason }: { reason: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-coral/10 border border-coral/20 rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <XCircle size={15} className="text-coral shrink-0" />
        <p className="text-[14px] font-bold text-coral">Ləğv edildi</p>
      </div>
      <p className="text-[12px] text-coral/70">
        <span className="font-semibold">Səbəb:</span> {reason}
      </p>
    </motion.div>
  );
}
