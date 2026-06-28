import AppHeaderRow from "@/components/AppHeaderRow";
import CategoryBottomSheet from "@/components/CategoryBottomSheet";
import MenuNavigation from "@/components/search/MenuNavigation";
import MenuSections from "@/components/search/MenuSections";
import SearchResultsGrid from "@/components/search/SearchResultsGrid";
import SearchTopBar from "@/components/search/SearchTopBar";
import type { ProductSection } from "@/components/search/constants";
import { MENU_GROUPS, MENU_SUBS, menuProducts } from "@/data/menuData";
import { useCartStore, useUIStore } from "@/store";
import type { MenuItem } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

export default function SearchScreen() {
  const {
    openProductModal,
    addToast,
    menuInitialGroup,
    setMenuInitialGroup,
    searchAutoFocus,
  } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);

  const autoFocusOnMount = useRef(searchAutoFocus);
  const [isSearchMode, setIsSearchMode] = useState(searchAutoFocus);
  const [query, setQuery] = useState("");
  const [activeGroupId, setActiveGroupId] = useState("all");
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [isCatModalOpen, setCatModalOpen] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (menuInitialGroup !== null) {
      setActiveGroupId(menuInitialGroup);
      setActiveSubId(null);
      setMenuInitialGroup(null);
    }
  }, [menuInitialGroup, setMenuInitialGroup]);

  const currentSubs = MENU_SUBS[activeGroupId] ?? null;

  const sections = useMemo((): ProductSection[] => {
    if (activeSubId) {
      const sub = currentSubs?.find((s) => s.id === activeSubId);
      return [
        {
          id: activeSubId,
          label: sub?.label ?? "",
          items: menuProducts.filter((p) => p.subcategoryId === activeSubId),
        },
      ];
    }
    if (activeGroupId === "all") {
      return MENU_GROUPS.filter((g) => g.id !== "all")
        .map((g) => ({
          id: g.id,
          label: g.label,
          icon: g.icon,
          items: menuProducts.filter((p) => p.groupId === g.id),
        }))
        .filter((s) => s.items.length > 0);
    }
    if (currentSubs?.length) {
      return currentSubs
        .map((sub) => ({
          id: sub.id,
          label: sub.label,
          items: menuProducts.filter((p) => p.subcategoryId === sub.id),
        }))
        .filter((s) => s.items.length > 0);
    }
    const group = MENU_GROUPS.find((g) => g.id === activeGroupId);
    return [
      {
        id: activeGroupId,
        label: group?.label ?? "",
        icon: group?.icon,
        items: menuProducts.filter((p) => p.groupId === activeGroupId),
      },
    ];
  }, [activeGroupId, activeSubId, currentSubs]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return menuProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q),
    );
  }, [query]);

  const totalVisible = sections.reduce((s, g) => s + g.items.length, 0);

  const handleGroupChange = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveSubId(null);
  };
  const activateSearch = () => {
    setIsSearchMode(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  const cancelSearch = () => {
    setQuery("");
    setIsSearchMode(false);
    inputRef.current?.blur();
  };
  const quickAdd = (e: React.MouseEvent, p: MenuItem) => {
    e.stopPropagation();
    addItem({
      product: p as any,
      quantity: 1,
      selectedSize: { id: "default", label: "Standart", priceModifier: 0 },
      selectedExtras: [],
      unitPrice: p.price,
    });
    addToast(`${p.name} səbətə əlavə edildi!`, "success");
  };
  const toggleLike = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Həmişə görünən üst hissə */}
      <div
        className={`transition-colors duration-200 ${
          isSearchMode
            ? "bg-white border-b border-border-light"
            : "bg-transparent"
        }`}
      >
        <AppHeaderRow className="pt-4 pb-2" />
        <SearchTopBar
          query={query}
          isSearchMode={isSearchMode}
          autoFocus={autoFocusOnMount.current}
          inputRef={inputRef}
          onQueryChange={setQuery}
          onFocus={activateSearch}
          onCancelSearch={cancelSearch}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {isSearchMode ? (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-y-auto no-scrollbar"
            >
              <SearchResultsGrid
                query={query}
                results={searchResults}
                liked={liked}
                onQueryChange={setQuery}
                onCancelSearch={cancelSearch}
                onGroupChange={handleGroupChange}
                onLike={toggleLike}
                onQuickAdd={quickAdd}
                onOpen={(p) => openProductModal(p as any)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <MenuNavigation
                activeGroupId={activeGroupId}
                currentSubs={currentSubs}
                activeSubId={activeSubId}
                totalVisible={totalVisible}
                onGroupChange={handleGroupChange}
                onSubChange={setActiveSubId}
                onMenuOpen={() => setCatModalOpen(true)}
              />
              <MenuSections
                sections={sections}
                liked={liked}
                onLike={toggleLike}
                onQuickAdd={quickAdd}
                onOpen={(p) => openProductModal(p as any)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CategoryBottomSheet
        isOpen={isCatModalOpen}
        activeGroupId={activeGroupId}
        onClose={() => setCatModalOpen(false)}
        onSelect={(id) => {
          handleGroupChange(id);
          setCatModalOpen(false);
        }}
      />
    </motion.div>
  );
}
