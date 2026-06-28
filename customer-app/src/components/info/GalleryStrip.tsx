import { GALLERY_PREVIEW } from "@/data/restaurantInfo";
import { ChevronRight, Images } from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "@/hooks/useT";

export default function GalleryStrip({ onViewAll }: { onViewAll: () => void }) {
  const t = useT();

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Images size={15} className="text-primary" />
          <p className="font-outfit text-[14px] font-bold text-text-primary">
            {t.info.gallery}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onViewAll}
          className="flex items-center gap-1 text-primary text-[12px] font-semibold"
        >
          {t.info.viewAll}
          <ChevronRight size={13} />
        </motion.button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-4">
        {GALLERY_PREVIEW.map((item, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.92 }}
            onClick={onViewAll}
            className="shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden relative"
            style={{ background: item.grad }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-2xl">
              {item.emoji}
            </span>
          </motion.button>
        ))}

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onViewAll}
          className="shrink-0 w-[72px] h-[72px] rounded-xl bg-surface-elevated border border-border-light flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-primary font-bold text-[15px]">+10</span>
          <span className="text-text-tertiary text-[10px]">{t.common.photo}</span>
        </motion.button>
      </div>
    </div>
  );
}
