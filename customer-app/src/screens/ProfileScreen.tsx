import ProfileHero from "@/components/profile/ProfileHero";
import ProfileMenuGroups from "@/components/profile/ProfileMenuGroups";
import ProfileStats from "@/components/profile/ProfileStats";
import { MOCK_XP, SPRING, type MenuItem } from "@/components/profile/constants";
import { useUIStore } from "@/store";
import { getTierInfo, tierProgress } from "@/utils/loyalty";
import { motion } from "framer-motion";
import { ChevronRight, LogIn, Star } from "lucide-react";
import { useT } from "@/hooks/useT";

export default function ProfileScreen() {
  const { setScreen, openModal, language, userInfo, isLoggedIn } = useUIStore();
  const t = useT();

  const tierInfo = getTierInfo(MOCK_XP);
  const xpProgress = tierProgress(MOCK_XP);
  const xpLabel = tierInfo.nextMin
    ? `${MOCK_XP} / ${tierInfo.nextMin} XP`
    : `${MOCK_XP} XP`;

  const displayName = userInfo?.name || t.profile.guestUser;

  const handleItem = (item: MenuItem) => {
    if (item.action === "language") {
      openModal("language");
      return;
    }
    if (item.screen) setScreen(item.screen);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      <ProfileHero
        displayName={displayName}
        isLoggedIn={isLoggedIn}
        tierInfo={tierInfo}
        xpProgress={xpProgress}
        xpLabel={xpLabel}
        onEditProfile={() => setScreen("editProfile")}
      />

      <ProfileStats />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-8 pb-24 space-y-4">
        <ProfileMenuGroups language={language} onItem={handleItem} />

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
              {t.profile.feedbackTitle}
            </p>
            <p className="text-[12px] text-text-secondary mt-0.5">
              {t.profile.feedbackSub}
            </p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary" />
        </motion.button>

        {!isLoggedIn && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, ...SPRING }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setScreen("login")}
            className="w-full py-4 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#00c2e8,#00c2a8)" }}
          >
            <LogIn size={16} />
            {t.profile.loginRegister}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
