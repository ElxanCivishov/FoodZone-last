import CardHeader from "@/components/ui/CardHeader";
import CardShell from "@/components/ui/CardShell";
import IconDot from "@/components/ui/IconDot";
import { RESTAURANT_INFO } from "@/data/restaurantInfo";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Copy, Wifi } from "lucide-react";
import { useState } from "react";

export default function WifiCard({
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
    <CardShell>
      <CardHeader
        icon={<IconDot><Wifi size={15} className="text-primary" /></IconDot>}
        title="WiFi"
        right={
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
        }
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          <div className="px-4 pt-3 pb-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wide">
              {net.label}
            </span>
          </div>

          <WifiRow
            label="Name"
            value={net.ssid}
            copied={copiedField === "name"}
            onCopy={() => copy("name")}
          />
          <div className="mx-4 h-px bg-border-light" />
          <WifiRow
            label="Password"
            value={net.pass}
            copied={copiedField === "pass"}
            onCopy={() => copy("pass")}
          />
        </motion.div>
      </AnimatePresence>
    </CardShell>
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
