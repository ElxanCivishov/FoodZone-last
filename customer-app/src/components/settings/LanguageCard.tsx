import IconDot from "@/components/ui/IconDot";
import SectionLabel from "@/components/ui/SectionLabel";
import { LANG_CODES } from "@/utils/lang";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { SPRING } from "./constants";
import { useT } from "@/hooks/useT";

const LANG_LABELS: Record<string, string> = {
  az: "Azərbaycan",
  en: "English",
  ru: "Русский",
  tr: "Türkçe",
};

export default function LanguageCard({
  language,
  onOpen,
}: {
  language: string;
  onOpen: () => void;
}) {
  const t = useT();

  return (
    <div>
      <SectionLabel>{t.settings.language}</SectionLabel>
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, ...SPRING }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpen}
        className="w-full bg-white rounded-2xl border border-border-light shadow-xs px-4 py-3.5 flex items-center gap-3"
      >
        <IconDot><Globe size={16} className="text-primary" /></IconDot>
        <div className="flex-1 text-left">
          <p className="text-[14px] font-medium text-text-primary">{t.settings.languageChoice}</p>
          <p className="text-[12px] text-text-secondary">
            {LANG_LABELS[language] ?? "Azərbaycan"}
          </p>
        </div>
        <span className="text-[13px] font-bold text-primary bg-primary-light rounded-full px-2.5 py-0.5">
          {LANG_CODES[language] ?? "AZ"}
        </span>
      </motion.button>
    </div>
  );
}
