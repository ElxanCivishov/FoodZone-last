import { motion } from "framer-motion";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";
import { formatCardNum, formatExpiry, type SavedCard, SPRING } from "./checkoutTypes";
import { useT } from "@/hooks/useT";

interface NewCardFormProps {
  onAdd: (card: SavedCard) => void;
  onClose: () => void;
}

function inputCls(hasError: boolean) {
  return `w-full h-10 px-3 rounded-xl border text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
    hasError
      ? "border-coral bg-coral/5"
      : "border-border-light bg-white dark:bg-[#22223a]"
  }`;
}

function CardInput({
  label,
  error,
  input,
}: {
  label: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-secondary mb-1">
        {label}
      </p>
      {input}
      {error && <p className="text-coral text-[10px] mt-0.5">{error}</p>}
    </div>
  );
}

export default function NewCardForm({ onAdd, onClose }: NewCardFormProps) {
  const t = useT();
  const [cardForm, setCardForm] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [showCvv, setShowCvv] = useState(false);

  const validate = () => {
    const digits = cardForm.number.replace(/\s/g, "");
    const e: Record<string, string> = {};
    if (digits.length < 16) e.number = t.checkout.cardNumberError;
    if (!cardForm.name.trim()) e.name = t.checkout.cardNameError;
    if (cardForm.expiry.length < 5) e.expiry = t.checkout.expiryError;
    if (cardForm.cvv.length < 3) e.cvv = t.checkout.cvvError;
    setCardErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const digits = cardForm.number.replace(/\s/g, "");
    const newCard: SavedCard = {
      id: Date.now(),
      label: digits.startsWith("4") ? "Visa" : "Mastercard",
      last4: digits.slice(-4),
      expires: cardForm.expiry,
      color: digits.startsWith("4")
        ? ["#1a1a2e", "#16213e"]
        : ["#eb5757", "#b83232"],
    };
    onAdd(newCard);
  };

  const handleClose = () => {
    onClose();
    setCardErrors({});
    setCardForm({ number: "", name: "", expiry: "", cvv: "" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={SPRING}
      className="bg-surface-elevated rounded-xl p-3 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-text-primary">{t.checkout.newCard}</p>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleClose}
          className="w-7 h-7 rounded-full bg-border-light flex items-center justify-center"
        >
          <X size={12} className="text-text-secondary" />
        </motion.button>
      </div>

      <CardInput
        label={t.checkout.cardNumber}
        error={cardErrors.number}
        input={
          <input
            type="text"
            inputMode="numeric"
            placeholder="0000 0000 0000 0000"
            value={cardForm.number}
            onChange={(e) => {
              setCardForm((f) => ({ ...f, number: formatCardNum(e.target.value) }));
              setCardErrors((er) => ({ ...er, number: "" }));
            }}
            className={inputCls(!!cardErrors.number)}
          />
        }
      />

      <CardInput
        label={t.checkout.cardName}
        error={cardErrors.name}
        input={
          <input
            type="text"
            placeholder={t.checkout.cardHolderPreview}
            value={cardForm.name}
            onChange={(e) => {
              setCardForm((f) => ({ ...f, name: e.target.value.toUpperCase() }));
              setCardErrors((er) => ({ ...er, name: "" }));
            }}
            className={inputCls(!!cardErrors.name)}
          />
        }
      />

      <div className="grid grid-cols-2 gap-2">
        <CardInput
          label={t.checkout.expiry}
          error={cardErrors.expiry}
          input={
            <input
              type="text"
              inputMode="numeric"
              placeholder="MM/YY"
              value={cardForm.expiry}
              onChange={(e) => {
                setCardForm((f) => ({ ...f, expiry: formatExpiry(e.target.value) }));
                setCardErrors((er) => ({ ...er, expiry: "" }));
              }}
              className={inputCls(!!cardErrors.expiry)}
            />
          }
        />
        <CardInput
          label="CVV"
          error={cardErrors.cvv}
          input={
            <div className="relative">
              <input
                type={showCvv ? "text" : "password"}
                inputMode="numeric"
                placeholder="•••"
                maxLength={4}
                value={cardForm.cvv}
                onChange={(e) => {
                  setCardForm((f) => ({
                    ...f,
                    cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }));
                  setCardErrors((er) => ({ ...er, cvv: "" }));
                }}
                className={inputCls(!!cardErrors.cvv) + " pr-8"}
              />
              <button
                type="button"
                onClick={() => setShowCvv((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
              >
                {showCvv ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          }
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleAdd}
        className="w-full h-10 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-1.5"
        style={{ background: "linear-gradient(135deg,#00c2e8,#00c2a8)" }}
      >
        <Check size={14} /> {t.checkout.addCard}
      </motion.button>
    </motion.div>
  );
}
