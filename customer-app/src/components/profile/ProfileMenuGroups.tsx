import CardShell from "@/components/ui/CardShell";
import IconDot from "@/components/ui/IconDot";
import SectionLabel from "@/components/ui/SectionLabel";
import { LANG_CODES } from "@/utils/lang";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { GROUPS, SPRING, type MenuItem } from "./constants";
import { useT } from "@/hooks/useT";

interface ProfileMenuGroupsProps {
  language: string;
  onItem: (item: MenuItem) => void;
}

export default function ProfileMenuGroups({
  language,
  onItem,
}: ProfileMenuGroupsProps) {
  let delay = 0.08;
  const t = useT();
  const profileText = t.profile as Record<string, string>;

  return (
    <>
      {GROUPS.map((group) => (
        <div key={group.titleKey}>
          <SectionLabel size="xs">{profileText[group.titleKey]}</SectionLabel>
          <CardShell shadow>
            {group.items.map((item, i) => {
              const Icon = item.icon;
              const isLang = item.action === "language";
              const d = (delay += 0.04);
              return (
                <motion.button
                  key={item.labelKey}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: d, ...SPRING }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onItem(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-elevated ${
                    i < group.items.length - 1
                      ? "border-b border-border-light"
                      : ""
                  }`}
                >
                  <IconDot>
                    <Icon size={16} className="text-primary" />
                  </IconDot>
                  <span className="flex-1 text-[15px] font-medium text-text-primary">
                    {profileText[item.labelKey]}
                  </span>
                  {isLang ? (
                    <span className="text-[12px] font-bold text-primary bg-primary-light rounded-full px-2 py-0.5">
                      {LANG_CODES[language] ?? "AZ"}
                    </span>
                  ) : (
                    <ChevronRight size={16} className="text-text-tertiary" />
                  )}
                </motion.button>
              );
            })}
          </CardShell>
        </div>
      ))}
    </>
  );
}
