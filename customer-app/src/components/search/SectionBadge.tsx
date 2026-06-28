import { GROUP_ICONS } from "./constants";
import { useT } from "@/hooks/useT";

interface SectionBadgeProps {
  label: string;
  icon?: string;
  count: number;
}

export default function SectionBadge({ label, icon, count }: SectionBadgeProps) {
  const t = useT();
  const Icon = icon ? GROUP_ICONS[icon] : null;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light">
        {Icon && <Icon size={13} className="text-primary" />}
        <span className="text-[13px] font-bold text-primary">{label}</span>
      </div>
      <span className="text-[12px] text-text-tertiary font-medium">
        {count} {t.common.item}
      </span>
      <div className="flex-1 h-px bg-border-light" />
    </div>
  );
}
