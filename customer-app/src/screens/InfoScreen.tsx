import AboutCard from "@/components/info/AboutCard";
import ContactCard from "@/components/info/ContactCard";
import DeliveryCard from "@/components/info/DeliveryCard";
import FaqCard from "@/components/info/FaqCard";
import GalleryStrip from "@/components/info/GalleryStrip";
import HeroSection from "@/components/info/HeroSection";
import HoursCard from "@/components/info/HoursCard";
import ServiceFeeCard from "@/components/info/ServiceFeeCard";
import WifiCard from "@/components/info/WifiCard";
import { RESTAURANT_INFO } from "@/data/restaurantInfo";
import { useUIStore } from "@/store";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useT } from "@/hooks/useT";

export default function InfoScreen() {
  const t = useT();
  const { setScreen, openModal, addToast } = useUIStore();
  const today = new Date().getDay();

  const todayHours = RESTAURANT_INFO.hours.find((h) => h.idx === today);
  const isOpen = (() => {
    const now = new Date();
    const h = now.getHours();
    const isWeekend = today === 0 || today === 6;
    return isWeekend ? h >= 11 && h < 23 : h >= 10 && h < 22;
  })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <HeroSection isOpen={isOpen} todayHours={todayHours?.time ?? ""} />

        <div className="px-4 space-y-3 mt-4">
          <AboutCard />
          <GalleryStrip onViewAll={() => setScreen("gallery")} />
          <ServiceFeeCard />
          <HoursCard today={today} isOpen={isOpen} />
          <ContactCard addToast={addToast} />
          <WifiCard addToast={addToast} />
          <DeliveryCard />
          <FaqCard />

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openModal("feedback")}
            className="w-full py-4 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow"
            style={{ background: "linear-gradient(135deg,#00c2e8,#00c2a8)" }}
          >
            <MessageSquare size={18} />
            {t.modal.feedback}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
