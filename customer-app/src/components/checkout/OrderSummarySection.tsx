import type { CartItem } from "@/types";
import { CheckCircle2 } from "lucide-react";
import { Section } from "./CheckoutSection";

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
  return (
    <Section
      title="Sifariş xülasəsi"
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
            {(item.unitPrice * item.quantity).toFixed(2)} AZN
          </span>
        </div>
      ))}
      <div className="mt-3 space-y-1.5">
        <SummaryRow label="Ara cəmi" value={`${subtotal.toFixed(2)} AZN`} />
        <SummaryRow
          label="Xidmət haqqı (10%)"
          value={`+${fee.toFixed(2)} AZN`}
        />
        {promoApplied && (
          <SummaryRow
            label="Endirim (FOOD10 -10%)"
            value={`-${discount.toFixed(2)} AZN`}
            valueClass="text-success font-semibold"
          />
        )}
        <div className="flex justify-between pt-2 border-t border-border-light mt-2">
          <span className="font-outfit text-[16px] font-bold text-text-primary">
            Ümumi
          </span>
          <span className="font-outfit text-[16px] font-bold text-primary">
            {total.toFixed(2)} AZN
          </span>
        </div>
      </div>
    </Section>
  );
}
