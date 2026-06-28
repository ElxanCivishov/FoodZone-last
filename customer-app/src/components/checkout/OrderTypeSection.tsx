import type { OrderType } from "@/types";
import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { InfoBox, Section } from "./CheckoutSection";
import { ORDER_TYPES } from "./checkoutTypes";

interface OrderTypeSectionProps {
  orderType: OrderType;
  tableNumber: number;
  onChange: (type: OrderType) => void;
}

export default function OrderTypeSection({
  orderType,
  tableNumber,
  onChange,
}: OrderTypeSectionProps) {
  return (
    <Section
      title="Sifariş növü"
      icon={<UtensilsCrossed size={16} className="text-primary" />}
    >
      <div className="grid gap-2 grid-cols-3">
        {ORDER_TYPES.map((t) => {
          const Icon = t.icon;
          const active = orderType === t.id;
          return (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(t.id)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                active
                  ? "border-primary bg-primary-light"
                  : "border-transparent bg-surface-elevated"
              }`}
            >
              <Icon
                size={20}
                className={active ? "text-primary" : "text-text-secondary"}
              />
              <p
                className={`text-[12px] font-bold text-center leading-tight ${
                  active ? "text-primary" : "text-text-secondary"
                }`}
              >
                {t.label}
              </p>
              <p
                className={`text-[10px] text-center leading-tight ${
                  active ? "text-primary/70" : "text-text-tertiary"
                }`}
              >
                {t.sub}
              </p>
            </motion.button>
          );
        })}
      </div>
      {orderType === "dine_in" && (
        <InfoBox>Masa {tableNumber} — sifariş masaya gətiriləcək</InfoBox>
      )}
      {orderType === "take_away" && (
        <InfoBox>Sifariş hazır olduqda sizi məlumatlandıracağıq</InfoBox>
      )}
    </Section>
  );
}
