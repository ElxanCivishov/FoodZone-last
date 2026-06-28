import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Wifi, ShoppingBag, Sun, Moon } from "lucide-react";
import { useUIStore, useCartStore } from "@/store";

interface Props {
  className?: string;
}

export default function AppHeaderRow({ className = "pt-4 pb-3" }: Props) {
  const {
    isDark,
    toggleDark,
    openCartDrawer,
    openModal,
    setScreen,
    isLoggedIn,
    userInfo,
  } = useUIStore();

  const cartItemCount = useCartStore((s) =>
    s.items.reduce((c, i) => c + i.quantity, 0),
  );

  return (
    <div className={`flex items-center justify-between px-4 ${className}`}>
      <div className="flex items-center gap-1.5">
        <MapPin size={15} className="text-primary" strokeWidth={2.5} />
        <span className="text-[13px] text-text-secondary font-medium">
          İçərişəhər, Bakı
        </span>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={toggleDark}
          className="w-9 h-9 rounded-full bg-white dark:bg-[#22223a] shadow-xs border border-border-light flex items-center justify-center"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? "moon" : "sun"}
              initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.18 }}
            >
              {isDark ? (
                <Sun size={16} className="text-warning" />
              ) : (
                <Moon size={16} className="text-text-secondary" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => openModal("wifi")}
          className="w-9 h-9 rounded-full bg-white dark:bg-[#22223a] shadow-xs border border-border-light flex items-center justify-center"
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

        <AnimatePresence>
          {isLoggedIn && userInfo && (
            <motion.button
              key="avatar"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => setScreen("profile")}
              className="w-9 h-9 rounded-full p-[2px] shrink-0"
              style={{
                background: "linear-gradient(135deg,#00c2e8,#a78bfa,#f59e0b)",
              }}
            >
              <div className="w-full h-full rounded-full bg-[#191540] flex items-center justify-center">
                <span className="font-outfit text-[11px] font-black text-white tracking-tighter select-none">
                  {userInfo.name
                    .trim()
                    .split(" ")
                    .map((w) => w[0] ?? "")
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "Q"}
                </span>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
