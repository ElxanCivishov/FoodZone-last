import { ChevronRight } from "lucide-react";
import { useT } from "@/hooks/useT";

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
}

export default function SectionHeader({ title, onViewAll }: SectionHeaderProps) {
  const t = useT();

  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-3">
      <h2 className="font-outfit text-[17px] font-bold text-text-primary tracking-[-0.4px]">
        {title}
      </h2>
      <button
        onClick={onViewAll}
        className="flex items-center gap-1 text-primary text-xs font-semibold"
      >
        {t.home.seeAll} <ChevronRight size={13} />
      </button>
    </div>
  );
}
