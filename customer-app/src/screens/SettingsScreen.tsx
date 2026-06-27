import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Bell, Mail, Globe, Moon, Shield, Info, BellOff, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/store';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported';

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <motion.button
      onClick={onToggle}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition-colors duration-300 relative shrink-0 ${
        on ? 'bg-primary' : 'bg-border-light'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <motion.div
        animate={{ x: on ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </motion.button>
  );
}

function PermissionBanner({ permission }: { permission: NotifPermission }) {
  if (permission === 'granted' || permission === 'default') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className={`flex items-start gap-3 p-3.5 rounded-xl mb-1 ${
          permission === 'denied' ? 'bg-error/8 border border-error/20' : 'bg-warning/8 border border-warning/20'
        }`}>
          <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${permission === 'denied' ? 'text-error' : 'text-warning'}`} />
          <div>
            {permission === 'denied' ? (
              <>
                <p className="text-[13px] font-semibold text-error">Bildiriş icazəsi rədd edilib</p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  Brauzer tənzimləmələrindən bu sayt üçün bildirişlərə icazə verin.
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-warning">Bildirişlər dəstəklənmir</p>
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

export default function SettingsScreen() {
  const { goBack, openModal, language } = useUIStore();

  const LANG_LABELS: Record<string, string> = { az: 'Azərbaycan', en: 'English', ru: 'Русский', tr: 'Türkçe' };
  const LANG_CODES: Record<string, string> = { az: 'AZ', en: 'EN', ru: 'RU', tr: 'TR' };

  const [permission, setPermission] = useState<NotifPermission>('default');
  const [settings, setSettings] = useState({
    pushNotif: false,
    waiterUpdates: true,
    orderUpdates: true,
    promos: false,
    emailNotif: false,
    darkMode: false,
  });

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    const p = Notification.permission as NotifPermission;
    setPermission(p);
    if (p === 'granted') setSettings((s) => ({ ...s, pushNotif: true }));
  }, []);

  const toggle = (key: keyof typeof settings) => {
    if (key === 'pushNotif') {
      handlePushToggle();
      return;
    }
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  };

  const handlePushToggle = async () => {
    if (!('Notification' in window)) return;

    if (settings.pushNotif) {
      setSettings((s) => ({ ...s, pushNotif: false }));
      return;
    }

    if (Notification.permission === 'granted') {
      setSettings((s) => ({ ...s, pushNotif: true }));
      return;
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result as NotifPermission);
    if (result === 'granted') {
      setSettings((s) => ({ ...s, pushNotif: true }));
    }
  };

  const isPushDisabled = permission === 'denied' || permission === 'unsupported';

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-border-light flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={goBack}
          className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <h1 className="font-outfit text-[20px] font-bold text-text-primary">Tənzimləmələr</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 space-y-4">

        {/* Notifications */}
        <div>
          <p className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">Bildirişlər</p>

          <PermissionBanner permission={permission} />

          <div className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden">
            {/* Push toggle */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05, ...SPRING }}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-border-light"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                permission === 'denied' ? 'bg-error/10' : 'bg-primary-light'
              }`}>
                {permission === 'denied'
                  ? <BellOff size={16} className="text-error" />
                  : <Bell size={16} className="text-primary" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-text-primary">Push bildirişlər</p>
                <p className="text-[12px] text-text-secondary">
                  {permission === 'granted' && settings.pushNotif && 'Aktiv'}
                  {permission === 'granted' && !settings.pushNotif && 'Söndürülüb'}
                  {permission === 'denied' && 'Brauzer tərəfindən blok edilib'}
                  {permission === 'default' && 'İcazə tələb olunur'}
                  {permission === 'unsupported' && 'Brauzer dəstəkləmir'}
                </p>
              </div>
              <Toggle on={settings.pushNotif} onToggle={() => toggle('pushNotif')} disabled={isPushDisabled} />
            </motion.div>

            {/* Waiter status updates */}
            {[
              { key: 'waiterUpdates', icon: Bell, label: 'Ofisiant statusu',  sub: 'Müraciət qəbul/cavab bildirişi' },
              { key: 'orderUpdates',  icon: Bell, label: 'Sifariş statusu',   sub: 'Hazırlanma, servis bildirişi' },
              { key: 'promos',        icon: Bell, label: 'Kampaniyalar',      sub: 'Endirim və xüsusi təkliflər' },
            ].map(({ key, icon: Icon, label, sub }, i) => {
              const isOn = settings[key as keyof typeof settings];
              const disabled = !settings.pushNotif || isPushDisabled;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, ...SPRING }}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? 'border-b border-border-light' : ''}`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                    <Icon size={16} className={disabled ? 'text-text-tertiary' : 'text-primary'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-medium ${disabled ? 'text-text-tertiary' : 'text-text-primary'}`}>{label}</p>
                    <p className="text-[12px] text-text-secondary">{sub}</p>
                  </div>
                  <Toggle on={isOn && !disabled} onToggle={() => !disabled && toggle(key as keyof typeof settings)} disabled={disabled} />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* E-mail */}
        <div>
          <p className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">E-poçt</p>
          <div className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, ...SPRING }}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                <Mail size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-text-primary">E-poçt bildirişləri</p>
                <p className="text-[12px] text-text-secondary">Həftəlik xülasə</p>
              </div>
              <Toggle on={settings.emailNotif} onToggle={() => toggle('emailNotif')} />
            </motion.div>
          </div>
        </div>

        {/* Appearance */}
        <div>
          <p className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">Görünüş</p>
          <div className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, ...SPRING }}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                <Moon size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-text-primary">Qaranlıq rejim</p>
                <p className="text-[12px] text-text-secondary">Göz yorğunluğunu azaldır</p>
              </div>
              <Toggle on={settings.darkMode} onToggle={() => toggle('darkMode')} />
            </motion.div>
          </div>
        </div>

        {/* Language */}
        <div>
          <p className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">Dil</p>
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, ...SPRING }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal('language')}
            className="w-full bg-white rounded-2xl border border-border-light shadow-xs px-4 py-3.5 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
              <Globe size={16} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-medium text-text-primary">Dil seçimi</p>
              <p className="text-[12px] text-text-secondary">{LANG_LABELS[language] ?? 'Azərbaycan'}</p>
            </div>
            <span className="text-[13px] font-bold text-primary bg-primary-light rounded-full px-2.5 py-0.5">
              {LANG_CODES[language] ?? 'AZ'}
            </span>
          </motion.button>
        </div>

        {/* App info */}
        <div>
          <p className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">Tətbiq</p>
          <div className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-light">
              <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                <Info size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-text-primary">Versiya</p>
                <p className="text-[12px] text-text-secondary">FoodZone v1.0.0</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                <Shield size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-text-primary">Gizlilik siyasəti</p>
                <p className="text-[12px] text-text-secondary">Məlumatlarınız qorunur</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
