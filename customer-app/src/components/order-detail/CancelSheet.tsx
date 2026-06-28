import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { CANCEL_REASONS, SPRING } from "./constants";

interface CancelSheetProps {
  show: boolean;
  onClose: () => void;
  selectedReason: string;
  setSelectedReason: (r: string) => void;
  customReason: string;
  setCustomReason: (r: string) => void;
  onSubmit: () => void;
  paymentMethod: string;
}

export default function CancelSheet({
  show,
  onClose,
  selectedReason,
  setSelectedReason,
  customReason,
  setCustomReason,
  onSubmit,
  paymentMethod,
}: CancelSheetProps) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-[300] bg-black/50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING}
            className="absolute bottom-0 left-0 right-0 z-[301] bg-white dark:bg-[#1a1a2e] rounded-t-3xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-outfit text-[17px] font-bold text-text-primary">
                İmtina səbəbi
              </h3>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center"
              >
                <X size={14} className="text-text-secondary" />
              </motion.button>
            </div>

            {paymentMethod === "card" && (
              <div className="flex items-start gap-2.5 p-3 bg-warning/10 border border-warning/25 rounded-xl mb-4">
                <AlertCircle
                  size={15}
                  className="text-warning shrink-0 mt-0.5"
                />
                <p className="text-[12px] text-warning leading-relaxed">
                  Ödənişinizin geri qaytarılması üçün restoran ilə əlaqə
                  saxlamağınız tələb olunur.
                </p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {CANCEL_REASONS.map((r) => (
                <motion.button
                  key={r}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedReason(r)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    selectedReason === r
                      ? "border-coral bg-coral/5"
                      : "border-transparent bg-surface-elevated"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedReason === r
                        ? "border-coral bg-coral"
                        : "border-border"
                    }`}
                  >
                    {selectedReason === r && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={`text-[14px] font-medium ${
                      selectedReason === r ? "text-coral" : "text-text-primary"
                    }`}
                  >
                    {r}
                  </span>
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {selectedReason === "Digər" && (
                <motion.input
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 44 }}
                  exit={{ opacity: 0, height: 0 }}
                  type="text"
                  placeholder="Səbəbi yazın…"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3.5 rounded-xl border border-border-light bg-surface-elevated text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-coral mb-3"
                />
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl border border-border-light bg-surface-elevated text-[14px] font-semibold text-text-secondary"
              >
                Ləğv et
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onSubmit}
                disabled={
                  !selectedReason ||
                  (selectedReason === "Digər" && !customReason.trim())
                }
                className="flex-1 py-3.5 rounded-xl bg-coral text-white text-[14px] font-semibold disabled:opacity-50"
              >
                İmtina et
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
