import type { CartItem } from "@/types";
import { CheckCircle2 } from "lucide-react";
import { Section } from "./CheckoutSection";
import { useT } from "@/hooks/useT";

function SummaryRow({
  label,
  value,
  valueClass = "text-text-primary",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

interface OrderSummarySectionProps {
  items: CartItem[];
  subtotal: number;
  fee: number;
  discount: number;
  total: number;
  promoApplied: boolean;
}

export default function OrderSummarySection({
  items,
  subtotal,
  fee,
  discount,
  total,
  promoApplied,
}: OrderSummarySectionProps) {
  const t = useT();

  return (
    <Section
      title={t.checkout.orderSummary}
      icon={<CheckCircle2 size={16} className="text-primary" />}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="flex justify-between text-[13px] py-1.5 border-b border-border-light last:border-0"
        >
          <span className="text-text-secondary truncate flex-1 pr-2">
            {item.product.name} × {item.quantity}
          </span>
          <span className="font-medium text-text-primary shrink-0">
            {(item.unitPrice * item.quantity).toFixed(2)} {t.common.currency}
          </span>
        </div>
      ))}
      <div className="mt-3 space-y-1.5">
        <SummaryRow label={t.cart.subtotal} value={`${subtotal.toFixed(2)} ${t.common.currency}`} />
        <SummaryRow
          label={`${t.cart.serviceFee} (10%)`}
          value={`+${fee.toFixed(2)} ${t.common.currency}`}
        />
        {promoApplied && (
          <SummaryRow
            label={`${t.checkout.discount} (FOOD10 -10%)`}
            value={`-${discount.toFixed(2)} ${t.common.currency}`}
            valueClass="text-success font-semibold"
          />
        )}
        <div className="flex justify-between pt-2 border-t border-border-light mt-2">
          <span className="font-outfit text-[16px] font-bold text-text-primary">
            {t.cart.total}
          </span>
          <span className="font-outfit text-[16px] font-bold text-primary">
            {total.toFixed(2)} {t.common.currency}
          </span>
        </div>
      </div>
    </Section>
  );
}
