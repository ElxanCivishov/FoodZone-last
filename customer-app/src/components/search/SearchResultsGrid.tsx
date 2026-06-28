import { MENU_GROUPS } from "@/data/menuData";
import type { MenuItem } from "@/types";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { GROUP_ICONS, RECENT_TAGS } from "./constants";
import MenuProductCard from "./MenuProductCard";
import { useT } from "@/hooks/useT";

interface SearchResultsGridProps {
  query: string;
  results: MenuItem[];
  liked: Set<number>;
  onQueryChange: (q: string) => void;
  onCancelSearch: () => void;
  onGroupChange: (id: string) => void;
  onLike: (e: React.MouseEvent, id: number) => void;
  onQuickAdd: (e: React.MouseEvent, item: MenuItem) => void;
  onOpen: (item: MenuItem) => void;
}

export default function SearchResultsGrid({
  query,
  results,
  liked,
  onQueryChange,
  onCancelSearch,
  onGroupChange,
  onLike,
  onQuickAdd,
  onOpen,
}: SearchResultsGridProps) {
  const t = useT();

  if (!query.trim()) {
    return (
      <div className="p-4 space-y-5">
        <div>
          <p className="font-outfit text-[14px] font-bold text-text-primary mb-3">
            {t.search.recent}
          </p>
          <div className="flex flex-wrap gap-2">
            {RECENT_TAGS.map((tag) => (
              <motion.button
                key={tag}
                whileTap={{ scale: 0.92 }}
                onClick={() => onQueryChange(tag)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-border-light rounded-full text-[13px] text-text-secondary shadow-xs"
              >
                <Search size={12} className="text-text-tertiary" />
                {tag}
              </motion.button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-outfit text-[14px] font-bold text-text-primary mb-3">
            {t.common.categories}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MENU_GROUPS.filter((g) => g.id !== "all").map((g) => {
              const Icon = GROUP_ICONS[g.icon];
              return (
                <motion.button
                  key={g.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onCancelSearch();
                    onGroupChange(g.id);
                  }}
                  className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-border-light shadow-xs text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                    {Icon && <Icon size={15} className="text-primary" />}
                  </div>
                  <span className="text-[14px] font-semibold text-text-primary">
                    {g.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <Search size={48} className="text-text-tertiary mb-4" strokeWidth={1.5} />
        <p className="text-text-primary font-semibold text-[16px]">
          {t.search.noResults}
        </p>
        <p className="text-text-secondary text-[13px] mt-1.5">
          "<span className="font-medium text-text-primary">{query}</span>" {t.search.noResultsFor}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <p className="text-[12px] text-text-tertiary mb-3 font-medium">
        {results.length} {t.search.resultsFound}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {results.map((p, i) => (
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
      </div>
      <div style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }} />
    </div>
  );
}
