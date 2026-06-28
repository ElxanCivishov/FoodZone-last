import AddressCard from "@/components/addresses/AddressCard";
import AddNewButton from "@/components/addresses/AddNewButton";
import AddressForm from "@/components/addresses/AddressForm";
import { type Address, SPRING } from "@/components/addresses/addressTypes";
import { useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, MapPin } from "lucide-react";
import { useState } from "react";
import { useT } from "@/hooks/useT";

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

export default function AddressesScreen() {
  const t = useT();
  const { goBack, addToast } = useUIStore();
  const [addresses, setAddresses] = useState<Address[]>(INITIAL);
  const [selected, setSelected] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (addr: Omit<Address, "id">) => {
    const newId = Date.now();
    setAddresses((prev) => [...prev, { id: newId, ...addr }]);
    setSelected(newId);
    setShowForm(false);
    addToast(t.address.added, "success");
  };

  const handleDelete = (id: number) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (selected === id)
      setSelected(addresses.find((a) => a.id !== id)?.id ?? 0);
    addToast(t.address.deleted, "success");
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
            {t.address.title}
          </h1>
          <p className="text-text-secondary text-[13px]">
            {addresses.length} {t.address.count}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-32 space-y-3">
        <AnimatePresence>
          {addresses.map((addr, i) => (
            <AddressCard
              key={addr.id}
              address={addr}
              index={i}
              isSelected={selected === addr.id}
              onSelect={() => setSelected(addr.id)}
              onDelete={() => handleDelete(addr.id)}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {!showForm && <AddNewButton onClick={() => setShowForm(true)} />}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <AddressForm
              onSave={handleSave}
              onClose={() => setShowForm(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {!showForm && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-border-light">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goBack}
            className="w-full h-12 rounded-2xl text-[15px] font-bold text-white shadow-primary-glow flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #00c2e8, #00c2a8)" }}
          >
            <MapPin size={16} />
            {t.address.select}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
