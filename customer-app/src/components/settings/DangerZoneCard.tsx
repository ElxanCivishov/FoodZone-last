import IconDot from "@/components/ui/IconDot";
import SectionLabel from "@/components/ui/SectionLabel";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useT } from "@/hooks/useT";

export default function DangerZoneCard({ onDelete }: { onDelete: () => void }) {
  const t = useT();

  return (
    <div>
      <SectionLabel>{t.settings.dangerZone}</SectionLabel>
      <div className="bg-white rounded-2xl border border-red-100 shadow-xs overflow-hidden">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onDelete}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-red-50 transition-colors"
        >
          <IconDot bg="bg-red-100">
            <Trash2 size={16} className="text-red-500" />
          </IconDot>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-red-500">{t.settings.deleteProfile}</p>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              {t.settings.deleteProfileSub}
            </p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
