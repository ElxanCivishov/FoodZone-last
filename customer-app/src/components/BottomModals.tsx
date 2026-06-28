import { RESTAURANT_INFO } from "@/data/restaurantInfo";
import { useT } from "@/hooks/useT";
import { useUIStore, useWaiterRequestStore } from "@/store";
import type { Language } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Droplets,
  HelpCircle,
  Monitor,
  Moon,
  ScrollText,
  Send,
  Sparkles,
  Star,
  Sun,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };

const LANGUAGES = [
  { code: "az", label: "Azərbaycan", flag: "🇦🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

const COLOR_MODES = [
  { id: "light", label: "Açıq", icon: Sun },
  { id: "dark", label: "Tünd", icon: Moon },
  { id: "system", label: "Sistem", icon: Monitor },
];

const WAITERS = [
  { id: 1, name: "Əli Həsənov", emoji: "👨" },
  { id: 2, name: "Nigar Əliyeva", emoji: "👩" },
  { id: 3, name: "Kamran Quliyev", emoji: "👨" },
  { id: 4, name: "Aytən Məmmədova", emoji: "👩" },
];

export default function BottomModals() {
  const { activeModal, closeModal, addToast } = useUIStore();
  const t = useT();

  return (
    <AnimatePresence>
      {activeModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeModal}
            className="absolute inset-0 z-[300] modal-backdrop"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING}
            className="absolute bottom-0 left-0 right-0 z-[301] rounded-t-3xl shadow-modal overflow-hidden bg-white"
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            {activeModal === "wifi" && (
              <WifiSheet close={closeModal} addToast={addToast} />
            )}
            {activeModal === "language" && <LangSheet close={closeModal} />}
            {activeModal === "hours" && <HoursSheet close={closeModal} />}
            {activeModal === "colorMode" && (
              <ColorSheet close={closeModal} addToast={addToast} />
            )}
            {activeModal === "feedback" && (
              <FeedbackSheet close={closeModal} addToast={addToast} />
            )}
            {activeModal === "waiterCall" && (
              <WaiterCallSheet close={closeModal} t={t} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Shared header ─── */
function ModalHeader({ title, close }: { title: string; close: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 pb-4 border-b border-border-light">
      <h3 className="font-outfit text-lg font-bold text-text-primary">
        {title}
      </h3>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={close}
        className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center"
      >
        <X size={16} className="text-text-secondary" />
      </motion.button>
    </div>
  );
}

/* ─── WiFi ─── */
function WifiSheet({
  close,
  addToast,
}: {
  close: () => void;
  addToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  return (
    <div className="pb-8 pt-2">
      <ModalHeader title="WiFi Məlumatı" close={close} />
      <div className="mt-4 px-5">
        <WifiNetworkPicker addToast={addToast} />
      </div>
    </div>
  );
}

function QRPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Top-left corner */}
        <rect x="4" y="4" width="28" height="28" rx="3" fill="#111827" />
        <rect x="8" y="8" width="20" height="20" rx="2" fill="white" />
        <rect x="12" y="12" width="12" height="12" rx="1.5" fill="#111827" />
        {/* Top-right corner */}
        <rect x="68" y="4" width="28" height="28" rx="3" fill="#111827" />
        <rect x="72" y="8" width="20" height="20" rx="2" fill="white" />
        <rect x="76" y="12" width="12" height="12" rx="1.5" fill="#111827" />
        {/* Bottom-left corner */}
        <rect x="4" y="68" width="28" height="28" rx="3" fill="#111827" />
        <rect x="8" y="72" width="20" height="20" rx="2" fill="white" />
        <rect x="12" y="76" width="12" height="12" rx="1.5" fill="#111827" />
        {/* Data dots – top */}
        <rect x="38" y="4" width="4" height="4" rx="1" fill="#111827" />
        <rect x="46" y="4" width="4" height="4" rx="1" fill="#111827" />
        <rect x="54" y="4" width="4" height="4" rx="1" fill="#111827" />
        <rect x="62" y="4" width="4" height="4" rx="1" fill="#111827" />
        <rect x="38" y="12" width="4" height="4" rx="1" fill="#111827" />
        <rect x="54" y="12" width="4" height="4" rx="1" fill="#111827" />
        <rect x="46" y="20" width="4" height="4" rx="1" fill="#111827" />
        <rect x="62" y="20" width="4" height="4" rx="1" fill="#111827" />
        {/* Data dots – left */}
        <rect x="4" y="38" width="4" height="4" rx="1" fill="#111827" />
        <rect x="4" y="46" width="4" height="4" rx="1" fill="#111827" />
        <rect x="4" y="54" width="4" height="4" rx="1" fill="#111827" />
        <rect x="4" y="62" width="4" height="4" rx="1" fill="#111827" />
        <rect x="12" y="38" width="4" height="4" rx="1" fill="#111827" />
        <rect x="20" y="46" width="4" height="4" rx="1" fill="#111827" />
        <rect x="12" y="54" width="4" height="4" rx="1" fill="#111827" />
        <rect x="20" y="62" width="4" height="4" rx="1" fill="#111827" />
        {/* Data dots – center/right */}
        <rect x="38" y="38" width="4" height="4" rx="1" fill="#111827" />
        <rect x="50" y="38" width="4" height="4" rx="1" fill="#111827" />
        <rect x="62" y="38" width="4" height="4" rx="1" fill="#111827" />
        <rect x="74" y="38" width="4" height="4" rx="1" fill="#111827" />
        <rect x="86" y="38" width="4" height="4" rx="1" fill="#111827" />
        <rect x="38" y="50" width="4" height="4" rx="1" fill="#111827" />
        <rect x="62" y="50" width="4" height="4" rx="1" fill="#111827" />
        <rect x="86" y="50" width="4" height="4" rx="1" fill="#111827" />
        <rect x="38" y="62" width="4" height="4" rx="1" fill="#111827" />
        <rect x="50" y="62" width="4" height="4" rx="1" fill="#111827" />
        <rect x="74" y="62" width="4" height="4" rx="1" fill="#111827" />
        <rect x="50" y="74" width="4" height="4" rx="1" fill="#111827" />
        <rect x="62" y="74" width="4" height="4" rx="1" fill="#111827" />
        <rect x="86" y="74" width="4" height="4" rx="1" fill="#111827" />
        <rect x="38" y="86" width="4" height="4" rx="1" fill="#111827" />
        <rect x="74" y="86" width="4" height="4" rx="1" fill="#111827" />
        <rect x="86" y="86" width="4" height="4" rx="1" fill="#111827" />
        {/* Center logo */}
        <rect x="40" y="40" width="20" height="20" rx="4" fill="#00c2e8" />
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fill="white"
          fontSize="8"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          {label.slice(0, 2).toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

/* ─── Shared WiFi network picker (used in WifiSheet + InfoSheet) ─── */
function WifiNetworkPicker({
  addToast,
  compact = false,
}: {
  addToast: (m: string, t?: "success" | "error" | "info") => void;
  compact?: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copiedField, setCopiedField] = useState<"name" | "pass" | null>(null);
  const net = RESTAURANT_INFO.wifiNetworks[activeIdx];

  const copyField = (field: "name" | "pass") => {
    const val = field === "name" ? net.ssid : net.pass;
    navigator.clipboard.writeText(val).catch(() => {});
    setCopiedField(field);
    addToast(
      field === "name" ? "Şəbəkə adı kopyalandı!" : "Şifrə kopyalandı!",
      "success",
    );
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div>
      {/* Header row: label + numbered tabs */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[13px] font-semibold text-text-secondary">
          {net.label}
        </p>
        <div className="flex gap-1.5">
          {RESTAURANT_INFO.wifiNetworks.map((_, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                setActiveIdx(idx);
                setCopiedField(null);
              }}
              className={`w-7 h-7 rounded-full text-[12px] font-bold transition-all flex items-center justify-center ${
                activeIdx === idx
                  ? "bg-primary text-white shadow-primary-glow"
                  : "bg-surface-elevated text-text-secondary border border-border-light"
              }`}
            >
              {idx + 1}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {/* QR – only in full WifiSheet */}
          {!compact && (
            <div className="flex flex-col items-center mb-5">
              <div className="w-44 h-44 bg-surface-elevated border border-border-light rounded-2xl p-3 flex items-center justify-center mb-2.5">
                <QRPlaceholder label={net.ssid} />
              </div>
              <p className="text-text-tertiary text-[12px]">
                Scan QR or manually copy the password
              </p>
            </div>
          )}

          {/* Field rows */}
          <div className="space-y-2">
            <WifiFieldRow
              label="Name"
              value={net.ssid}
              copied={copiedField === "name"}
              onCopy={() => copyField("name")}
            />
            <WifiFieldRow
              label="Password"
              value={net.pass}
              copied={copiedField === "pass"}
              onCopy={() => copyField("pass")}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function WifiFieldRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="bg-surface-elevated border border-border-light rounded-2xl px-4 py-3.5 flex items-center justify-between">
      <div>
        <p className="text-text-tertiary text-[11px] font-semibold mb-0.5">
          {label}
        </p>
        <p className="text-text-primary text-[15px] font-semibold">{value}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.82 }}
        onClick={onCopy}
        className="w-9 h-9 rounded-full bg-white border border-border-light flex items-center justify-center ml-3 shrink-0"
      >
        {copied ? (
          <CheckCircle2 size={16} className="text-success" />
        ) : (
          <Copy size={15} className="text-text-tertiary" />
        )}
      </motion.button>
    </div>
  );
}

/* ─── Language ─── */
function LangSheet({ close }: { close: () => void }) {
  const { language, setLanguage } = useUIStore();

  const pick = (code: Language) => {
    setLanguage(code);
    setTimeout(close, 500);
  };

  return (
    <div className="px-5 pb-8 pt-2">
      <ModalHeader title="Dil seçimi / Language" close={close} />
      <div className="mt-4 space-y-2">
        {LANGUAGES.map((lang) => {
          const active = language === lang.code;
          return (
            <motion.button
              key={lang.code}
              whileTap={{ scale: 0.98 }}
              onClick={() => pick(lang.code as Language)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                active
                  ? "border-primary bg-primary-light"
                  : "border-transparent bg-surface-elevated"
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span
                className={`flex-1 text-[15px] font-semibold text-left ${active ? "text-primary" : "text-text-primary"}`}
              >
                {lang.label}
              </span>
              {active && <CheckCircle2 size={18} className="text-primary" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Hours ─── */
function HoursSheet({ close }: { close: () => void }) {
  const today = new Date().getDay();
  const HOURS = [
    { day: "Bazar ertəsi", time: "10:00 – 22:00", idx: 1 },
    { day: "Çərşənbə axşamı", time: "10:00 – 22:00", idx: 2 },
    { day: "Çərşənbə", time: "10:00 – 22:00", idx: 3 },
    { day: "Cümə axşamı", time: "10:00 – 22:00", idx: 4 },
    { day: "Cümə", time: "10:00 – 22:00", idx: 5 },
    { day: "Şənbə", time: "11:00 – 23:00", idx: 6 },
    { day: "Bazar", time: "11:00 – 23:00", idx: 0 },
  ];

  return (
    <div className="px-5 pb-8 pt-2">
      <ModalHeader title="İş Saatları" close={close} />
      <div className="mt-4 space-y-1">
        {HOURS.map((h) => {
          const isToday = h.idx === today;
          return (
            <div
              key={h.day}
              className={`flex justify-between items-center py-3 px-3 rounded-xl ${isToday ? "bg-primary-light" : ""}`}
            >
              <div className="flex items-center gap-2">
                {isToday && <Clock size={14} className="text-primary" />}
                <span
                  className={`text-[14px] font-medium ${isToday ? "text-primary" : "text-text-secondary"}`}
                >
                  {h.day}
                  {isToday && (
                    <span className="ml-1.5 text-[11px] font-bold bg-primary text-white rounded-full px-2 py-0.5">
                      Bu gün
                    </span>
                  )}
                </span>
              </div>
              <span
                className={`text-[14px] font-semibold ${isToday ? "text-primary" : "text-text-primary"}`}
              >
                {h.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Color Mode ─── */
function ColorSheet({
  close,
  addToast,
}: {
  close: () => void;
  addToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [selected, setSelected] = useState("light");

  const pick = (id: string) => {
    setSelected(id);
    const mode = COLOR_MODES.find((m) => m.id === id);
    addToast(`Görünüş: ${mode?.label}`, "info");
    setTimeout(close, 500);
  };

  return (
    <div className="px-5 pb-8 pt-2">
      <ModalHeader title="Görünüş" close={close} />
      <div className="mt-4 flex gap-3">
        {COLOR_MODES.map((m) => {
          const Icon = m.icon;
          const active = selected === m.id;
          return (
            <motion.button
              key={m.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => pick(m.id)}
              className={`flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${
                active
                  ? "border-primary bg-primary-light"
                  : "border-transparent bg-surface-elevated"
              }`}
            >
              <Icon
                size={24}
                className={active ? "text-primary" : "text-text-secondary"}
              />
              <span
                className={`text-[13px] font-semibold ${active ? "text-primary" : "text-text-secondary"}`}
              >
                {m.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Star row (light theme) ─── */
function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <p className="text-text-primary text-[15px] font-semibold mb-3">
        {label}
      </p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <motion.button
            key={s}
            whileTap={{ scale: 0.8 }}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(s)}
          >
            <Star
              size={30}
              className={`transition-colors ${
                s <= (hovered || value)
                  ? "text-warning fill-warning"
                  : "text-border fill-surface-elevated"
              }`}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ─── Feedback content (light) ─── */
function FeedbackContent({
  close,
  addToast,
}: {
  close: () => void;
  addToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [step, setStep] = useState<"main" | "waiter">("main");
  const [selectedWaiter, setSelectedWaiter] = useState<
    (typeof WAITERS)[0] | null
  >(null);
  const [mealRating, setMealRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const MAX_NOTE = 250;

  const handleSend = () => {
    if (mealRating === 0 || serviceRating === 0) {
      addToast("Zəhmət olmasa hər iki bölməni qiymətləndirin", "error");
      return;
    }
    setSent(true);
    addToast("Rəyiniz üçün təşəkkür edirik!", "success");
    setTimeout(close, 1800);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 px-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center"
        >
          <CheckCircle2 size={40} className="text-success" />
        </motion.div>
        <p className="font-outfit text-xl font-bold text-text-primary text-center">
          Təşəkkür edirik!
        </p>
        <p className="text-text-secondary text-[13px] text-center">
          Rəyiniz qeydə alındı
        </p>
      </div>
    );
  }

  if (step === "waiter") {
    return (
      <div className="pb-8">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border-light">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setStep("main")}
            className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center"
          >
            <ChevronLeft size={16} className="text-text-primary" />
          </motion.button>
          <h3 className="font-outfit text-[15px] font-bold text-text-primary">
            Ofisiant seçin
          </h3>
        </div>
        <div className="px-5 mt-4 space-y-2">
          {WAITERS.map((w) => {
            const active = selectedWaiter?.id === w.id;
            return (
              <motion.button
                key={w.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSelectedWaiter(w);
                  setStep("main");
                }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                  active
                    ? "border-primary bg-primary-light"
                    : "border-transparent bg-surface-elevated"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                  {w.emoji}
                </div>
                <span
                  className={`flex-1 text-[15px] font-medium text-left ${active ? "text-primary" : "text-text-primary"}`}
                >
                  {w.name}
                </span>
                {active && (
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                )}
              </motion.button>
            );
          })}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectedWaiter(null);
              setStep("main");
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-border-light bg-surface-elevated"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
              <X size={16} className="text-text-tertiary" />
            </div>
            <span className="text-[14px] font-medium text-text-secondary text-left">
              Ofisiant seçmə
            </span>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 pb-8 space-y-5">
      {/* Waiter selector */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setStep("waiter")}
        className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-surface-elevated border border-border-light"
      >
        <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          {selectedWaiter ? (
            <span className="text-xl">{selectedWaiter.emoji}</span>
          ) : (
            <User size={18} className="text-primary" />
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-text-primary text-[14px] font-semibold">
            {selectedWaiter ? selectedWaiter.name : "Ofisiant seçin"}
          </p>
          <p className="text-text-tertiary text-[12px] mt-0.5">
            Xüsusi rəy üçün
          </p>
        </div>
        <span className="text-primary text-[13px] font-bold shrink-0">
          {selectedWaiter ? "Dəyiş" : "Seç"}
        </span>
        <ChevronRight size={14} className="text-text-tertiary shrink-0" />
      </motion.button>

      {/* Ratings */}
      <StarRow label="Yemək" value={mealRating} onChange={setMealRating} />
      <StarRow
        label="Xidmət"
        value={serviceRating}
        onChange={setServiceRating}
      />

      {/* Note */}
      <div className="relative">
        <textarea
          rows={3}
          placeholder="Qeyd (isteğe bağlı)..."
          value={note}
          maxLength={MAX_NOTE}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-3 bg-surface-elevated border border-border-light rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary outline-none resize-none focus:border-primary transition-colors"
        />
        <span className="absolute bottom-3 right-3 text-[11px] text-text-tertiary">
          {note.length}/{MAX_NOTE}
        </span>
      </div>

      {/* Send */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSend}
        className="w-full py-3.5 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2 shadow-primary-glow"
        style={{ background: "linear-gradient(135deg, #00c2e8, #00c2a8)" }}
      >
        <Send size={16} />
        Göndər
      </motion.button>
    </div>
  );
}

/* ─── Standalone Feedback Sheet ─── */
function FeedbackSheet({
  close,
  addToast,
}: {
  close: () => void;
  addToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  return (
    <div className="pb-2">
      <ModalHeader title="Rəy bildir" close={close} />
      <FeedbackContent close={close} addToast={addToast} />
    </div>
  );
}

/* ─── Waiter Call Sheet ─── */
import type { Translations } from "@/i18n/translations";

type RequestType = "call" | "bill" | "water" | "napkin" | "clean" | "other";

const REQUEST_TYPES: { type: RequestType; icon: typeof Bell }[] = [
  { type: "call", icon: Bell },
  { type: "bill", icon: CreditCard },
  { type: "water", icon: Droplets },
  { type: "napkin", icon: ScrollText },
  { type: "clean", icon: Sparkles },
  { type: "other", icon: HelpCircle },
];

function WaiterCallSheet({ close, t }: { close: () => void; t: Translations }) {
  const [selected, setSelected] = useState<RequestType>("call");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const { tableNumber, setScreen } = useUIStore();
  const { addRequest, requests } = useWaiterRequestStore();

  const send = () => {
    setStatus("sending");
    // TODO: POST /api/waiter-requests { tableId, type: selected, message: note }
    setTimeout(() => {
      addRequest(selected, note, tableNumber);
      setStatus("sent");
    }, 1200);
  };

  const goToHistory = () => {
    close();
    setScreen("waiterRequests");
  };

  if (status === "sent") {
    return (
      <div className="px-5 pb-10 pt-2">
        <div className="flex justify-end mb-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={close}
            className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center"
          >
            <X size={16} className="text-text-secondary" />
          </motion.button>
        </div>
        <div className="flex flex-col items-center gap-3 py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#06d6a0,#00c2a8)" }}
          >
            <CheckCircle2 size={40} className="text-white" />
          </motion.div>
          <h3 className="font-outfit text-[20px] font-bold text-text-primary">
            {t.waiter.sent}
          </h3>
          <p className="text-text-secondary text-[13px] text-center">
            {t.waiter.note}
          </p>
          <div className="w-full flex flex-col gap-2 mt-4">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={goToHistory}
              className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow"
              style={{ background: "linear-gradient(135deg,#00c2e8,#00c2a8)" }}
            >
              <Bell size={15} />
              Müraciətlərə bax
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={close}
              className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-text-secondary bg-surface-elevated border border-border-light"
            >
              {t.common.close}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 pt-2">
      <ModalHeader title={t.waiter.title} close={close} />

      <div className="flex items-center justify-between mt-4 mb-3">
        <p className="text-text-secondary text-[13px]">
          {t.waiter.subtitle}
          {tableNumber > 0 && (
            <span className="ml-1.5 text-text-tertiary">
              · Masa #{tableNumber}
            </span>
          )}
        </p>
        {requests.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={goToHistory}
            className="flex items-center gap-1 text-[12px] font-bold text-primary bg-primary-light rounded-full px-2.5 py-1 shrink-0 ml-2"
          >
            <Bell size={11} />
            {requests.length} müraciət
            <ChevronRight size={11} />
          </motion.button>
        )}
      </div>

      {/* Type selector grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {REQUEST_TYPES.map(({ type, icon: Icon }) => {
          const active = selected === type;
          return (
            <motion.button
              key={type}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelected(type)}
              className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${
                active
                  ? "border-primary bg-primary-light"
                  : "border-transparent bg-surface-elevated"
              }`}
            >
              <Icon
                size={22}
                className={active ? "text-primary" : "text-text-secondary"}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className={`text-[12px] font-semibold ${active ? "text-primary" : "text-text-secondary"}`}
              >
                {t.waiter.types[type]}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Optional note */}
      <textarea
        rows={2}
        placeholder={t.waiter.notePlaceholder}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full px-4 py-3 bg-surface-elevated border border-border-light rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary outline-none resize-none focus:border-primary transition-colors mb-4"
      />

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={send}
          disabled={status === "sending"}
          className="w-full py-4 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow disabled:opacity-70"
          style={{ background: "linear-gradient(135deg,#00c2e8,#00c2a8)" }}
        >
          {status === "sending" ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              {t.waiter.sending}
            </>
          ) : (
            <>
              <Send size={16} />
              {t.waiter.sendBtn}
            </>
          )}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={close}
          className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-text-secondary bg-surface-elevated border border-border-light"
        >
          {t.waiter.cancel}
        </motion.button>
      </div>
    </div>
  );
}
