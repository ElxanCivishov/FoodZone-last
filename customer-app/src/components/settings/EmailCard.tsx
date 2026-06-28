import IconDot from "@/components/ui/IconDot";
import SectionLabel from "@/components/ui/SectionLabel";
import CardShell from "@/components/ui/CardShell";
import SettingsRow from "@/components/ui/SettingsRow";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { SPRING } from "./constants";
import Toggle from "./Toggle";

export default function EmailCard({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <SectionLabel>E-poçt</SectionLabel>
      <CardShell shadow>
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, ...SPRING }}
        >
          <SettingsRow
            icon={<IconDot><Mail size={16} className="text-primary" /></IconDot>}
            label="E-poçt bildirişləri"
            sub="Həftəlik xülasə"
            right={<Toggle on={checked} onToggle={onToggle} />}
          />
        </motion.div>
      </CardShell>
    </div>
  );
}
