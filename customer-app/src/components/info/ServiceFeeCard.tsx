import CardShell from "@/components/ui/CardShell";
import IconDot from "@/components/ui/IconDot";
import { RESTAURANT_INFO } from "@/data/restaurantInfo";
import { Percent } from "lucide-react";

export default function ServiceFeeCard() {
  return (
    <CardShell>
      <div className="flex items-center gap-3 px-4 py-4">
        <IconDot><Percent size={15} className="text-primary" /></IconDot>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-text-primary">
            Servis haqqı
          </p>
          <p className="text-[12px] text-text-secondary mt-0.5">
            Hesaba {RESTAURANT_INFO.serviceFee}% xidmət haqqı əlavə olunur
          </p>
        </div>
        <span className="text-[15px] font-outfit font-bold text-primary shrink-0">
          {RESTAURANT_INFO.serviceFee}%
        </span>
      </div>
    </CardShell>
  );
}
