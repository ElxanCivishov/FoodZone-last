import IconDot from "@/components/ui/IconDot";
import SectionLabel from "@/components/ui/SectionLabel";
import CardShell from "@/components/ui/CardShell";
import SettingsRow from "@/components/ui/SettingsRow";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { type NotifPermission, SPRING } from "./constants";
import Toggle from "./Toggle";
import { useT } from "@/hooks/useT";

function PermissionBanner({ permission }: { permission: NotifPermission }) {
  const t = useT();

  if (permission === "granted" || permission === "default") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div
          className={`flex items-start gap-3 p-3.5 rounded-xl mb-1 ${
            permission === "denied"
              ? "bg-error/8 border border-error/20"
              : "bg-warning/8 border border-warning/20"
          }`}
        >
          <AlertTriangle
            size={16}
            className={`shrink-0 mt-0.5 ${permission === "denied" ? "text-error" : "text-warning"}`}
          />
          <div>
            {permission === "denied" ? (
              <>
                <p className="text-[13px] font-semibold text-error">
                  {t.settings.permissionDenied}
                </p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  {t.settings.permissionDeniedText}
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-warning">
                  {t.settings.unsupported}
                </p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  {t.settings.unsupportedText}
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

type Settings = {
  pushNotif: boolean;
  waiterUpdates: boolean;
  orderUpdates: boolean;
  promos: boolean;
};

export default function NotificationsCard() {
  const t = useT();
  const [permission, setPermission] = useState<NotifPermission>("default");
  const [settings, setSettings] = useState<Settings>({
    pushNotif: false,
    waiterUpdates: true,
    orderUpdates: true,
    promos: false,
  });

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    const p = Notification.permission as NotifPermission;
    setPermission(p);
    if (p === "granted") setSettings((s) => ({ ...s, pushNotif: true }));
  }, []);

  const handlePushToggle = async () => {
    if (!("Notification" in window)) return;

    if (settings.pushNotif) {
      setSettings((s) => ({ ...s, pushNotif: false }));
      return;
    }

    if (Notification.permission === "granted") {
      setSettings((s) => ({ ...s, pushNotif: true }));
      return;
    }

    if (Notification.permission === "denied") {
      setPermission("denied");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result as NotifPermission);
    if (result === "granted") {
      setSettings((s) => ({ ...s, pushNotif: true }));
    }
  };

  const isPushDisabled = permission === "denied" || permission === "unsupported";

  const toggle = (key: keyof Settings) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  };
  const subRows = [
    {
      key: "waiterUpdates" as const,
      label: t.settings.waiterStatus,
      sub: t.settings.waiterStatusSub,
    },
    {
      key: "orderUpdates" as const,
      label: t.settings.orderStatus,
      sub: t.settings.orderStatusSub,
    },
    {
      key: "promos" as const,
      label: t.settings.promos,
      sub: t.settings.promosSub,
    },
  ];

  return (
    <div>
      <SectionLabel>{t.settings.notifications}</SectionLabel>

      <PermissionBanner permission={permission} />

      <CardShell shadow>
        {/* Push toggle */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, ...SPRING }}
        >
          <SettingsRow
            border
            icon={
              <IconDot bg={permission === "denied" ? "bg-error/10" : "bg-primary-light"}>
                {permission === "denied" ? (
                  <BellOff size={16} className="text-error" />
                ) : (
                  <Bell size={16} className="text-primary" />
                )}
              </IconDot>
            }
            label={t.settings.pushNotifications}
            sub={
              permission === "granted" && settings.pushNotif
                ? t.settings.active
                : permission === "granted" && !settings.pushNotif
                  ? t.settings.disabled
                  : permission === "denied"
                    ? t.settings.blocked
                    : permission === "default"
                      ? t.settings.permissionRequired
                      : t.settings.browserUnsupported
            }
            right={
              <Toggle
                on={settings.pushNotif}
                onToggle={handlePushToggle}
                disabled={isPushDisabled}
              />
            }
          />
        </motion.div>

        {/* Sub-toggles */}
        {subRows.map(({ key, label, sub }, i) => {
          const isOn = settings[key];
          const disabled = !settings.pushNotif || isPushDisabled;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05, ...SPRING }}
            >
              <SettingsRow
                border={i < subRows.length - 1}
                icon={
                  <IconDot>
                    <Bell
                      size={16}
                      className={disabled ? "text-text-tertiary" : "text-primary"}
                    />
                  </IconDot>
                }
                label={label}
                labelClass={disabled ? "text-text-tertiary" : undefined}
                sub={sub}
                right={
                  <Toggle
                    on={isOn && !disabled}
                    onToggle={() => !disabled && toggle(key)}
                    disabled={disabled}
                  />
                }
              />
            </motion.div>
          );
        })}
      </CardShell>
    </div>
  );
}
