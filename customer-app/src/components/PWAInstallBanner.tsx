import { AnimatePresence, motion } from "framer-motion";
import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const DISMISS_KEY = "fz_pwa_dismissed_until";
const DISMISS_DAYS = 7;

// iOS Safari-də beforeinstallprompt yoxdur, ayrı mesaj göstəririk
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isIOSSafari =
  isIOS && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

function isDismissed() {
  const until = localStorage.getItem(DISMISS_KEY);
  return until ? Date.now() < Number(until) : false;
}

function dismiss() {
  localStorage.setItem(
    DISMISS_KEY,
    String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
  );
}

export default function PWAInstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled || isDismissed()) return;
    // Splash geçdikdən sonra biraz gecikmə ilə göstər
    const t = setTimeout(() => {
      if (canInstall || isIOSSafari) setVisible(true);
    }, 3000);
    return () => clearTimeout(t);
  }, [canInstall, isInstalled]);

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="absolute bottom-[72px] left-3 right-3 z-[400] rounded-2xl shadow-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg,#00c2e8,#00a8d4)" }}
        >
          <div className="flex items-center gap-3 p-4">
            {/* App icon */}
            <img
              src="/icons/icon-96.png"
              alt="FoodZone"
              className="w-12 h-12 rounded-xl shrink-0"
            />

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-[14px] leading-tight">
                FoodZone tətbiqini yüklə
              </p>
              {isIOSSafari ? (
                <p className="text-white/80 text-[11px] mt-0.5 leading-snug">
                  Aşağıdakı{" "}
                  <Share size={10} className="inline -mt-0.5" /> düyməsini tap
                  → «Ana Ekrana Əlavə Et»
                </p>
              ) : (
                <p className="text-white/80 text-[11px] mt-0.5">
                  Daha sürətli, offline işləyir
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!isIOSSafari && (
                <button
                  onClick={handleInstall}
                  className="bg-white text-[#00c2e8] text-[12px] font-bold px-3 py-1.5 rounded-xl"
                >
                  Yüklə
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
