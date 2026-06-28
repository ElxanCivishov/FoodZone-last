import IconDot from "@/components/ui/IconDot";
import SectionLabel from "@/components/ui/SectionLabel";
import CardShell from "@/components/ui/CardShell";
import SettingsRow from "@/components/ui/SettingsRow";
import { Info, Shield } from "lucide-react";
import { useT } from "@/hooks/useT";

export default function AppInfoCard() {
  const t = useT();

  return (
    <div>
      <SectionLabel>{t.settings.app}</SectionLabel>
      <CardShell shadow>
        <SettingsRow
          border
          icon={<IconDot><Info size={16} className="text-primary" /></IconDot>}
          label={t.settings.version}
          sub="FoodZone v1.0.0"
        />
        <SettingsRow
          icon={<IconDot><Shield size={16} className="text-primary" /></IconDot>}
          label={t.settings.privacy}
          sub={t.settings.privacySub}
        />
      </CardShell>
    </div>
  );
}
