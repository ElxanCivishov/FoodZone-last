import { MENU_GROUPS } from "@/data/menuData";
import type { MenuSub } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { GROUP_ICONS } from "./constants";

import { SPRING } from "@/utils/motion";
import { useT } from "@/hooks/useT";

interface MenuNavigationProps {
  activeGroupId: string;
  currentSubs: MenuSub[] | null | undefined;
  activeSubId: string | null;
  totalVisible: number;
  onGroupChange: (id: string) => void;
  onSubChange: (id: string | null) => void;
  onMenuOpen: () => void;
}

export default function MenuNavigation({
  activeGroupId,
  currentSubs,
  activeSubId,
  totalVisible,
  onGroupChange,
  onSubChange,
  onMenuOpen,
}: MenuNavigationProps) {
  const t = useT();

  return (
    <div className="shrink-0 bg-canvas z-10 border-b border-primary">
      {/* Level 1 — Burger + Group tabs */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onMenuOpen}
            className="w-9 h-9 rounded-full bg-white border border-border-light shadow-xs flex items-center justify-center shrink-0"
          >
            <Menu size={16} className="text-text-secondary" />
          </motion.button>

          <div className="flex-1 min-w-0 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {MENU_GROUPS.map((group, i) => {
              const Icon = GROUP_ICONS[group.icon];
              const isActive = activeGroupId === group.id;
              return (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, ...SPRING }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onGroupChange(group.id)}
                  className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-semibold shrink-0 transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white shadow-primary-glow"
                      : "bg-white text-text-secondary border border-border-light"
                  }`}
                >
                  {Icon && <Icon size={13} />}
                  {group.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Level 2 — Subcategory pills */}
      <AnimatePresence>
        {currentSubs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-1 pb-2">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {currentSubs.map((sub) => {
                  const isActive = activeSubId === sub.id;
                  return (
                    <motion.button
                      key={sub.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => onSubChange(isActive ? null : sub.id)}
                      className={`px-3.5 h-8 rounded-full text-[12px] font-semibold shrink-0 transition-all duration-200 border ${
                        isActive
                          ? "bg-text-primary text-white border-text-primary"
                          : "bg-surface-elevated text-text-secondary border-border-light"
                      }`}
                    >
                      {sub.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product count */}
      <div className="px-4 pt-1 pb-2">
        <p className="text-[12px] text-text-tertiary font-medium">
          {totalVisible} {t.common.item}
        </p>
      </div>
    </div>
  );
}
