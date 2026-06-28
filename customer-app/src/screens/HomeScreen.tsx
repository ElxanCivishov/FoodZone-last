import AppHeaderRow from "@/components/AppHeaderRow";
import CategoryBottomSheet from "@/components/CategoryBottomSheet";
import ActiveOrderWidget from "@/components/home/ActiveOrderWidget";
import CategoryBar from "@/components/home/CategoryBar";
import NewArrivalsCarousel from "@/components/home/NewArrivalsCarousel";
import ProductCard from "@/components/home/ProductCard";
import PromoBanner from "@/components/home/PromoBanner";
import SectionHeader from "@/components/home/SectionHeader";
import { newArrivals, popularProducts, setMenus } from "@/data/menuData";
import { useCartStore, useUIStore } from "@/store";
import type { Category, Product } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function HomeScreen() {
  const {
    openProductModal,
    setActiveTab,
    setMenuInitialGroup,
    setScreen,
    setSearchAutoFocus,
  } = useUIStore();
  const addToast = useUIStore((s) => s.addToast);
  const addItem = useCartStore((s) => s.addItem);

  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [scrolled, setScrolled] = useState(false);
  const [catStuck, setCatStuck] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setScrolled(el.scrollTop > 10);
      setCatStuck(el.scrollTop > 220);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const filter = (list: Product[]) =>
    activeCategory === "all"
      ? list
      : list.filter((p) => p.category === activeCategory);

  const quickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(40);
    addItem({
      product,
      quantity: 1,
      selectedSize: { id: "8pc", label: "8 pieces", priceModifier: 0 },
      selectedExtras: [],
      unitPrice: product.price,
    });
    addToast(`${product.name} səbətə əlavə edildi!`, "success");
    setJustAdded((prev) => new Set([...prev, product.id]));
    setTimeout(() => {
      setJustAdded((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 600);
  };

  const toggleLike = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(20);
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const productCardProps = (p: Product, i: number) => ({
    product: p,
    index: i,
    isLiked: liked.has(p.id),
    isJustAdded: justAdded.has(p.id),
    onLike: (e: React.MouseEvent) => toggleLike(e, p.id),
    onQuickAdd: (e: React.MouseEvent) => quickAdd(e, p),
    onOpen: () => openProductModal(p),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 flex flex-col bg-canvas"
    >
      {/* Sticky Header */}
      <div
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-[#1a1a2e]/95 backdrop-blur-xl shadow-sm border-b border-border-light"
            : "bg-transparent"
        }`}
      >
        <AppHeaderRow />
        <div className="px-4 pb-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSearchAutoFocus(true);
              setActiveTab("search");
              setScreen("search");
            }}
            className="w-full flex items-center gap-2.5 h-11 px-4 rounded-full bg-white border border-border-light shadow-xs text-text-tertiary text-[14px]"
          >
            <Search size={16} className="shrink-0" />
            Yemək axtar…
          </motion.button>
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <PromoBanner />
        <ActiveOrderWidget />

        <CategoryBar
          activeCategory={activeCategory}
          catStuck={catStuck}
          onSelect={setActiveCategory}
          onMenuOpen={() => setCatModalOpen(true)}
        />

        {/* Popular */}
        <SectionHeader
          title="Populyar"
          onViewAll={() => {
            setMenuInitialGroup(null);
            setActiveTab("search" as any);
          }}
        />
        <div className="px-4 grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filter(popularProducts).map((p, i) => (
              <ProductCard key={p.id} {...productCardProps(p, i)} />
            ))}
          </AnimatePresence>
        </div>

        {/* New Arrivals */}
        <SectionHeader
          title="Yeni Gələnlər"
          onViewAll={() => {
            setMenuInitialGroup(null);
            setActiveTab("search" as any);
          }}
        />
        <NewArrivalsCarousel
          products={filter(newArrivals)}
          onOpen={openProductModal}
        />

        {/* Set Menus */}
        <div id="sets-section">
          <SectionHeader
            title="Set Menyular"
            onViewAll={() => {
              setMenuInitialGroup("sets");
              setActiveTab("search" as any);
            }}
          />
          <div className="px-4 grid grid-cols-2 gap-3 pb-4">
            {filter(setMenus).map((p, i) => (
              <ProductCard key={p.id} {...productCardProps(p, i)} />
            ))}
          </div>
        </div>
      </div>

      <CategoryBottomSheet
        isOpen={catModalOpen}
        activeGroupId="all"
        onClose={() => setCatModalOpen(false)}
        onSelect={(id) => {
          setMenuInitialGroup(id);
          setActiveTab("search" as any);
          setCatModalOpen(false);
        }}
      />
    </motion.div>
  );
}
