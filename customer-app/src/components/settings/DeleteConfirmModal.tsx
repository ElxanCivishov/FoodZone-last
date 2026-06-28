import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { SPRING } from "./constants";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  show,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return createPortal(
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 z-[500]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={SPRING}
            className="absolute inset-x-5 top-1/2 -translate-y-1/2 z-[501] bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={26} className="text-red-500" />
              </div>
              <h3 className="font-outfit text-[18px] font-bold text-text-primary text-center">
                Profili sil?
              </h3>
              <p className="text-[13px] text-text-secondary text-center mt-2 leading-relaxed">
                Bu əməliyyat geri qaytarıla bilməz. Hesabınız, sifariş
                tarixçəniz və bütün məlumatlarınız həmişəlik silinəcək.
              </p>
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="flex-1 h-12 rounded-2xl border-2 border-border text-[14px] font-semibold text-text-secondary flex items-center justify-center gap-1.5 hover:border-primary hover:text-primary transition-colors"
                >
                  <X size={15} />
                  Ləğv et
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onConfirm}
                  className="flex-1 h-12 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-1.5"
                  style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                >
                  <Trash2 size={15} />
                  Sil
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.getElementById("app-root") ?? document.body,
  );
}
