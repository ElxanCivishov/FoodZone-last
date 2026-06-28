import type { OrderType, PaymentMethod } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, CreditCard, Plus } from "lucide-react";
import { Section } from "./CheckoutSection";
import { type SavedCard, SAVED_CARDS } from "./checkoutTypes";
import NewCardForm from "./NewCardForm";

interface PaymentSectionProps {
  orderType: OrderType;
  payMethod: PaymentMethod;
  deliveryOnlyCard: boolean;
  effectivePayMethod: PaymentMethod;
  selectedCardId: number;
  showNewCard: boolean;
  onChange: (m: PaymentMethod) => void;
  onSelectCard: (id: number) => void;
  onShowNewCard: () => void;
  onCardAdded: (card: SavedCard) => void;
  onCancelNewCard: () => void;
}

export default function PaymentSection({
  orderType,
  payMethod,
  deliveryOnlyCard,
  effectivePayMethod,
  selectedCardId,
  showNewCard,
  onChange,
  onSelectCard,
  onShowNewCard,
  onCardAdded,
  onCancelNewCard,
}: PaymentSectionProps) {
  return (
    <Section
      title="Ödəniş üsulu"
      icon={<CreditCard size={16} className="text-primary" />}
    >
      {orderType === "delivery" && deliveryOnlyCard ? (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
          <CreditCard size={14} className="text-primary shrink-0" />
          <p className="text-[13px] text-primary font-medium">
            Çatdırılma üçün yalnız kart qəbul edilir
          </p>
        </div>
      ) : (
        <div className="flex gap-2">
          {(["cash", "card"] as PaymentMethod[]).map((m) => {
            const Icon = m === "cash" ? Banknote : CreditCard;
            const label = m === "cash" ? "Nağd" : "Kart";
            const active = payMethod === m;
            return (
              <motion.button
                key={m}
                whileTap={{ scale: 0.96 }}
                onClick={() => onChange(m)}
                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                  active
                    ? "border-primary bg-primary-light"
                    : "border-transparent bg-surface-elevated"
                }`}
              >
                <Icon
                  size={22}
                  className={active ? "text-primary" : "text-text-tertiary"}
                />
                <span
                  className={`text-[13px] font-semibold ${
                    active ? "text-primary" : "text-text-secondary"
                  }`}
                >
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {effectivePayMethod === "card" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              <p className="text-[12px] font-semibold text-text-secondary">
                Saxlanmış kartlar
              </p>
              {SAVED_CARDS.map((card) => {
                const active = selectedCardId === card.id && !showNewCard;
                return (
                  <motion.button
                    key={card.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectCard(card.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      active
                        ? "border-primary bg-primary-light"
                        : "border-transparent bg-surface-elevated"
                    }`}
                  >
                    <div
                      className="w-10 h-6 rounded"
                      style={{
                        background: `linear-gradient(135deg,${card.color[0]},${card.color[1]})`,
                      }}
                    />
                    <div className="flex-1 text-left">
                      <p
                        className={`text-[13px] font-bold ${
                          active ? "text-primary" : "text-text-primary"
                        }`}
                      >
                        {card.label}
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        •••• {card.last4} · {card.expires}
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        active ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {active && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </motion.button>
                );
              })}

              {!showNewCard && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onShowNewCard}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-primary/40 bg-white dark:bg-transparent"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                    <Plus size={14} className="text-primary" />
                  </div>
                  <span className="text-[13px] font-semibold text-primary">
                    Yeni kart əlavə et
                  </span>
                </motion.button>
              )}

              <AnimatePresence>
                {showNewCard && (
                  <NewCardForm onAdd={onCardAdded} onClose={onCancelNewCard} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}
