import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Star,
  Clock,
  ShoppingBag,
  Search,
  Heart,
  Plus,
  ChevronRight,
  Wifi,
  Info,
} from "lucide-react";
import { useUIStore, useCartStore } from "@/store";
import {
  popularProducts,
  newArrivals,
  setMenus,
  categories,
} from "@/data/menuData";
import type { Category, Product } from "@/types";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

const PROMOS = [
  {
    id: 1,
    title: "Xoş gəldiniz!",
    sub: "Bugünün ən yaxşı menyusu",
    grad: "linear-gradient(135deg,#667eea,#764ba2)",
  },
  {
    id: 2,
    title: "Ödənişsiz çatdırılma",
    sub: "25 AZN-dən yuxarı sifarişlərə",
    grad: "linear-gradient(135deg,#00b4d8,#0077b6)",
  },
  {
    id: 3,
    title: "Yeni Setlər",
    sub: "Xüsusi kombinasiyalar hazırdır",
    grad: "linear-gradient(135deg,#f093fb,#f5576c)",
  },
];

const INFO = {
  cuisine: "Yapon Mətbəxi • Sushi • Ramen",
  rating: 4.8,
  reviews: 2340,
  minTime: 15,
  maxTime: 25,
  minOrder: 10,
  deliveryFee: 2,
  address: "İçərişəhər, Bakı",
};

export default function HomeScreen() {
  const { openProductModal, openCartDrawer, openModal, setScreen } =
    useUIStore();
  const addToast = useUIStore((s) => s.addToast);
  const cartItemCount = useCartStore((s) =>
    s.items.reduce((c, i) => c + i.quantity, 0),
  );
  const addItem = useCartStore((s) => s.addItem);

  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [scrolled, setScrolled] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [promoIdx, setPromoIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 10);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setPromoIdx((i) => (i + 1) % PROMOS.length),
      4500,
    );
    return () => clearInterval(t);
  }, []);

  const filter = (list: Product[]) =>
    activeCategory === "all"
      ? list
      : list.filter((p) => p.category === activeCategory);

  const quickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem({
      product,
      quantity: 1,
      selectedSize: { id: "8pc", label: "8 pieces", priceModifier: 0 },
      selectedExtras: [],
      unitPrice: product.price,
    });
    addToast(`${product.name} səbətə əlavə edildi!`, "success");
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
            ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-border-light"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={15} className="text-primary" strokeWidth={2.5} />
            <span className="text-[13px] text-text-secondary font-medium">
              {INFO.address}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => openModal("wifi")}
              className="w-9 h-9 rounded-full bg-white shadow-xs border border-border-light flex items-center justify-center"
            >
              <Wifi size={16} className="text-text-secondary" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={openCartDrawer}
              className="w-9 h-9 rounded-full bg-white shadow-xs border border-border-light flex items-center justify-center relative"
            >
              <ShoppingBag size={16} className="text-text-secondary" />
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setScreen("search")}
            className="w-full flex items-center gap-2.5 h-11 px-4 rounded-full bg-white border border-border-light shadow-xs text-text-tertiary text-[14px]"
          >
            <Search size={16} className="shrink-0" />
            Yemək axtar…
          </motion.button>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar pb-24"
      >
        {/* Hero Banner – cycling promo */}
        <div
          className="mx-4 mt-2 rounded-2xl overflow-hidden relative"
          style={{ height: 200 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={promoIdx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col justify-between p-5"
              style={{ background: PROMOS[promoIdx].grad }}
            >
              <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-[60%] -right-[15%] w-[220px] h-[220px] rounded-full bg-white/10"
              />
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -bottom-[40%] -left-[10%] w-[160px] h-[160px] rounded-full bg-white/8"
              />

              {/* Top: cuisine + rating */}
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-white/75 text-[12px]">{INFO.cuisine}</p>
                  <h1 className="text-white font-outfit text-xl font-bold mt-0.5">
                    {PROMOS[promoIdx].title}
                  </h1>
                  <p className="text-white/80 text-[13px] mt-0.5">
                    {PROMOS[promoIdx].sub}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Star size={12} className="text-yellow-300 fill-yellow-300" />
                  <span className="text-white text-[12px] font-bold">
                    {INFO.rating}
                  </span>
                  <span className="text-white/70 text-[11px]">
                    ({INFO.reviews})
                  </span>
                </div>
              </div>

              {/* Bottom: meta */}
              <div className="relative z-10 flex items-center gap-2 flex-wrap">
                <MetaBadge
                  icon={<Clock size={11} />}
                  text={`${INFO.minTime}-${INFO.maxTime} dəq`}
                />
                <MetaBadge
                  icon={<ShoppingBag size={11} />}
                  text={`min ${INFO.minOrder} AZN`}
                />
                <MetaBadge
                  icon={<Info size={11} />}
                  text={`${INFO.deliveryFee} AZN çatdırılma`}
                />
              </div>
            </motion.div>
          </AnimatePresence>
          {/* Dots */}
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {PROMOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setPromoIdx(i)}
                className={`rounded-full transition-all duration-300 ${i === promoIdx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, ...SPRING }}
          className="mt-4 px-4"
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
            {categories.map((cat, i) => {
              const isActive = activeCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.04, ...SPRING }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-semibold shrink-0 snap-start pill-spring ${
                    isActive
                      ? "bg-primary text-white shadow-primary-glow"
                      : "bg-white text-text-secondary border border-border-light"
                  }`}
                >
                  {cat.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Popular */}
        <SectionHeader title="Populyar" />
        <div className="px-4 grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filter(popularProducts).map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                isLiked={liked.has(p.id)}
                onLike={(e) => toggleLike(e, p.id)}
                onQuickAdd={(e) => quickAdd(e, p)}
                onOpen={() => openProductModal(p)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* New Arrivals */}
        <SectionHeader title="Yeni Gələnlər" />
        <div className="px-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
            {filter(newArrivals).map((p) => (
              <motion.div
                key={p.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => openProductModal(p)}
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
                    <span className="text-[10px]">AZN</span> {p.price}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Set Menus */}
        <div id="sets-section">
          <SectionHeader title="Set Menyular" />
          <div className="px-4 grid grid-cols-2 gap-3 pb-4">
            {filter(setMenus).map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                isLiked={liked.has(p.id)}
                onLike={(e) => toggleLike(e, p.id)}
                onQuickAdd={(e) => quickAdd(e, p)}
                onOpen={() => openProductModal(p)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Sub-components ─── */

function MetaBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
      <span className="text-white/80">{icon}</span>
      <span className="text-white text-[11px] font-medium">{text}</span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-3">
      <h2 className="font-outfit text-[17px] font-bold text-text-primary tracking-[-0.4px]">
        {title}
      </h2>
      <button className="flex items-center gap-1 text-primary text-xs font-semibold">
        Hamısı <ChevronRight size={13} />
      </button>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  index: number;
  isLiked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onQuickAdd: (e: React.MouseEvent) => void;
  onOpen: () => void;
}

function ProductCard({
  product,
  index,
  isLiked,
  onLike,
  onQuickAdd,
  onOpen,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, ...SPRING }}
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
          <p className="text-primary font-outfit text-[15px] font-bold">
            <span className="text-[10px]">AZN</span> {product.price}
          </p>
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
