import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useUIStore } from "@/store";
import PhoneInput, { DEFAULT_COUNTRY } from "@/components/PhoneInput";
import type { Country } from "@/components/PhoneInput";
import { useT } from "@/hooks/useT";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

type Mode = "login" | "register";

export default function LoginScreen() {
  const { goBack, setScreen, addToast, login, isDark } = useUIStore();
  const t = useT();
  const [mode, setMode] = useState<Mode>("login");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [phoneCountry, setPhoneCountry] = useState<Country>(DEFAULT_COUNTRY);

  const update =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      name: form.name || t.auth.defaultUser,
      phone: form.phone ? `${phoneCountry.prefix} ${form.phone}` : "",
      email: form.email,
      address: "",
    });
    addToast(
      mode === "login" ? t.auth.loginSuccess : t.auth.registerSuccess,
      "success",
    );
    setScreen("home");
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={SPRING}
      className="absolute inset-0 flex flex-col overflow-x-hidden overflow-y-auto no-scrollbar"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)"
          : "linear-gradient(135deg, #00c2e8 0%, #00c2a8 100%)",
      }}
    >
      {/* Deco circles */}
      <div className="absolute -top-[20%] -right-[20%] w-[280px] h-[280px] rounded-full bg-white/10" />
      <div className="absolute -bottom-[15%] -left-[15%] w-[220px] h-[220px] rounded-full bg-white/8" />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.88 }}
        onClick={goBack}
        className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-20"
      >
        <ChevronLeft size={20} className="text-white" />
      </motion.button>

      {/* Logo area */}
      <div className="flex flex-col items-center justify-center pt-20 pb-8 relative z-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.1,
            type: "spring",
            stiffness: 300,
            damping: 18,
          }}
          className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-4"
        >
          <svg width="44" height="44" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill="#e0f8ff" />
            <path
              d="M16 36c0-6.627 5.373-12 12-12s12 5.373 12 12"
              stroke="#00c2e8"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="28" cy="20" r="5" fill="#00c2e8" />
            <path
              d="M22 36h12M19 40h18"
              stroke="#00c2a8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-white font-outfit text-3xl font-bold tracking-[-1px]"
        >
          FoodZone
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-white/75 text-[13px] mt-1"
        >
          {mode === "login" ? t.auth.loginSubtitle : t.auth.registerSubtitle}
        </motion.p>
      </div>

      {/* Card */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, ...SPRING }}
        className="mx-4 mb-8 rounded-3xl bg-white dark:bg-[#1a1a2e] p-6 shadow-xl relative z-10"
      >
        {/* Mode toggle */}
        <div className="flex bg-surface-elevated dark:bg-[#22223a] rounded-xl p-1 mb-6">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === m
                  ? "bg-primary text-white shadow-primary-glow"
                  : "text-text-secondary"
              }`}
            >
              {m === "login" ? t.auth.login : t.auth.register}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register-only fields */}
          <AnimatePresence>
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Name */}
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">
                    {t.auth.fullName}
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                    />
                    <input
                      type="text"
                      required
                      placeholder={t.auth.fullNamePlaceholder}
                      value={form.name}
                      onChange={update("name")}
                      className="w-full pl-11 pr-4 py-3.5 bg-surface-elevated dark:bg-[#22223a] rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">
                    {t.auth.phone}
                  </label>
                  <PhoneInput
                    value={form.phone}
                    country={phoneCountry}
                    onCountryChange={setPhoneCountry}
                    onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">
              {t.auth.email}
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
              />
              <input
                type="email"
                required
                placeholder="example@mail.com"
                value={form.email}
                onChange={update("email")}
                className="w-full pl-11 pr-4 py-3.5 bg-surface-elevated dark:bg-[#22223a] rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">
              {t.auth.password}
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
              />
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="••••••••"
                value={form.password}
                onChange={update("password")}
                className="w-full pl-11 pr-12 py-3.5 bg-surface-elevated dark:bg-[#22223a] rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-4 rounded-xl font-semibold text-[15px] text-white shadow-primary-glow mt-2"
            style={{ background: "linear-gradient(135deg, #00c2e8, #00c2a8)" }}
          >
            {mode === "login" ? t.auth.login : t.auth.createAccount}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-text-tertiary font-medium">
            {t.auth.or}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Guest */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setScreen("home")}
          className="w-full py-3.5 rounded-xl text-[14px] font-semibold text-text-secondary dark:text-white/60 border-2 border-border dark:border-white/10 hover:border-primary hover:text-primary transition-colors"
        >
          {t.auth.continueAsGuest}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
