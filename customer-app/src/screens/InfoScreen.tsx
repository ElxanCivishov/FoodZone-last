import { GALLERY_PREVIEW, RESTAURANT_INFO } from "@/data/restaurantInfo";
import { useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Clock,
  Copy,
  ExternalLink,
  Images,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  ShoppingBag,
  Star,
  Timer,
  Truck,
  Users,
  Wifi,
} from "lucide-react";
import { useState } from "react";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

export default function InfoScreen() {
  const { setScreen, openModal, addToast } = useUIStore();
  const today = new Date().getDay();

  const todayHours = RESTAURANT_INFO.hours.find((h) => h.idx === today);
  const isOpen = (() => {
    const now = new Date();
    const h = now.getHours();
    const isWeekend = today === 0 || today === 6;
    return isWeekend ? h >= 11 && h < 23 : h >= 10 && h < 22;
  })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* ─── Hero ─── */}
        <HeroSection isOpen={isOpen} todayHours={todayHours?.time ?? ""} />

        <div className="px-4 space-y-3 mt-4">
          {/* ─── About ─── */}
          <AboutCard />

          {/* ─── Gallery strip ─── */}
          <GalleryStrip onViewAll={() => setScreen("gallery")} />

          {/* ─── Hours ─── */}
          <HoursCard today={today} isOpen={isOpen} />

          {/* ─── Contact ─── */}
          <ContactCard addToast={addToast} />

          {/* ─── WiFi ─── */}
          <WifiCard addToast={addToast} />

          {/* ─── Delivery ─── */}
          <DeliveryCard />

          {/* ─── FAQ ─── */}
          <FaqCard />

          {/* ─── Feedback CTA ─── */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openModal("feedback")}
            className="w-full py-4 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow"
            style={{ background: "linear-gradient(135deg,#00c2e8,#00c2a8)" }}
          >
            <MessageSquare size={18} />
            Rəy bildir
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Hero ─── */
function HeroSection({
  isOpen,
  todayHours,
}: {
  isOpen: boolean;
  todayHours: string;
}) {
  return (
    <div
      className="relative mx-0 pt-14 pb-6 px-5"
      style={{ background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}
    >
      {/* Glow circles */}
      <div
        className="absolute top-4 right-4 w-32 h-32 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle,#00c2e8,transparent)" }}
      />
      <div
        className="absolute bottom-0 left-8 w-24 h-24 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle,#a78bfa,transparent)" }}
      />

      {/* Avatar */}
      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-4 shadow-lg">
        <span className="text-3xl">🍣</span>
      </div>

      {/* Name + status */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="font-outfit text-[26px] font-bold text-white leading-tight">
          {RESTAURANT_INFO.name}
        </h1>
        <span
          className={`mt-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ml-3 ${
            isOpen ? "bg-success/20 text-success" : "bg-white/10 text-white/50"
          }`}
        >
          {isOpen ? "● Açıqdır" : "● Bağlıdır"}
        </span>
      </div>

      <p className="text-white/60 text-[13px] mb-3">
        {RESTAURANT_INFO.tagline}
      </p>

      {/* Rating */}
      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={13}
            className={
              s <= Math.round(RESTAURANT_INFO.rating)
                ? "text-warning fill-warning"
                : "text-white/20"
            }
          />
        ))}
        <span className="text-white font-bold text-[14px] ml-1">
          {RESTAURANT_INFO.rating}
        </span>
        <span className="text-white/40 text-[12px]">
          ({RESTAURANT_INFO.reviewCount} rəy)
        </span>
      </div>

      {/* Quick stats */}
      <div className="flex gap-2">
        <StatPill
          icon={<Users size={12} />}
          label={`${RESTAURANT_INFO.tableCount} masa`}
        />
        <StatPill
          icon={<Clock size={12} />}
          label={todayHours || "10:00–22:00"}
        />
        <StatPill
          icon={<Truck size={12} />}
          label={`${RESTAURANT_INFO.deliveryFee} AZN`}
        />
      </div>
    </div>
  );
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
      <span className="text-white/60">{icon}</span>
      <span className="text-white/80 text-[11px] font-medium">{label}</span>
    </div>
  );
}

/* ─── Gallery strip ─── */
function GalleryStrip({ onViewAll }: { onViewAll: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Images size={15} className="text-primary" />
          <p className="font-outfit text-[14px] font-bold text-text-primary">
            Foto Qalereya
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onViewAll}
          className="flex items-center gap-1 text-primary text-[12px] font-semibold"
        >
          Hamısına bax
          <ChevronRight size={13} />
        </motion.button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-4">
        {GALLERY_PREVIEW.map((item, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.92 }}
            onClick={onViewAll}
            className="shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden relative"
            style={{ background: item.grad }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-2xl">
              {item.emoji}
            </span>
          </motion.button>
        ))}

        {/* +N more card */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onViewAll}
          className="shrink-0 w-[72px] h-[72px] rounded-xl bg-surface-elevated border border-border-light flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-primary font-bold text-[15px]">+10</span>
          <span className="text-text-tertiary text-[10px]">şəkil</span>
        </motion.button>
      </div>
    </div>
  );
}

/* ─── Hours ─── */
function HoursCard({ today, isOpen }: { today: number; isOpen: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const todayRow = RESTAURANT_INFO.hours.find((h) => h.idx === today);

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-4"
      >
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          <Clock size={15} className="text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[13px] font-bold text-text-primary">İş Saatları</p>
          <p className="text-[12px] text-text-secondary mt-0.5">
            Bugün: {todayRow?.time ?? "—"}
          </p>
        </div>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full mr-2 ${
            isOpen ? "bg-success/10 text-success" : "bg-red-50 text-red-400"
          }`}
        >
          {isOpen ? "Açıq" : "Bağlı"}
        </span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-text-tertiary" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border-light pt-3 space-y-1">
              {RESTAURANT_INFO.hours.map((h) => {
                const isToday = h.idx === today;
                return (
                  <div
                    key={h.day}
                    className={`flex justify-between items-center py-2 px-3 rounded-xl ${
                      isToday ? "bg-primary-light" : ""
                    }`}
                  >
                    <span
                      className={`text-[13px] font-medium ${isToday ? "text-primary" : "text-text-secondary"}`}
                    >
                      {h.day}
                      {isToday && (
                        <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full">
                          Bu gün
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-[13px] font-semibold ${isToday ? "text-primary" : "text-text-primary"}`}
                    >
                      {h.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── About ─── */
function AboutCard() {
  const mapsUrl = `https://www.google.com/maps?q=${RESTAURANT_INFO.coordinates.lat},${RESTAURANT_INFO.coordinates.lng}`;

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border-light flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          <Info size={15} className="text-primary" />
        </div>
        <p className="font-outfit text-[14px] font-bold text-text-primary">
          Haqqımızda
        </p>
      </div>

      <div className="px-4 py-4">
        <p className="text-[13px] text-text-secondary leading-[1.65]">
          {RESTAURANT_INFO.about}
        </p>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-light">
          <div className="flex-1 text-center">
            <p className="font-outfit text-[18px] font-bold text-primary">
              {RESTAURANT_INFO.founded}
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">İl</p>
          </div>
          <div className="w-px h-10 bg-border-light" />
          <div className="flex-1 text-center">
            <p className="font-outfit text-[18px] font-bold text-primary">
              {RESTAURANT_INFO.tableCount}
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">Masa</p>
          </div>
          <div className="w-px h-10 bg-border-light" />
          <div className="flex-1 text-center">
            <p className="font-outfit text-[18px] font-bold text-primary">
              {RESTAURANT_INFO.reviewCount}+
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">Rəy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Contact ─── */
function ContactCard({
  addToast,
}: {
  addToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const mapsUrl = `https://www.google.com/maps?q=${RESTAURANT_INFO.coordinates.lat},${RESTAURANT_INFO.coordinates.lng}`;

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 border-b border-border-light">
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          <Phone size={15} className="text-primary" />
        </div>
        <p className="font-outfit text-[14px] font-bold text-text-primary">
          Əlaqə
        </p>
      </div>

      {/* Phone */}
      <a
        href={`tel:${RESTAURANT_INFO.phone}`}
        className="flex items-center gap-3 px-4 py-3.5 border-b border-border-light active:bg-surface-elevated transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
          <Phone size={13} className="text-success" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] text-text-tertiary mb-0.5">Telefon</p>
          <p className="text-[14px] font-semibold text-primary">
            {RESTAURANT_INFO.phone}
          </p>
        </div>
        <ChevronRight size={14} className="text-text-tertiary" />
      </a>

      {/* Address → Google Maps */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-elevated transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          <MapPin size={13} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] text-text-tertiary mb-0.5">Ünvan</p>
          <p className="text-[14px] font-semibold text-text-primary">
            {RESTAURANT_INFO.address}
          </p>
        </div>
        <ExternalLink size={14} className="text-text-tertiary" />
      </a>
    </div>
  );
}

/* ─── WiFi ─── */
function WifiCard({
  addToast,
}: {
  addToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copiedField, setCopiedField] = useState<"name" | "pass" | null>(null);
  const net = RESTAURANT_INFO.wifiNetworks[activeIdx];

  const copy = (field: "name" | "pass") => {
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
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <Wifi size={15} className="text-primary" />
          </div>
          <p className="font-outfit text-[14px] font-bold text-text-primary">
            WiFi
          </p>
        </div>
        {/* Tab pills */}
        <div className="flex gap-1.5">
          {RESTAURANT_INFO.wifiNetworks.map((_, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                setActiveIdx(idx);
                setCopiedField(null);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                activeIdx === idx
                  ? "bg-primary text-white"
                  : "bg-surface-elevated text-text-secondary"
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
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {/* Label */}
          <div className="px-4 pt-3 pb-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wide">
              {net.label}
            </span>
          </div>

          {/* Name row */}
          <WifiRow
            label="Name"
            value={net.ssid}
            copied={copiedField === "name"}
            onCopy={() => copy("name")}
          />
          <div className="mx-4 h-px bg-border-light" />
          {/* Password row */}
          <WifiRow
            label="Password"
            value={net.pass}
            copied={copiedField === "pass"}
            onCopy={() => copy("pass")}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function WifiRow({
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
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-[11px] text-text-tertiary mb-0.5">{label}</p>
        <p className="text-[14px] font-semibold text-text-primary">{value}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.82 }}
        onClick={onCopy}
        className="w-8 h-8 rounded-full bg-surface-elevated border border-border-light flex items-center justify-center shrink-0"
      >
        {copied ? (
          <CheckCircle2 size={14} className="text-success" />
        ) : (
          <Copy size={13} className="text-text-tertiary" />
        )}
      </motion.button>
    </div>
  );
}

/* ─── FAQ ─── */
const FAQS = [
  { q: 'Sifarişimi necə ləğv edə bilərəm?', a: 'Sifariş qəbul edildikdən sonra 2 dəqiqə ərzində ləğv edə bilərsiniz. "Sifarişlərim" bölməsinə keçib "Ləğv et" düyməsini basın.' },
  { q: 'Çatdırılma vaxtı nə qədərdir?', a: 'Orta çatdırılma vaxtı 15–30 dəqiqədir. Bu müddət sifariş sayı və məsafəyə görə dəyişə bilər.' },
  { q: 'Sifarişdə problem olsa nə etməliyəm?', a: 'Dəstək formasından müraciət göndərin. Müraciətiniz 24 saat ərzində baxılacaq.' },
  { q: 'Ödənişi geri almaq mümkündürmü?', a: 'Bəli, restoran tərəfindən ləğv edilmiş sifarişlər üçün tam geri ödəmə 3–5 iş günü ərzində hesabınıza köçürülür.' },
  { q: 'Kupon kodu haradan tapa bilərəm?', a: 'Kupon kodlarını e-poçtunuza, sosial media səhifəmizdəki paylaşımlara və ya tətbiq daxilindəki "Kuponlar" bölməsinə baxaraq tapa bilərsiniz.' },
];

function FaqCard() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border-light flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          <HelpCircle size={15} className="text-primary" />
        </div>
        <p className="font-outfit text-[14px] font-bold text-text-primary">Tez-tez soruşulanlar</p>
      </div>
      <div>
        {FAQS.map((faq, i) => (
          <div key={i} className={i < FAQS.length - 1 ? 'border-b border-border-light' : ''}>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="text-[13px] font-semibold text-text-primary pr-3 leading-snug">{faq.q}</span>
              <motion.div animate={{ rotate: openIdx === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                <ChevronDown size={15} className="text-text-tertiary" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-[13px] text-text-secondary leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Delivery ─── */
function DeliveryCard() {
  const rows = [
    {
      icon: <ShoppingBag size={14} className="text-primary" />,
      label: "Minimum sifariş",
      value: `${RESTAURANT_INFO.minOrder} AZN`,
    },
    {
      icon: <Truck size={14} className="text-primary" />,
      label: "Çatdırılma haqqı",
      value: `${RESTAURANT_INFO.deliveryFee} AZN`,
    },
    {
      icon: <Timer size={14} className="text-primary" />,
      label: "Çatdırılma vaxtı",
      value: `${RESTAURANT_INFO.minTime}–${RESTAURANT_INFO.maxTime} dəq`,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border-light flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
          <Truck size={15} className="text-primary" />
        </div>
        <p className="font-outfit text-[14px] font-bold text-text-primary">
          Çatdırılma
        </p>
      </div>
      <div className="divide-y divide-border-light">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center shrink-0">
              {row.icon}
            </div>
            <span className="flex-1 text-[13px] text-text-secondary">
              {row.label}
            </span>
            <span className="text-[13px] font-semibold text-text-primary">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
