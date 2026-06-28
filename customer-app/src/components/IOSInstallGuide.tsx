import { AnimatePresence, motion } from "framer-motion";
import { Share, Plus, Check, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useT } from "@/hooks/useT";

interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: Share,
    color: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-500",
    num: 1,
  },
  {
    icon: Plus,
    color: "bg-primary/10",
    iconColor: "text-primary",
    num: 2,
  },
  {
    icon: Check,
    color: "bg-green-50 dark:bg-green-950",
    iconColor: "text-green-500",
    num: 3,
  },
] as const;

export default function IOSInstallGuide({ open, onClose }: Props) {
  const t = useT();
  const root = document.getElementById("app-root");
  if (!root) return null;

  const stepTexts = [t.iosGuide.step1, t.iosGuide.step2, t.iosGuide.step3];

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 z-[500]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a1a2e] rounded-t-3xl z-[501] pb-8"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border-light" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/icon-96.png"
                  alt="FoodZone"
                  className="w-11 h-11 rounded-2xl"
                />
                <div>
                  <p className="text-[16px] font-bold text-text-primary">
                    {t.iosGuide.title}
                  </p>
                  <p className="text-[12px] text-text-secondary">
                    {t.iosGuide.sub}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center"
              >
                <X size={15} className="text-text-secondary" />
              </button>
            </div>

            {/* Steps */}
            <div className="px-5 space-y-3">
              {STEPS.map(({ icon: Icon, color, iconColor, num }, i) => (
                <div
                  key={num}
                  className="flex items-center gap-4 bg-surface-elevated rounded-2xl px-4 py-3.5"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}
                  >
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-text-primary leading-snug">
                      {stepTexts[i]}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-text-secondary shrink-0">
                    {num}
                  </span>
                </div>
              ))}
            </div>

            {/* Done button */}
            <div className="px-5 mt-5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[15px]"
              >
                {t.iosGuide.done}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    root,
  );
}
