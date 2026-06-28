import CardHeader from "@/components/ui/CardHeader";
import CardShell from "@/components/ui/CardShell";
import IconDot from "@/components/ui/IconDot";
import { RESTAURANT_INFO } from "@/data/restaurantInfo";
import { ShoppingBag, Timer, Truck } from "lucide-react";

export default function DeliveryCard() {
  const rows = [
    {
      icon: <ShoppingBag size={14} className="text-primary" />,
      label: "Minimum sifariş",
      value: `${RESTAURANT_INFO.minOrder} AZN`,
    },
    {
      icon: <Truck size={14} className="text-primary" />,
      label: "Çatdırılma haqqı",
      value: `${RESTAURANT_INFO.deliveryFee} AZN`,
    },
    {
      icon: <Timer size={14} className="text-primary" />,
      label: "Çatdırılma vaxtı",
      value: `${RESTAURANT_INFO.minTime}–${RESTAURANT_INFO.maxTime} dəq`,
    },
  ];

  return (
    <CardShell>
      <CardHeader
        icon={<IconDot><Truck size={15} className="text-primary" /></IconDot>}
        title="Çatdırılma"
      />
      <div className="divide-y divide-border-light">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
            <IconDot size="xs">{row.icon}</IconDot>
            <span className="flex-1 text-[13px] text-text-secondary">
              {row.label}
            </span>
            <span className="text-[13px] font-semibold text-text-primary">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
