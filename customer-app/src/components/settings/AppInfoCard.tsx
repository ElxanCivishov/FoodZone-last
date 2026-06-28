import IconDot from "@/components/ui/IconDot";
import SectionLabel from "@/components/ui/SectionLabel";
import CardShell from "@/components/ui/CardShell";
import SettingsRow from "@/components/ui/SettingsRow";
import { Info, Shield } from "lucide-react";

export default function AppInfoCard() {
  return (
    <div>
      <SectionLabel>Tətbiq</SectionLabel>
      <CardShell shadow>
        <SettingsRow
          border
          icon={<IconDot><Info size={16} className="text-primary" /></IconDot>}
          label="Versiya"
          sub="FoodZone v1.0.0"
        />
        <SettingsRow
          icon={<IconDot><Shield size={16} className="text-primary" /></IconDot>}
          label="Gizlilik siyasəti"
          sub="Məlumatlarınız qorunur"
        />
      </CardShell>
    </div>
  );
}
