import { motion } from "framer-motion";
import { SPRING, STATS } from "./constants";

const ICON_GRADIENTS = [
  "linear-gradient(135deg,#00c2e8,#00c2a8)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#a78bfa,#7c3aed)",
];

export default function ProfileStats() {
  return (
    <div className="relative z-20 -mt-[38px] px-4 shrink-0">
      <div className="flex gap-3">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, ...SPRING }}
              className="flex-1 bg-white rounded-2xl shadow-lg border border-border-light flex flex-col items-center py-3.5"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5"
                style={{ background: ICON_GRADIENTS[i] }}
              >
                <Icon size={14} className="text-white" />
              </div>
              <p className="font-outfit text-[20px] font-bold text-text-primary leading-none">
                {s.value}
              </p>
              <p className="text-text-tertiary text-[10px] mt-0.5 font-medium">
                {s.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
