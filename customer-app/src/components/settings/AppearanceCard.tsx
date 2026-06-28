import IconDot from "@/components/ui/IconDot";
import SectionLabel from "@/components/ui/SectionLabel";
import CardShell from "@/components/ui/CardShell";
import SettingsRow from "@/components/ui/SettingsRow";
import { motion } from "framer-motion";
import { Moon } from "lucide-react";
import { SPRING } from "./constants";
import Toggle from "./Toggle";
import { useT } from "@/hooks/useT";

export default function AppearanceCard({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: () => void;
}) {
  const t = useT();

  return (
    <div>
      <SectionLabel>{t.settings.appearance}</SectionLabel>
      <CardShell shadow>
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, ...SPRING }}
        >
          <SettingsRow
            icon={<IconDot><Moon size={16} className="text-primary" /></IconDot>}
            label={t.settings.darkMode}
            sub={t.settings.darkModeSub}
            right={<Toggle on={isDark} onToggle={onToggle} />}
          />
        </motion.div>
      </CardShell>
    </div>
  );
}
