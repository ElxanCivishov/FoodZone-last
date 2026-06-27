import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  MapPin,
  Plus,
  Home,
  Briefcase,
  Map,
  X,
  Check,
  Crosshair,
  Trash2,
} from "lucide-react";
import { useUIStore } from "@/store";
import MapPickerModal from "@/components/MapPickerModal";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

interface Address {
  id: number;
  type: "home" | "work" | "other";
  label: string;
  address: string;
  detail: string;
}

const INITIAL: Address[] = [
  {
    id: 1,
    type: "home",
    label: "Ev",
    address: "Üzeyir Hacıbəyov küçəsi 12, mənzil 4",
    detail: "Bakı, AZ1001",
  },
  {
    id: 2,
    type: "work",
    label: "İş",
    address: "Neftçilər prospekti 89, mərtəbə 3",
    detail: "Bakı, AZ1010",
  },
];

const TYPE_ICONS = { home: Home, work: Briefcase, other: Map };
const TYPE_OPTS: { id: Address["type"]; label: string }[] = [
  { id: "home", label: "Ev" },
  { id: "work", label: "İş" },
  { id: "other", label: "Digər" },
];

export default function AddressesScreen() {
  const { goBack, addToast } = useUIStore();
  const [addresses, setAddresses] = useState<Address[]>(INITIAL);
  const [selected, setSelected] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [form, setForm] = useState({
    street: "",
    apt: "",
    city: "Bakı",
    type: "other" as Address["type"],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.street.trim()) e.street = "Küçə ünvanı tələb olunur";
    if (!form.city.trim()) e.city = "Şəhər tələb olunur";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveAddress = () => {
    if (!validate()) return;
    const newId = Date.now();
    const label = TYPE_OPTS.find((t) => t.id === form.type)?.label ?? "Yeni";
    const detail = `${form.city}${form.apt ? `, mənzil ${form.apt}` : ""}`;
    setAddresses((prev) => [
      ...prev,
      { id: newId, type: form.type, label, address: form.street, detail },
    ]);
    setSelected(newId);
    setShowForm(false);
    setForm({ street: "", apt: "", city: "Bakı", type: "other" });
    setErrors({});
    addToast("Ünvan əlavə edildi!", "success");
  };

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
        <div>
          <h1 className="font-outfit text-[20px] font-bold text-text-primary">
            Ünvanlarım
          </h1>
          <p className="text-text-secondary text-[13px]">
            {addresses.length} ünvan
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-32 space-y-3">
        {/* Saved addresses */}
        <AnimatePresence>
          {addresses.map((addr, i) => {
            const Icon = TYPE_ICONS[addr.type];
            const isSelected = selected === addr.id;
            return (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.06, ...SPRING }}
                onClick={() => setSelected(addr.id)}
                className={`w-full text-left bg-white rounded-2xl border p-4 shadow-xs transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-primary shadow-primary-glow/30"
                    : "border-border-light"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? "bg-primary" : "bg-surface-elevated"}`}
                  >
                    <Icon
                      size={16}
                      className={
                        isSelected ? "text-white" : "text-text-secondary"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-[14px] font-bold ${isSelected ? "text-primary" : "text-text-primary"}`}
                    >
                      {addr.label}
                    </span>
                    <p className="text-[13px] text-text-primary mt-0.5 truncate">
                      {addr.address}
                    </p>
                    <p className="text-[12px] text-text-secondary mt-0.5">
                      {addr.detail}
                    </p>
                  </div>
                  {/* Right controls */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border-light bg-white"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddresses((prev) =>
                          prev.filter((a) => a.id !== addr.id),
                        );
                        if (selected === addr.id)
                          setSelected(
                            addresses.find((a) => a.id !== addr.id)?.id ?? 0,
                          );
                        addToast("Ünvan silindi", "success");
                      }}
                      className="w-7 h-7 rounded-full bg-coral/10 flex items-center justify-center"
                    >
                      <Trash2 size={13} className="text-coral" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add new button */}
        <AnimatePresence>
          {!showForm && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-dashed border-primary/40 shadow-xs"
            >
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                <Plus size={18} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-semibold text-primary">
                  Yeni ünvan əlavə et
                </p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  Məlumatları daxil edin
                </p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={SPRING}
              className="bg-white rounded-2xl border border-primary/30 shadow-xs p-4 space-y-4"
            >
              {/* Form header */}
              <div className="flex items-center justify-between">
                <p className="font-outfit text-[15px] font-bold text-text-primary">
                  Yeni ünvan
                </p>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                  }}
                  className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center"
                >
                  <X size={14} className="text-text-secondary" />
                </motion.button>
              </div>

              {/* Type selector */}
              <div>
                <p className="text-[12px] font-semibold text-text-secondary mb-2">
                  Ünvan növü
                </p>
                <div className="flex gap-2">
                  {TYPE_OPTS.map((t) => {
                    const Icon = TYPE_ICONS[t.id];
                    const active = form.type === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[12px] font-semibold transition-all ${
                          active
                            ? "border-primary bg-primary-light text-primary"
                            : "border-border-light bg-surface-elevated text-text-secondary"
                        }`}
                      >
                        <Icon size={13} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Street */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[12px] font-semibold text-text-secondary">
                    Küçə / Ünvan *
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-light"
                  >
                    <Crosshair size={11} className="text-primary" />
                    <span className="text-[11px] font-bold text-primary">
                      Xəritədən seç
                    </span>
                  </motion.button>
                </div>
                <input
                  type="text"
                  placeholder="Küçə adı və nömrəsi"
                  value={form.street}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, street: e.target.value }));
                    setErrors((er) => ({ ...er, street: "" }));
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                    errors.street
                      ? "border-coral bg-coral/5"
                      : "border-border-light bg-surface-elevated"
                  }`}
                />
                {errors.street && (
                  <p className="text-coral text-[11px] mt-1">{errors.street}</p>
                )}
              </div>

              {/* Apt + City row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-text-secondary mb-1.5">
                    Mənzil / Ofis
                  </p>
                  <input
                    type="text"
                    placeholder="Mənzil №"
                    value={form.apt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, apt: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-border-light bg-surface-elevated text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-text-secondary mb-1.5">
                    Şəhər *
                  </p>
                  <input
                    type="text"
                    placeholder="Şəhər"
                    value={form.city}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, city: e.target.value }));
                      setErrors((er) => ({ ...er, city: "" }));
                    }}
                    className={`w-full h-11 px-3.5 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                      errors.city
                        ? "border-coral bg-coral/5"
                        : "border-border-light bg-surface-elevated"
                    }`}
                  />
                  {errors.city && (
                    <p className="text-coral text-[11px] mt-1">{errors.city}</p>
                  )}
                </div>
              </div>

              {/* Save */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={saveAddress}
                className="w-full h-11 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow"
                style={{
                  background: "linear-gradient(135deg, #00c2e8, #00c2a8)",
                }}
              >
                <Check size={16} />
                Ünvanı saxla
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save button */}
      {!showForm && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-border-light">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goBack}
            className="w-full h-12 rounded-2xl text-[15px] font-bold text-white shadow-primary-glow flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #00c2e8, #00c2a8)" }}
          >
            <MapPin size={16} />
            Bu ünvanı seç
          </motion.button>
        </div>
      )}

      {/* Map picker */}
      <AnimatePresence>
        {showMap && (
          <MapPickerModal
            open={showMap}
            onClose={() => setShowMap(false)}
            onConfirm={(loc) => {
              setForm((f) => ({
                ...f,
                street: loc.address,
                city: loc.city || f.city,
              }));
              setErrors((er) => ({ ...er, street: "" }));
              setShowMap(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
