import type { Product } from "@/types";
import { motion } from "framer-motion";
import { Heart, Plus, Star } from "lucide-react";
import { useT } from "@/hooks/useT";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

export interface ProductCardProps {
  product: Product;
  index: number;
  isLiked: boolean;
  isJustAdded: boolean;
  onLike: (e: React.MouseEvent) => void;
  onQuickAdd: (e: React.MouseEvent) => void;
  onOpen: () => void;
}

export default function ProductCard({
  product,
  index,
  isLiked,
  isJustAdded,
  onLike,
  onQuickAdd,
  onOpen,
}: ProductCardProps) {
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.05, ...SPRING }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onOpen}
      className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden cursor-pointer"
    >
      <div className="relative aspect-[4/3]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {product.badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-coral text-white text-[10px] font-bold uppercase tracking-wide">
            {product.badge}
          </span>
        )}
        {product.originalPrice && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
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
          {product.name}
        </h3>
        <p className="text-[11px] text-text-secondary truncate mt-0.5">
          {product.desc}
        </p>
        <div className="flex items-center gap-1 mt-1.5">
          <Star size={11} className="text-warning fill-warning" />
          <span className="text-[11px] font-medium text-text-secondary">
            {product.rating}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-primary font-outfit text-[15px] font-bold leading-none">
              <span className="text-[10px]">{t.common.currency}</span> {product.price}
            </p>
            {product.originalPrice && (
              <p className="text-text-tertiary text-[11px] line-through leading-none mt-0.5">
                {t.common.currency} {product.originalPrice}
              </p>
            )}
          </div>
          <motion.button
            animate={isJustAdded ? { scale: [1, 1.45, 1] } : { scale: 1 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 500 }}
            whileTap={{ scale: 0.8 }}
            onClick={onQuickAdd}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-primary-glow transition-colors duration-200 ${
              isJustAdded ? "bg-green-500" : "bg-primary"
            }`}
          >
            <Plus size={14} strokeWidth={2.5} className="text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
