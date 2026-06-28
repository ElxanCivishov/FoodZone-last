import CardHeader from "@/components/ui/CardHeader";
import CardShell from "@/components/ui/CardShell";
import IconDot from "@/components/ui/IconDot";
import { RESTAURANT_INFO } from "@/data/restaurantInfo";
import { Info } from "lucide-react";

export default function AboutCard() {
  return (
    <CardShell>
      <CardHeader
        icon={<IconDot><Info size={15} className="text-primary" /></IconDot>}
        title="Haqqımızda"
      />

      <div className="px-4 py-4">
        <p className="text-[13px] text-text-secondary leading-[1.65]">
          {RESTAURANT_INFO.about}
        </p>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-light">
          <div className="flex-1 text-center">
            <p className="font-outfit text-[18px] font-bold text-primary">
              {RESTAURANT_INFO.founded}
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">İl</p>
          </div>
          <div className="w-px h-10 bg-border-light" />
          <div className="flex-1 text-center">
            <p className="font-outfit text-[18px] font-bold text-primary">
              {RESTAURANT_INFO.tableCount}
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">Masa</p>
          </div>
          <div className="w-px h-10 bg-border-light" />
          <div className="flex-1 text-center">
            <p className="font-outfit text-[18px] font-bold text-primary">
              {RESTAURANT_INFO.reviewCount}+
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">Rəy</p>
          </div>
        </div>
      </div>
    </CardShell>
  );
}
