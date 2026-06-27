import { motion } from "framer-motion";
import {
  Heart,
  Receipt,
  Settings,
  HelpCircle,
  ChevronRight,
  Star,
  Package,
  Award,
  Globe,
  MapPin,
  CreditCard,
  Tag,
  Bell,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useUIStore } from "@/store";
import type { Screen } from "@/types";
import { getTierInfo, tierProgress } from "@/utils/loyalty";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

const STATS = [
  { icon: Package, label: "Sifariş", value: "12" },
  { icon: Star, label: "Rəy", value: "8" },
  { icon: Award, label: "Xal", value: "240" },
];

type MenuItem = {
  icon: typeof Heart;
  label: string;
  screen?: Screen;
  badge?: string;
};

const GROUPS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Fəaliyyət",
    items: [
      { icon: Receipt, label: "Sifariş Tarixçəsi", screen: "orderHistory" },
      { icon: Heart, label: "Seçilmişlər", screen: "favorites" },
      { icon: Bell, label: "Ofisiant Müraciətləri", screen: "waiterRequests" },
    ],
  },
  {
    title: "Hesab",
    items: [
      { icon: CreditCard, label: "Ödəniş üsulları", screen: "payments" },
      { icon: Tag, label: "Kuponlarım", screen: "coupons" },
      { icon: MapPin, label: "Ünvanlarım", screen: "addresses" },
    ],
  },
  {
    title: "Rəy və Dəstək",
    items: [
      { icon: Star, label: "Rəylərim", screen: "reviews" },
      {
        icon: MessageSquare,
        label: "Dəstək Müraciətləri",
        screen: "supportRequests",
      },
      { icon: HelpCircle, label: "Dəstək", screen: "help" },
    ],
  },
  {
    title: "Tənzimləmələr",
    items: [
      { icon: Globe, label: "Dil seçimi", badge: "AZ" },
      { icon: Settings, label: "Tənzimləmələr", screen: "settings" },
    ],
  },
];

const MOCK_XP = 240; // TODO: fetch from Customer API

export default function ProfileScreen() {
  const { setScreen, openModal, language } = useUIStore();

  const LANG_CODES: Record<string, string> = {
    az: "AZ",
    en: "EN",
    ru: "RU",
    tr: "TR",
  };

  const tierInfo = getTierInfo(MOCK_XP);
  const xpProgress = tierProgress(MOCK_XP);
  const xpLabel = tierInfo.nextMin
    ? `${MOCK_XP} / ${tierInfo.nextMin} XP`
    : `${MOCK_XP} XP`;

  const handleItem = (item: MenuItem) => {
    if (item.label === "Dil seçimi") {
      openModal("language");
      return;
    }
    if (item.screen) setScreen(item.screen);
  };

  let delay = 0.08;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div
        className="relative px-5 pt-12 pb-16 shrink-0 overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg,#0f0c29 0%,#302b63 55%,#24243e 100%)",
        }}
      >
        {/* Decorative rings */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-white/[0.04]" />
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full border border-white/[0.06]" />
        <div className="absolute top-8 -right-4 w-32 h-32 rounded-full border border-white/[0.05]" />
        {/* Diagonal dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        {/* Glow spots */}
        <div
          className="absolute -top-10 right-0 w-56 h-56 opacity-25"
          style={{
            background: "radial-gradient(circle,#00c2e8,transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-4 -left-12 w-52 h-52 opacity-20"
          style={{
            background: "radial-gradient(circle,#a78bfa,transparent 65%)",
          }}
        />

        {/* Avatar + info */}
        <div className="relative z-10 flex items-start gap-4 mt-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-[92px] h-[92px] rounded-full p-[3px]"
              style={{
                background: "linear-gradient(135deg,#00c2e8,#a78bfa,#f59e0b)",
              }}
            >
              <div className="w-full h-full rounded-full bg-[#191540] flex items-center justify-center">
                <span className="font-outfit text-[26px] font-black text-white tracking-tighter select-none">
                  Qİ
                </span>
              </div>
            </div>
            {/* Online pulse */}
            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-[2.5px] border-[#191540]">
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-5">
            <h1 className="font-outfit text-[20px] font-bold text-white tracking-[-0.4px] leading-tight">
              Qonaq İstifadəçi
            </h1>

            {/* Pills row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10">
                <span className="text-[11px] leading-none">🪑</span>
                <span className="text-white/80 text-[11px] font-semibold leading-none">
                  Masa 12
                </span>
              </div>
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ background: tierInfo.gradient }}
              >
                <Zap size={9} className="text-white fill-white" />
                <span className="text-white text-[10px] font-black tracking-wide leading-none">
                  {tierInfo.label.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="relative z-10 mt-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">
              Loyallıq xalı
            </span>
            <span className="text-white/60 text-[10px] font-bold">
              {xpLabel}
            </span>
          </div>
          <div className="h-[5px] rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(xpProgress * 100)}%` }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#00c2e8,#a78bfa)" }}
            />
          </div>
        </div>
      </div>

      {/* Stats — overlap cards */}
      <div className="relative z-20 -mt-[38px] px-4 shrink-0">
        <div className="flex gap-3">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, ...SPRING }}
                className="flex-1 bg-white rounded-2xl shadow-lg border border-border-light flex flex-col items-center py-3.5"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5"
                  style={{
                    background:
                      i === 0
                        ? "linear-gradient(135deg,#00c2e8,#00c2a8)"
                        : i === 1
                          ? "linear-gradient(135deg,#f59e0b,#d97706)"
                          : "linear-gradient(135deg,#a78bfa,#7c3aed)",
                  }}
                >
                  <Icon size={14} className="text-white" />
                </div>
                <p className="font-outfit text-[20px] font-bold text-text-primary leading-none">
                  {s.value}
                </p>
                <p className="text-text-tertiary text-[10px] mt-0.5 font-medium">
                  {s.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Menu groups */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-8 pb-24 space-y-4">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">
              {group.title}
            </p>
            <div className="bg-white rounded-2xl shadow-xs border border-border-light overflow-hidden">
              {group.items.map((item, i) => {
                const Icon = item.icon;
                const isLang = item.label === "Dil seçimi";
                const d = (delay += 0.04);
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: d, ...SPRING }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleItem(item)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-elevated ${
                      i < group.items.length - 1
                        ? "border-b border-border-light"
                        : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <span className="flex-1 text-[15px] font-medium text-text-primary">
                      {item.label}
                    </span>
                    {isLang ? (
                      <span className="text-[12px] font-bold text-primary bg-primary-light rounded-full px-2 py-0.5">
                        {LANG_CODES[language] ?? "AZ"}
                      </span>
                    ) : (
                      <ChevronRight size={16} className="text-text-tertiary" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Feedback */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, ...SPRING }}
          whileTap={{ scale: 0.97 }}
          onClick={() => openModal("feedback")}
          className="w-full flex items-center gap-3 px-4 py-4 bg-white rounded-2xl shadow-xs border border-border-light"
        >
          <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
            <Star size={16} className="text-warning" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[15px] font-medium text-text-primary">
              Rəy bildir
            </p>
            <p className="text-[12px] text-text-secondary mt-0.5">
              Xidmətimizi qiymətləndir
            </p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary" />
        </motion.button>

        {/* Login CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, ...SPRING }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setScreen("login")}
          className="w-full py-4 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#00c2e8,#00c2a8)" }}
        >
          Daxil ol / Qeydiyyat
        </motion.button>
      </div>
    </motion.div>
  );
}
