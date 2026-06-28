import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useT } from "@/hooks/useT";

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isIOSSafari =
  isIOS && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

function shareToInstall() {
  navigator.share?.({ title: "FoodZone", url: window.location.href });
}

export default function PWAInstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const t = useT();

  useEffect(() => {
    if (isInstalled || dismissed) return;
    const timer = setTimeout(() => {
      if (canInstall || isIOSSafari) setVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
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
            <img
              src="/icons/icon-96.png"
              alt="FoodZone"
              className="w-12 h-12 rounded-xl shrink-0"
            />

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-[14px] leading-tight">
                {t.pwa.title}
              </p>
              {isIOSSafari ? (
                <p className="text-white/80 text-[11px] mt-0.5 leading-snug">
                  {t.pwa.iosPrefix}{" "}
                  <Share size={10} className="inline -mt-0.5" />{" "}
                  {t.pwa.iosSuffix}
                </p>
              ) : (
                <p className="text-white/80 text-[11px] mt-0.5">
                  {t.pwa.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isIOSSafari ? (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={shareToInstall}
                  className="flex items-center gap-1.5 bg-white text-[#00a8d4] text-[12px] font-bold px-3 py-1.5 rounded-xl"
                >
                  <Share size={13} />
                  {t.pwa.share}
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 bg-white text-[#00a8d4] text-[12px] font-bold px-3 py-1.5 rounded-xl"
                >
                  <Download size={13} />
                  {t.pwa.install}
                </motion.button>
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
