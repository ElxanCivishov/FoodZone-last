import { useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  ChevronLeft,
  Star,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  Heart,
} from "lucide-react";
import { useUIStore, useCartStore } from "@/store";
import { sizeOptions, extraOptions } from "@/data/menuData";
import type { SizeOption, ExtraOption } from "@/types";

const SPRING_DRAWER = { type: "spring" as const, stiffness: 350, damping: 30 };

export default function ProductDetail() {
  const {
    productModalOpen,
    selectedProduct,
    closeProductModal,
    openCartDrawer,
    addToast,
  } = useUIStore();
  const addItem = useCartStore((s) => s.addItem);

  const [selectedSize, setSelectedSize] = useState<SizeOption>(sizeOptions[1]);
  const [selectedExtras, setSelectedExtras] = useState<ExtraOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);
  const dragControls = useDragControls();

  if (!selectedProduct) return null;

  const unitPrice =
    selectedProduct.price +
    selectedSize.priceModifier +
    selectedExtras.reduce((s, e) => s + e.price, 0);
  const total = unitPrice * quantity;

  const toggleExtra = (extra: ExtraOption) =>
    setSelectedExtras((prev) =>
      prev.find((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra],
    );

  const handleAdd = () => {
    addItem({
      product: selectedProduct,
      quantity,
      selectedSize,
      selectedExtras: [...selectedExtras],
      unitPrice,
    });
    setAdded(true);
    addToast(`${selectedProduct.name} səbətə əlavə edildi!`, "success");
    setTimeout(() => {
      setAdded(false);
      closeProductModal();
      openCartDrawer();
    }, 1300);
  };

  const handleDragEnd = (_: unknown, info: { offset: { y: number } }) => {
    if (info.offset.y > 120) closeProductModal();
  };

  return (
    <AnimatePresence>
      {productModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeProductModal}
            className="absolute inset-0 z-[200] modal-backdrop"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING_DRAWER}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 300 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute bottom-0 left-0 right-0 z-[201] bg-white dark:bg-[#1a1a2e] rounded-t-3xl max-h-[88%] flex flex-col shadow-modal"
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-border dark:bg-white/10" />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {/* Image */}
              <div className="relative mx-4 h-[260px] rounded-2xl overflow-hidden">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={closeProductModal}
                  className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
                >
                  <ChevronLeft size={18} className="text-gray-800" />
                </button>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setLiked((v) => !v)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
                >
                  <Heart
                    size={16}
                    className={
                      liked ? "text-coral fill-coral" : "text-text-tertiary"
                    }
                  />
                </motion.button>
                {selectedProduct.badge && (
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-coral text-white text-[11px] font-bold uppercase">
                    {selectedProduct.badge}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="px-5 pt-5 pb-6">
                {/* Title + rating */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-outfit text-[22px] font-bold text-text-primary tracking-[-0.8px] flex-1">
                    {selectedProduct.name}
                  </h2>
                  <div className="flex items-center gap-1 bg-warning/10 dark:bg-warning/15 rounded-full px-2.5 py-1 shrink-0">
                    <Star size={13} className="text-warning fill-warning" />
                    <span className="text-[13px] font-bold text-text-primary">
                      {selectedProduct.rating}
                    </span>
                  </div>
                </div>
                <p className="text-[13px] text-text-secondary mt-1">
                  ({selectedProduct.reviews} rəy)
                </p>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="font-outfit text-[22px] font-bold text-primary">
                    {selectedProduct.price.toFixed(2)}
                    <span className="text-[13px] ml-0.5">AZN</span>
                  </span>
                  {selectedProduct.originalPrice && (
                    <>
                      <span className="text-[15px] text-text-tertiary line-through">
                        {selectedProduct.originalPrice.toFixed(2)} AZN
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[11px] font-bold">
                        -{Math.round((1 - selectedProduct.price / selectedProduct.originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[14px] text-text-secondary leading-relaxed mt-3">
                  {selectedProduct.desc}
                </p>

                {/* Size */}
                <h3 className="font-outfit text-[15px] font-bold text-text-primary mt-6 mb-3">
                  Ölçü
                </h3>
                <div className="space-y-2">
                  {sizeOptions.map((size) => (
                    <motion.button
                      key={size.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSize(size)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                        selectedSize.id === size.id
                          ? "border-primary bg-primary-light dark:bg-[rgba(0,194,232,0.12)]"
                          : "border-transparent bg-surface-elevated dark:bg-[#22223a]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedSize.id === size.id
                              ? "border-primary bg-primary"
                              : "border-border dark:border-white/20"
                          }`}
                        >
                          {selectedSize.id === size.id && (
                            <Check
                              size={11}
                              className="text-white"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <span className="text-[13px] font-semibold text-text-primary">
                          {size.label}
                        </span>
                      </div>
                      <span className="text-[13px] text-text-secondary">
                        +{size.priceModifier} AZN
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* Extras */}
                <h3 className="font-outfit text-[15px] font-bold text-text-primary mt-6 mb-3">
                  Əlavələr
                </h3>
                <div className="space-y-2">
                  {extraOptions.map((extra) => {
                    const on = selectedExtras.some((e) => e.id === extra.id);
                    return (
                      <motion.button
                        key={extra.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleExtra(extra)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                          on
                            ? "border-primary bg-primary-light dark:bg-[rgba(0,194,232,0.12)]"
                            : "border-transparent bg-surface-elevated dark:bg-[#22223a]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              on
                                ? "border-primary bg-primary"
                                : "border-border dark:border-white/20"
                            }`}
                          >
                            {on && (
                              <Check
                                size={11}
                                className="text-white"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <span className="text-[13px] font-semibold text-text-primary">
                            {extra.label}
                          </span>
                        </div>
                        <span className="text-[13px] text-text-secondary">
                          +{extra.price} AZN
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-center gap-6 mt-7">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 rounded-full border-2 border-border dark:border-white/15 flex items-center justify-center disabled:opacity-40"
                  >
                    <Minus size={16} className="text-text-primary" />
                  </motion.button>
                  <span className="font-outfit text-2xl font-bold text-text-primary w-8 text-center">
                    {quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-11 h-11 rounded-full border-2 border-border dark:border-white/15 flex items-center justify-center"
                  >
                    <Plus size={16} className="text-text-primary" />
                  </motion.button>
                </div>

                {/* Add button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  className={`w-full mt-6 py-4 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                    added ? "bg-success" : "shadow-primary-glow"
                  }`}
                  style={
                    added
                      ? {}
                      : {
                          background:
                            "linear-gradient(135deg, #00c2e8, #00c2a8)",
                        }
                  }
                >
                  <AnimatePresence mode="wait">
                    {added ? (
                      <motion.span
                        key="ok"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Check size={18} strokeWidth={2.5} /> Əlavə edildi!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingBag size={17} /> Səbətə əlavə et —{" "}
                        {total.toFixed(2)} AZN
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
