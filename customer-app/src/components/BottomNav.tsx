import { useT } from "@/hooks/useT";
import { useUIStore } from "@/store";
import type { NavTab } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Home, LayoutGrid, Store, User } from "lucide-react";

const HIDDEN = ["splash", "login", "register", "checkout", "admin"];

type Item = {
  key: string;
  label: string;
  icon: typeof Home;
  isActive: boolean;
  onClick: () => void;
};

export default function BottomNav() {
  const { activeTab, setActiveTab, currentScreen, setScreen } = useUIStore();
  const t = useT();

  if (HIDDEN.includes(currentScreen)) return null;

  const infoActive = currentScreen === "info";

  console.log("activeTab", activeTab);

  const items: Item[] = [
    {
      key: "home",
      label: t.nav.home,
      icon: Home,
      isActive: activeTab === "home" && !infoActive,
      onClick: () => setActiveTab("home" as NavTab),
    },
    {
      key: "search",
      label: "Menyu",
      icon: LayoutGrid,
      isActive: activeTab === "search" && !infoActive,
      onClick: () => setActiveTab("search" as NavTab),
    },
    {
      key: "info",
      label: t.nav.restaurant,
      icon: Store,
      isActive: infoActive,
      onClick: () => setScreen("info"),
    },
    {
      key: "orders",
      label: t.nav.orders,
      icon: ClipboardList,
      isActive: activeTab === "orders" && !infoActive,
      onClick: () => setActiveTab("orders" as NavTab),
    },
    {
      key: "profile",
      label: t.nav.profile,
      icon: User,
      isActive: activeTab === "profile" && !infoActive,
      onClick: () => setActiveTab("profile" as NavTab),
    },
  ];

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 30, delay: 0.08 }}
      className="absolute bottom-0 left-0 right-0 z-[100]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 10px)" }}
    >
      <div className="mx-4 mb-3 bg-white rounded-2xl border border-border-light shadow-[0_8px_32px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] flex items-center p-1.5 gap-0.5">
        {items.map((item) => (
          <NavPill {...item} />
        ))}
      </div>
    </motion.div>
  );
}

function NavPill({ label, icon: Icon, isActive, onClick }: Item) {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.86 }}
      onClick={onClick}
      className="relative flex items-center justify-center rounded-xl overflow-hidden min-w-0"
      style={{ flex: isActive ? 1.9 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
    >
      {/* Sliding pill background */}
      {isActive && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 rounded-xl"
          style={{ background: "linear-gradient(135deg, #00c2e8, #00c2a8)" }}
          transition={{ type: "spring", stiffness: 480, damping: 38 }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center gap-1.5 py-2.5 px-2 min-w-0">
        <Icon
          size={18}
          strokeWidth={isActive ? 2.5 : 1.8}
          className={`shrink-0 transition-colors duration-200 ${isActive ? "text-white" : "text-text-tertiary"}`}
        />
        <AnimatePresence>
          {isActive && (
            <motion.span
              initial={{ opacity: 0, x: -6, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -6, width: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="text-[11px] font-bold text-white whitespace-nowrap overflow-hidden block"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
