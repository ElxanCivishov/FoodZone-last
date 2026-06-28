import AppearanceCard from "@/components/settings/AppearanceCard";
import AppInfoCard from "@/components/settings/AppInfoCard";
import { SPRING } from "@/components/settings/constants";
import DangerZoneCard from "@/components/settings/DangerZoneCard";
import DeleteConfirmModal from "@/components/settings/DeleteConfirmModal";
import EmailCard from "@/components/settings/EmailCard";
import LanguageCard from "@/components/settings/LanguageCard";
import NotificationsCard from "@/components/settings/NotificationsCard";
import { useUIStore } from "@/store";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useT } from "@/hooks/useT";

export default function SettingsScreen() {
  const t = useT();
  const {
    goBack,
    setScreen,
    openModal,
    language,
    logout,
    isLoggedIn,
    isDark,
    toggleDark,
  } = useUIStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [emailNotif, setEmailNotif] = useState(false);

  const handleConfirmDelete = () => {
    logout();
    setScreen("home");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      <div className="bg-white px-4 py-4 border-b border-border-light flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={goBack}
          className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <h1 className="font-outfit text-[20px] font-bold text-text-primary">
          {t.settings.title}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 space-y-4">
        <NotificationsCard />
        <EmailCard
          checked={emailNotif}
          onToggle={() => setEmailNotif((v) => !v)}
        />
        <AppearanceCard isDark={isDark} onToggle={toggleDark} />
        <LanguageCard
          language={language}
          onOpen={() => openModal("language")}
        />
        <AppInfoCard />
        {isLoggedIn && (
          <DangerZoneCard onDelete={() => setShowDeleteConfirm(true)} />
        )}
      </div>

      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />
    </motion.div>
  );
}
