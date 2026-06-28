import type { MenuItem } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import type { ProductSection } from "./constants";
import MenuProductCard from "./MenuProductCard";
import SectionBadge from "./SectionBadge";

import { SPRING } from "@/utils/motion";

interface MenuSectionsProps {
  sections: ProductSection[];
  liked: Set<number>;
  onLike: (e: React.MouseEvent, id: number) => void;
  onQuickAdd: (e: React.MouseEvent, item: MenuItem) => void;
  onOpen: (item: MenuItem) => void;
}

export default function MenuSections({
  sections,
  liked,
  onLike,
  onQuickAdd,
  onOpen,
}: MenuSectionsProps) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-4 pt-4 space-y-6">
        {sections.map((section, sIdx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.06, ...SPRING }}
          >
            <SectionBadge
              label={section.label}
              icon={section.icon}
              count={section.items.length}
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <AnimatePresence mode="popLayout">
                {section.items.map((p, i) => (
                  <MenuProductCard
                    key={p.id}
                    item={p}
                    index={i}
                    isLiked={liked.has(p.id)}
                    onLike={(e) => onLike(e, p.id)}
                    onQuickAdd={(e) => onQuickAdd(e, p)}
                    onOpen={() => onOpen(p)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
        <div className="h-40" />
      </div>
    </div>
  );
}
