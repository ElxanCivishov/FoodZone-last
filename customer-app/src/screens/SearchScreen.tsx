import AppHeaderRow from "@/components/AppHeaderRow";
import CategoryBottomSheet from "@/components/CategoryBottomSheet";
import { MENU_GROUPS, MENU_SUBS, menuProducts } from "@/data/menuData";
import { useCartStore, useUIStore } from "@/store";
import type { MenuItem } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock3,
  Coffee,
  GlassWater,
  Heart,
  LayoutGrid,
  Menu,
  Package,
  Plus,
  Search,
  Star,
  Sunrise,
  Thermometer,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

const GROUP_ICONS: Record<
  string,
  React.FC<{ size?: number; className?: string }>
> = {
  LayoutGrid,
  Package,
  Coffee,
  UtensilsCrossed,
  GlassWater,
  Sunrise,
};

const RECENT_TAGS = [
  "Qəlyan seti",
  "Nanə çayı",
  "Plov",
  "Combo",
  "Alma şirəsi",
];

interface ProductSection {
  id: string;
  label: string;
  icon?: string;
  items: MenuItem[];
}

export default function SearchScreen() {
  const {
    openProductModal,
    addToast,
    menuInitialGroup,
    setMenuInitialGroup,
    searchAutoFocus,
    setSearchAutoFocus,
  } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);

  const autoFocusOnMount = useRef(searchAutoFocus);
  const [isSearchMode, setIsSearchMode] = useState(searchAutoFocus);
  const [query, setQuery] = useState("");
  const [activeGroupId, setActiveGroupId] = useState("all");
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [isCatModalOpen, setCatModalOpen] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (menuInitialGroup !== null) {
      setActiveGroupId(menuInitialGroup);
      setActiveSubId(null);
      setMenuInitialGroup(null);
    }
  }, [menuInitialGroup, setMenuInitialGroup]);

  const currentSubs = MENU_SUBS[activeGroupId] ?? null;

  /* ── Qruplaşdırılmış bölmələr ── */
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

  /* ── Handlers ── */
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
      {/* ── Header + Search bar ── */}
      <div
        className={`transition-colors duration-200 ${isSearchMode ? "bg-white border-b border-border-light" : "bg-transparent"}`}
      >
        <AppHeaderRow className="pt-12 pb-2" />

        {/* ── Search bar ── */}
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
                autoFocus={autoFocusOnMount.current}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsSearchMode(true)}
                className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-tertiary outline-none"
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setQuery("")}
                  >
                    <X size={15} className="text-text-tertiary" />
                  </motion.button>
                )}
              </AnimatePresence>
              {!isSearchMode && (
                <div
                  className="absolute inset-0 cursor-text rounded-full"
                  onClick={activateSearch}
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
                  onClick={cancelSearch}
                  className="text-primary text-[14px] font-semibold shrink-0"
                >
                  Ləğv
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {/* ══ AXTARIŞ REJİMİ ══ */}
          {isSearchMode ? (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-y-auto no-scrollbar"
            >
              {!query.trim() ? (
                <div className="p-4 space-y-5">
                  <div>
                    <p className="font-outfit text-[14px] font-bold text-text-primary mb-3">
                      Son axtarışlar
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {RECENT_TAGS.map((tag) => (
                        <motion.button
                          key={tag}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setQuery(tag)}
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
                      Kateqoriyalar
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {MENU_GROUPS.filter((g) => g.id !== "all").map((g) => {
                        const Icon = GROUP_ICONS[g.icon];
                        return (
                          <motion.button
                            key={g.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              cancelSearch();
                              handleGroupChange(g.id);
                            }}
                            className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-border-light shadow-xs text-left"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                              {Icon && (
                                <Icon size={15} className="text-primary" />
                              )}
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
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <Search
                    size={48}
                    className="text-text-tertiary mb-4"
                    strokeWidth={1.5}
                  />
                  <p className="text-text-primary font-semibold text-[16px]">
                    Nəticə tapılmadı
                  </p>
                  <p className="text-text-secondary text-[13px] mt-1.5">
                    "
                    <span className="font-medium text-text-primary">
                      {query}
                    </span>
                    " üçün nəticə yoxdur
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-[12px] text-text-tertiary mb-3 font-medium">
                    {searchResults.length} nəticə tapıldı
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {searchResults.map((p, i) => (
                      <MenuProductCard
                        key={p.id}
                        item={p}
                        index={i}
                        isLiked={liked.has(p.id)}
                        onLike={(e) => toggleLike(e, p.id)}
                        onQuickAdd={(e) => quickAdd(e, p)}
                        onOpen={() => openProductModal(p as any)}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      height: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
                    }}
                  />
                </div>
              )}
            </motion.div>
          ) : (
            /* ══ MENYU REJİMİ ══ */
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* ── Sticky header: L1 + L2 + say ── */}
              <div className="shrink-0 bg-canvas z-10 border-b border-border-light/60">
                {/* Səviyyə 1 — Burger + Qrup tabları */}
                <div className="px-4 pt-3 pb-1">
                  <div className="flex items-center gap-2">
                    {/* Burger düyməsi */}
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setCatModalOpen(true)}
                      className="w-9 h-9 rounded-full bg-white border border-border-light shadow-xs flex items-center justify-center shrink-0"
                    >
                      <Menu size={16} className="text-text-secondary" />
                    </motion.button>

                    {/* Scrollable tabs */}
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
                            onClick={() => handleGroupChange(group.id)}
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

                {/* Səviyyə 2 — Alt kateqoriyalar */}
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
                                onClick={() =>
                                  setActiveSubId(isActive ? null : sub.id)
                                }
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

                <div className="px-4 pt-1 pb-2">
                  <p className="text-[12px] text-text-tertiary font-medium">
                    {totalVisible} məhsul
                  </p>
                </div>
              </div>

              {/* ── Scroll sahəsi: yalnız məhsullar ── */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Qruplaşdırılmış bölmələr */}
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
                              onLike={(e) => toggleLike(e, p.id)}
                              onQuickAdd={(e) => quickAdd(e, p)}
                              onOpen={() => openProductModal(p as any)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                  {/* BottomNav + safe-area boşluğu */}
                  <div className="h-40" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Kateqoriya Bottom Sheet ── */}
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

/* ── Bölmə Badge başlığı ─────────────────────────────────────────────────── */

function SectionBadge({
  label,
  icon,
  count,
}: {
  label: string;
  icon?: string;
  count: number;
}) {
  const Icon = icon ? GROUP_ICONS[icon] : null;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light">
        {Icon && <Icon size={13} className="text-primary" />}
        <span className="text-[13px] font-bold text-primary">{label}</span>
      </div>
      <span className="text-[12px] text-text-tertiary font-medium">
        {count} məhsul
      </span>
      <div className="flex-1 h-px bg-border-light" />
    </div>
  );
}

/* ── Məhsul Kartı ─────────────────────────────────────────────────────────── */

interface MenuProductCardProps {
  item: MenuItem;
  index: number;
  isLiked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onQuickAdd: (e: React.MouseEvent) => void;
  onOpen: () => void;
}

function MenuProductCard({
  item,
  index,
  isLiked,
  onLike,
  onQuickAdd,
  onOpen,
}: MenuProductCardProps) {
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
              <span className="text-[10px]">AZN</span> {item.price}
            </p>
            {item.originalPrice && (
              <p className="text-text-tertiary text-[11px] line-through leading-none mt-0.5">
                AZN {item.originalPrice}
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
