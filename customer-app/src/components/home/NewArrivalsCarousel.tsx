import type { Product } from "@/types";
import { motion } from "framer-motion";
import { useT } from "@/hooks/useT";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

interface NewArrivalsCarouselProps {
  products: Product[];
  onOpen: (product: Product) => void;
}

export default function NewArrivalsCarousel({
  products,
  onOpen,
}: NewArrivalsCarouselProps) {
  const t = useT();

  return (
    <div className="px-4">
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
        {products.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={SPRING}
            whileTap={{ scale: 0.97 }}
            onClick={() => onOpen(p)}
            className="min-w-[180px] max-w-[180px] bg-white rounded-xl border border-border-light shadow-xs overflow-hidden snap-start cursor-pointer"
          >
            <div className="relative aspect-[4/3]">
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              {p.badge && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase">
                  {p.badge}
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-[13px] font-semibold text-text-primary truncate">
                {p.name}
              </h3>
              <p className="text-[11px] text-text-secondary truncate mt-0.5">
                {p.desc}
              </p>
              <p className="text-primary font-outfit text-sm font-bold mt-1.5">
                <span className="text-[10px]">{t.common.currency}</span> {p.price}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
