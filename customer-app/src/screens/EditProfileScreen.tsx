import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Mail, Save } from 'lucide-react';
import { useUIStore } from '@/store';
import PhoneInput, { DEFAULT_COUNTRY } from '@/components/PhoneInput';
import type { Country } from '@/components/PhoneInput';
import { useT } from '@/hooks/useT';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

function initials(name: string) {
  return name.trim().split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || 'Q';
}

export default function EditProfileScreen() {
  const t = useT();
  const { goBack, userInfo, setUserInfo, addToast } = useUIStore();

  const [form, setForm] = useState({
    name:  userInfo?.name  ?? '',
    phone: userInfo?.phone ?? '',
    email: userInfo?.email ?? '',
  });
  const [phoneCountry, setPhoneCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: 'name' | 'email') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = t.editProfile.nameRequired;
    if (!form.phone.trim()) e.phone = t.editProfile.phoneRequired;
    if (!form.email.trim()) e.email = t.editProfile.emailRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const fullPhone = form.phone ? `${phoneCountry.prefix} ${form.phone}` : '';
    setUserInfo({ name: form.name, phone: fullPhone, email: form.email });
    addToast(t.editProfile.updated, 'success');
    goBack();
  };

  const preview = initials(form.name || userInfo?.name || 'Q');

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div
        className="relative px-4 pt-12 pb-10 shrink-0 overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#0f0c29 0%,#302b63 55%,#24243e 100%)' }}
      >
        <div className="absolute -top-10 right-0 w-48 h-48 opacity-20"
          style={{ background: 'radial-gradient(circle,#00c2e8,transparent 65%)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.88 }} onClick={goBack}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <ChevronLeft size={20} className="text-white" />
          </motion.button>
          <div>
            <h1 className="font-outfit text-[19px] font-bold text-white">{t.editProfile.title}</h1>
            <p className="text-white/50 text-[12px] mt-0.5">{t.editProfile.subtitle}</p>
          </div>
        </div>

        {/* Avatar preview */}
        <div className="relative z-10 flex justify-center mt-5">
          <div className="w-20 h-20 rounded-full p-[3px]"
            style={{ background: 'linear-gradient(135deg,#00c2e8,#a78bfa,#f59e0b)' }}>
            <div className="w-full h-full rounded-full bg-[#191540] flex items-center justify-center">
              <span className="font-outfit text-[24px] font-black text-white tracking-tighter select-none">
                {preview}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form + Danger zone (scrollable) */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5 pb-28 space-y-4">

        {/* Name */}
        <div>
          <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">{t.auth.fullName} *</label>
          <div className="relative">
            <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder={t.auth.fullNamePlaceholder}
              value={form.name}
              onChange={update('name')}
              className={`w-full pl-11 pr-4 h-12 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                errors.name ? 'border-coral bg-coral/5' : 'border-border-light bg-white'
              }`}
            />
          </div>
          {errors.name && <p className="text-coral text-[11px] mt-1">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">{t.auth.phone} *</label>
          <PhoneInput
            value={form.phone}
            country={phoneCountry}
            onCountryChange={setPhoneCountry}
            onChange={(v) => setForm(p => ({ ...p, phone: v }))}
            error={errors.phone}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">{t.auth.email} *</label>
          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="email"
              placeholder="example@mail.com"
              value={form.email}
              onChange={update('email')}
              className={`w-full pl-11 pr-4 h-12 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                errors.email ? 'border-coral bg-coral/5' : 'border-border-light bg-white'
              }`}
            />
          </div>
          {errors.email && <p className="text-coral text-[11px] mt-1">{errors.email}</p>}
        </div>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow"
          style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
        >
          <Save size={15} />
          {t.common.save}
        </motion.button>

      </div>

    </motion.div>
  );
}
