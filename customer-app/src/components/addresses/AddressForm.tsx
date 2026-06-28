import MapPickerModal from "@/components/MapPickerModal";
import { motion } from "framer-motion";
import { Check, Crosshair, X } from "lucide-react";
import { useState } from "react";
import { Address, SPRING, TYPE_ICONS, TYPE_OPTS } from "./addressTypes";

interface AddressFormProps {
  onSave: (addr: Omit<Address, "id">) => void;
  onClose: () => void;
}

export default function AddressForm({ onSave, onClose }: AddressFormProps) {
  const [form, setForm] = useState({
    street: "",
    apt: "",
    city: "Bakı",
    type: "other" as Address["type"],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMap, setShowMap] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.street.trim()) e.street = "Küçə ünvanı tələb olunur";
    if (!form.city.trim()) e.city = "Şəhər tələb olunur";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const label = TYPE_OPTS.find((t) => t.id === form.type)?.label ?? "Yeni";
    const detail = `${form.city}${form.apt ? `, mənzil ${form.apt}` : ""}`;
    onSave({ type: form.type, label, address: form.street, detail });
  };

  return (
    <>
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
              onClose();
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
          onClick={handleSave}
          className="w-full h-11 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow"
          style={{ background: "linear-gradient(135deg, #00c2e8, #00c2a8)" }}
        >
          <Check size={16} />
          Ünvanı saxla
        </motion.button>
      </motion.div>

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
    </>
  );
}
