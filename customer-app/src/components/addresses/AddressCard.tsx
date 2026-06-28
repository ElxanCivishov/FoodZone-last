import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Address, SPRING, TYPE_ICONS } from "./addressTypes";

interface AddressCardProps {
  address: Address;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export default function AddressCard({
  address,
  index,
  isSelected,
  onSelect,
  onDelete,
}: AddressCardProps) {
  const Icon = TYPE_ICONS[address.type];

  return (
    <motion.div
      key={address.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.06, ...SPRING }}
      onClick={onSelect}
      className={`w-full text-left bg-white rounded-2xl border p-4 shadow-xs transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-primary shadow-primary-glow/30"
          : "border-border-light"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isSelected ? "bg-primary" : "bg-surface-elevated"
          }`}
        >
          <Icon
            size={16}
            className={isSelected ? "text-white" : "text-text-secondary"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span
            className={`text-[14px] font-bold ${
              isSelected ? "text-primary" : "text-text-primary"
            }`}
          >
            {address.label}
          </span>
          <p className="text-[13px] text-text-primary mt-0.5 truncate">
            {address.address}
          </p>
          <p className="text-[12px] text-text-secondary mt-0.5">
            {address.detail}
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "border-primary bg-primary"
                : "border-border-light bg-white"
            }`}
          >
            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-7 h-7 rounded-full bg-coral/10 flex items-center justify-center"
          >
            <Trash2 size={13} className="text-coral" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
