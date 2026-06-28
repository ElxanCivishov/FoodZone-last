import IconDot from "@/components/ui/IconDot";
import SectionLabel from "@/components/ui/SectionLabel";
import CardShell from "@/components/ui/CardShell";
import SettingsRow from "@/components/ui/SettingsRow";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useT } from "@/hooks/useT";
import { motion } from "framer-motion";
import { CheckCircle2, Download, Info, Share, Shield } from "lucide-react";

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isIOSSafari =
  isIOS && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export default function AppInfoCard() {
  const t = useT();
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();

  const showInstall = !isInstalled && (canInstall || isIOSSafari);

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

        {isInstalled ? (
          <SettingsRow
            border
            icon={<IconDot><CheckCircle2 size={16} className="text-success" /></IconDot>}
            label={t.settings.installed}
            sub={t.settings.installedSub}
          />
        ) : showInstall ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={isIOSSafari ? undefined : promptInstall}
            className="w-full text-left border-b border-border-light"
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <IconDot>
                <Download size={16} className="text-primary" />
              </IconDot>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-text-primary">
                  {t.settings.installApp}
                </p>
                <p className="text-[12px] text-text-secondary flex items-center gap-1">
                  {isIOSSafari ? (
                    <><Share size={11} className="shrink-0" /> {t.settings.installAppIos}</>
                  ) : (
                    t.settings.installAppSub
                  )}
                </p>
              </div>
              {!isIOSSafari && (
                <span className="text-[12px] font-bold text-white bg-primary rounded-full px-3 py-1 shrink-0">
                  {t.pwa.install}
                </span>
              )}
            </div>
          </motion.button>
        ) : null}

        <SettingsRow
          icon={<IconDot><Shield size={16} className="text-primary" /></IconDot>}
          label={t.settings.privacy}
          sub={t.settings.privacySub}
        />
      </CardShell>
    </div>
  );
}
