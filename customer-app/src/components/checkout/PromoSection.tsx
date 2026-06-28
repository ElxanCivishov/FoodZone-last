import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Tag } from "lucide-react";
import { Section } from "./CheckoutSection";

interface PromoSectionProps {
  promoCode: string;
  promoApplied: boolean;
  onChange: (code: string) => void;
  onApply: () => void;
}

export default function PromoSection({
  promoCode,
  promoApplied,
  onChange,
  onApply,
}: PromoSectionProps) {
  return (
    <Section title="Promo kod" icon={<Tag size={16} className="text-primary" />}>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Kodu daxil edin…"
          value={promoCode}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          disabled={promoApplied}
          className="flex-1 px-4 py-3 bg-surface-elevated rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 transition-all"
        />
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={onApply}
          disabled={promoApplied || !promoCode.trim()}
          className="px-4 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#00c2e8,#00c2a8)" }}
        >
          {promoApplied ? "✓" : "Tətbiq et"}
        </motion.button>
      </div>
      <AnimatePresence>
        {promoApplied && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-success text-[12px] font-semibold mt-2 flex items-center gap-1"
          >
            <CheckCircle2 size={13} /> FOOD10 — 10% endirim tətbiq edildi
          </motion.p>
        )}
      </AnimatePresence>
    </Section>
  );
}
