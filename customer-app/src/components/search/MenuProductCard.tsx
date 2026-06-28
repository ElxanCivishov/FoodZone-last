import type { MenuItem } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Heart, Plus, Star, Thermometer } from "lucide-react";
import { useT } from "@/hooks/useT";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

export interface MenuProductCardProps {
  item: MenuItem;
  index: number;
  isLiked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onQuickAdd: (e: React.MouseEvent) => void;
  onOpen: () => void;
}

export default function MenuProductCard({
  item,
  index,
  isLiked,
  onLike,
  onQuickAdd,
  onOpen,
}: MenuProductCardProps) {
  const t = useT();
  const isTea = item.groupId === "teas";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ delay: index * 0.04, ...SPRING }}
      whileTap={{ scale: 0.97 }}
      onClick={onOpen}
      className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden cursor-pointer"
    >
      <div className="relative aspect-[4/3]">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {item.badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-coral text-white text-[10px] font-bold uppercase tracking-wide">
            {item.badge}
          </span>
        )}
        {item.originalPrice && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold">
            -{Math.round((1 - item.price / item.originalPrice) * 100)}%
          </span>
        )}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={onLike}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center"
        >
          <Heart
            size={14}
            className={isLiked ? "text-coral fill-coral" : "text-text-tertiary"}
            strokeWidth={2}
          />
        </motion.button>
      </div>

      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-text-primary truncate">
          {item.name}
        </h3>
        <p className="text-[11px] text-text-secondary truncate mt-0.5">
          {item.desc}
        </p>

        {isTea && item.brewTemp && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="flex items-center gap-0.5 text-[10px] text-text-tertiary">
              <Thermometer size={10} className="text-primary" /> {item.brewTemp}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-text-tertiary">
              <Clock3 size={10} className="text-primary" /> {item.brewTime}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 mt-1.5">
          <Star size={11} className="text-warning fill-warning" />
          <span className="text-[11px] font-medium text-text-secondary">
            {item.rating}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-primary font-outfit text-[15px] font-bold leading-none">
              <span className="text-[10px]">{t.common.currency}</span> {item.price}
            </p>
            {item.originalPrice && (
              <p className="text-text-tertiary text-[11px] line-through leading-none mt-0.5">
                {t.common.currency} {item.originalPrice}
              </p>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={onQuickAdd}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-primary-glow"
          >
            <Plus size={14} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
