import IconDot from "@/components/ui/IconDot";
import SectionLabel from "@/components/ui/SectionLabel";
import CardShell from "@/components/ui/CardShell";
import SettingsRow from "@/components/ui/SettingsRow";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { type NotifPermission, SPRING } from "./constants";
import Toggle from "./Toggle";

function PermissionBanner({ permission }: { permission: NotifPermission }) {
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
                  Bildiriş icazəsi rədd edilib
                </p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  Brauzer tənzimləmələrindən bu sayt üçün bildirişlərə icazə
                  verin.
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-warning">
                  Bildirişlər dəstəklənmir
                </p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  Bu brauzer push bildirişlərini dəstəkləmir.
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

const SUB_ROWS = [
  {
    key: "waiterUpdates" as const,
    label: "Ofisiant statusu",
    sub: "Müraciət qəbul/cavab bildirişi",
  },
  {
    key: "orderUpdates" as const,
    label: "Sifariş statusu",
    sub: "Hazırlanma, servis bildirişi",
  },
  {
    key: "promos" as const,
    label: "Kampaniyalar",
    sub: "Endirim və xüsusi təkliflər",
  },
];

type Settings = {
  pushNotif: boolean;
  waiterUpdates: boolean;
  orderUpdates: boolean;
  promos: boolean;
};

export default function NotificationsCard() {
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

  return (
    <div>
      <SectionLabel>Bildirişlər</SectionLabel>

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
            label="Push bildirişlər"
            sub={
              permission === "granted" && settings.pushNotif
                ? "Aktiv"
                : permission === "granted" && !settings.pushNotif
                  ? "Söndürülüb"
                  : permission === "denied"
                    ? "Brauzer tərəfindən blok edilib"
                    : permission === "default"
                      ? "İcazə tələb olunur"
                      : "Brauzer dəstəkləmir"
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
        {SUB_ROWS.map(({ key, label, sub }, i) => {
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
                border={i < SUB_ROWS.length - 1}
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
