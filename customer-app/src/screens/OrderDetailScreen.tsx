import { motion } from "framer-motion";
import {
  ChevronLeft,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Receipt,
  Star,
} from "lucide-react";
import { useUIStore, useOrderStore } from "@/store";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

const STATUS_CONFIG = {
  new: {
    label: "Qəbul edildi",
    color: "text-info",
    bg: "bg-info/10",
    icon: Package,
    step: 1,
  },
  preparing: {
    label: "Hazırlanır",
    color: "text-warning",
    bg: "bg-warning/10",
    icon: Clock,
    step: 2,
  },
  ready: {
    label: "Hazırdır",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 3,
  },
  served: {
    label: "Təqdim edildi",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 4,
  },
  completed: {
    label: "Tamamlandı",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 4,
  },
  cancelled: {
    label: "Ləğv edildi",
    color: "text-coral",
    bg: "bg-coral/10",
    icon: XCircle,
    step: 0,
  },
};

const STEPS = ["Qəbul", "Hazırlanır", "Hazır", "Tamamlandı"];

export default function OrderDetailScreen() {
  const { goBack } = useUIStore();
  const order = useOrderStore((s) => s.currentOrder);

  if (!order) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-canvas flex flex-col items-center justify-center gap-4"
      >
        <Receipt size={40} className="text-text-tertiary" />
        <p className="text-text-secondary text-[15px]">Sifariş tapılmadı</p>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={goBack}
          className="px-6 py-2.5 rounded-xl bg-primary text-white text-[14px] font-semibold"
        >
          Geri qayıt
        </motion.button>
      </motion.div>
    );
  }

  const cfg = STATUS_CONFIG[order.status];
  const StatusIcon = cfg.icon;

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
            Sifariş #{order.id.slice(-6)}
          </h1>
          <p className="text-text-secondary text-[13px]">{order.createdAt}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 space-y-3">
        {/* Status card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, ...SPRING }}
          className={`bg-white rounded-2xl border border-border-light shadow-xs p-4`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}
            >
              <StatusIcon size={18} className={cfg.color} />
            </div>
            <div>
              <p className="text-[16px] font-bold text-text-primary">
                {cfg.label}
              </p>
              <p className="text-[12px] text-text-secondary">
                Masa {order.tableNumber} • ~{order.estimatedTime} dəq
              </p>
            </div>
          </div>

          {/* Progress steps */}
          {order.status !== "cancelled" && (
            <div className="flex items-center">
              {STEPS.map((step, i) => {
                const done = (cfg.step ?? 0) > i;
                const active = (cfg.step ?? 0) === i + 1;
                return (
                  <div
                    key={step}
                    className="flex items-center flex-1 last:flex-none"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                          done || active
                            ? "bg-primary text-white"
                            : "bg-surface-elevated text-text-tertiary"
                        }`}
                      >
                        {done ? <CheckCircle2 size={13} /> : i + 1}
                      </div>
                      <span
                        className={`text-[9px] font-medium ${done || active ? "text-primary" : "text-text-tertiary"}`}
                      >
                        {step}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-1 mb-4 rounded transition-all ${done ? "bg-primary" : "bg-border-light"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...SPRING }}
          className="bg-white rounded-2xl border border-border-light shadow-xs overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border-light">
            <p className="font-outfit text-[15px] font-bold text-text-primary">
              Sifarişin tərkibi
            </p>
          </div>
          {order.items.map((item, i) => (
            <div
              key={`${item.product.id}-${i}`}
              className={`flex items-center gap-3 px-4 py-3 ${i < order.items.length - 1 ? "border-b border-border-light" : ""}`}
            >
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-12 h-12 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-text-primary truncate">
                  {item.product.name}
                </p>
                <p className="text-[12px] text-text-secondary">
                  {item.selectedSize.label}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold text-text-primary">
                  x{item.quantity}
                </p>
                <p className="text-primary font-bold text-[13px]">
                  {(item.unitPrice * item.quantity).toFixed(2)} AZN
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Totals */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...SPRING }}
          className="bg-white rounded-2xl border border-border-light shadow-xs p-4 space-y-2"
        >
          <div className="flex justify-between text-[13px]">
            <span className="text-text-secondary">Aratoplam</span>
            <span className="font-semibold text-text-primary">
              {order.subtotal.toFixed(2)} AZN
            </span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-text-secondary">Servis haqqı</span>
            <span className="font-semibold text-text-primary">
              {order.serviceFee.toFixed(2)} AZN
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-text-secondary">Endirim</span>
              <span className="font-semibold text-success">
                -{order.discount.toFixed(2)} AZN
              </span>
            </div>
          )}
          <div className="flex justify-between text-[15px] pt-2 border-t border-border-light">
            <span className="font-bold text-text-primary">Cəmi</span>
            <span className="font-bold text-primary">
              {order.total.toFixed(2)} AZN
            </span>
          </div>
        </motion.div>

        {/* Delivery info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...SPRING }}
          className="bg-white rounded-2xl border border-border-light shadow-xs p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-primary" />
            <p className="font-outfit text-[14px] font-bold text-text-primary">
              Çatdırılma məlumatı
            </p>
          </div>
          <p className="text-[13px] text-text-secondary">
            Masa {order.tableNumber} • İçərişəhər, Bakı
          </p>
        </motion.div>

        {/* Re-order / Review */}
        {order.status === "completed" && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, ...SPRING }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-border-light shadow-xs"
          >
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <Star size={18} className="text-warning" />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-semibold text-text-primary">
                Rəy bildir
              </p>
              <p className="text-[12px] text-text-secondary mt-0.5">
                Bu sifarişi qiymətləndir
              </p>
            </div>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
