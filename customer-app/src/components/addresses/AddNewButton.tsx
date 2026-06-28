import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useT } from "@/hooks/useT";

interface AddNewButtonProps {
  onClick: () => void;
}

export default function AddNewButton({ onClick }: AddNewButtonProps) {
  const t = useT();

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-dashed border-primary/40 shadow-xs"
    >
      <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
        <Plus size={18} className="text-primary" />
      </div>
      <div className="text-left">
        <p className="text-[14px] font-semibold text-primary">
          {t.address.addNew}
        </p>
        <p className="text-[12px] text-text-secondary mt-0.5">
          {t.address.enterDetails}
        </p>
      </div>
    </motion.button>
  );
}
