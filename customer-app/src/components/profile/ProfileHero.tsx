import { motion } from "framer-motion";
import { Pencil, Zap } from "lucide-react";
import type { getTierInfo } from "@/utils/loyalty";
import { useT } from "@/hooks/useT";

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "Qİ"
  );
}

interface ProfileHeroProps {
  displayName: string;
  isLoggedIn: boolean;
  tierInfo: ReturnType<typeof getTierInfo>;
  xpProgress: number;
  xpLabel: string;
  onEditProfile: () => void;
}

export default function ProfileHero({
  displayName,
  isLoggedIn,
  tierInfo,
  xpProgress,
  xpLabel,
  onEditProfile,
}: ProfileHeroProps) {
  const avatarLetters = getInitials(displayName);
  const t = useT();

  return (
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
        style={{ background: "radial-gradient(circle,#00c2e8,transparent 65%)" }}
      />
      <div
        className="absolute bottom-4 -left-12 w-52 h-52 opacity-20"
        style={{ background: "radial-gradient(circle,#a78bfa,transparent 65%)" }}
      />

      {/* Avatar + info */}
      <div className="relative z-10 flex items-start gap-4 mt-4">
        <div className="relative shrink-0">
          <div
            className="w-[92px] h-[92px] rounded-full p-[3px]"
            style={{
              background: "linear-gradient(135deg,#00c2e8,#a78bfa,#f59e0b)",
            }}
          >
            <div className="w-full h-full rounded-full bg-[#191540] flex items-center justify-center">
              <span className="font-outfit text-[26px] font-black text-white tracking-tighter select-none">
                {avatarLetters}
              </span>
            </div>
          </div>
          {/* Online pulse */}
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-[2.5px] border-[#191540]">
            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-5">
          <div className="flex items-center gap-2">
            <h1 className="font-outfit text-[20px] font-bold text-white tracking-[-0.4px] leading-tight truncate">
              {displayName}
            </h1>
            {isLoggedIn && (
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onEditProfile}
                className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0"
              >
                <Pencil size={12} className="text-white" />
              </motion.button>
            )}
          </div>

          {/* Pills row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10">
              <span className="text-[11px] leading-none">🪑</span>
              <span className="text-white/80 text-[11px] font-semibold leading-none">
                {t.profile.tableNumber}
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
            {t.profile.loyaltyPoints}
          </span>
          <span className="text-white/60 text-[10px] font-bold">{xpLabel}</span>
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
  );
}
