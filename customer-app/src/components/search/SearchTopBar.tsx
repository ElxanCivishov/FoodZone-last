import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";

interface SearchTopBarProps {
  query: string;
  isSearchMode: boolean;
  autoFocus: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onQueryChange: (q: string) => void;
  onFocus: () => void;
  onCancelSearch: () => void;
}

export default function SearchTopBar({
  query,
  isSearchMode,
  autoFocus,
  inputRef,
  onQueryChange,
  onFocus,
  onCancelSearch,
}: SearchTopBarProps) {
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-2">
        <motion.div
          layout
          className={`relative flex-1 flex items-center gap-2.5 h-11 px-4 rounded-full transition-all duration-200 ${
            isSearchMode
              ? "bg-surface-elevated border-2 border-primary ring-2 ring-primary-light"
              : "bg-white border border-border-light shadow-xs"
          }`}
        >
          <Search
            size={16}
            className={
              isSearchMode
                ? "text-primary shrink-0"
                : "text-text-tertiary shrink-0"
            }
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Yemək axtar…"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onFocus}
            className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => onQueryChange("")}
              >
                <X size={15} className="text-text-tertiary" />
              </motion.button>
            )}
          </AnimatePresence>
          {!isSearchMode && (
            <div
              className="absolute inset-0 cursor-text rounded-full"
              onClick={onFocus}
            />
          )}
        </motion.div>

        <AnimatePresence>
          {isSearchMode && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              onClick={onCancelSearch}
              className="text-primary text-[14px] font-semibold shrink-0"
            >
              Ləğv
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
