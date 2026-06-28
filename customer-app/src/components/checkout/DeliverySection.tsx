import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronRight,
  LogIn,
  Map,
  MapPin,
  Plus,
} from "lucide-react";
import { Section } from "./CheckoutSection";
import { ADDR_ICONS, DEMO_ADDRESSES } from "./checkoutTypes";
import { useT } from "@/hooks/useT";

interface DeliverySectionProps {
  isLoggedIn: boolean;
  selectedAddrId: number;
  onSelectAddr: (id: number) => void;
  onLogin: () => void;
  onManageAddresses: () => void;
}

export default function DeliverySection({
  isLoggedIn,
  selectedAddrId,
  onSelectAddr,
  onLogin,
  onManageAddresses,
}: DeliverySectionProps) {
  const t = useT();

  return (
    <Section
      title={t.checkout.deliveryAddress}
      icon={<MapPin size={16} className="text-primary" />}
    >
      {!isLoggedIn ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onLogin}
          className="w-full flex items-center gap-3 p-3.5 bg-warning/10 rounded-xl border border-warning/30"
        >
          <AlertCircle size={16} className="text-warning shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-[13px] font-semibold text-warning">
              {t.checkout.loginRequiredTitle}
            </p>
            <p className="text-[11px] text-warning/70">
              {t.checkout.loginRequiredNote}
            </p>
          </div>
          <LogIn size={15} className="text-warning shrink-0" />
        </motion.button>
      ) : (
        <div className="space-y-2">
          {DEMO_ADDRESSES.map((addr) => {
            const Icon = ADDR_ICONS[addr.type] ?? Map;
            const active = selectedAddrId === addr.id;
            return (
              <motion.button
                key={addr.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectAddr(addr.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  active
                    ? "border-primary bg-primary-light"
                    : "border-transparent bg-surface-elevated"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    active ? "bg-primary" : "bg-border-light"
                  }`}
                >
                  <Icon
                    size={15}
                    className={active ? "text-white" : "text-text-secondary"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[13px] font-bold ${
                      active ? "text-primary" : "text-text-primary"
                    }`}
                  >
                    {addr.label}
                  </p>
                  <p className="text-[12px] text-text-secondary truncate">
                    {addr.address}
                  </p>
                  <p className="text-[11px] text-text-tertiary">{addr.detail}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    active ? "border-primary bg-primary" : "border-border"
                  }`}
                >
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </motion.button>
            );
          })}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onManageAddresses}
            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-primary/40 bg-white dark:bg-transparent"
          >
            <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
              <Plus size={15} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold text-primary">
                {t.checkout.addOrChangeAddress}
              </p>
              <p className="text-[11px] text-text-tertiary">
                {t.checkout.goToAddresses}
              </p>
            </div>
            <ChevronRight size={15} className="text-primary shrink-0" />
          </motion.button>
        </div>
      )}
    </Section>
  );
}
