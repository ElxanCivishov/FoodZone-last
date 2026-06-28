import { categories } from "@/data/menuData";
import type { Category } from "@/types";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

interface CategoryBarProps {
  activeCategory: Category;
  catStuck: boolean;
  onSelect: (cat: Category) => void;
  onMenuOpen: () => void;
}

export default function CategoryBar({
  activeCategory,
  catStuck,
  onSelect,
  onMenuOpen,
}: CategoryBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15, ...SPRING }}
      className={`mt-4 sticky top-0 z-40 px-4 py-2 transition-all duration-200 ${
        catStuck
          ? "bg-white/95 dark:bg-[#1a1a2e]/95 backdrop-blur-xl border-b border-border-light"
          : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onMenuOpen}
          className="w-9 h-9 rounded-full bg-white border border-border-light shadow-xs flex items-center justify-center shrink-0"
        >
          <Menu size={16} className="text-text-secondary" />
        </motion.button>

        <div className="flex-1 min-w-0 flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
          {categories.map((cat, i) => {
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.04, ...SPRING }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onSelect(cat.id)}
                className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-semibold shrink-0 snap-start pill-spring ${
                  isActive
                    ? "bg-primary text-white shadow-primary-glow"
                    : "bg-white text-text-secondary border border-border-light"
                }`}
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
