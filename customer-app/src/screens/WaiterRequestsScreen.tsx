import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Bell,
  CreditCard,
  Droplets,
  ScrollText,
  Sparkles,
  HelpCircle,
  Clock,
  CheckCircle2,
  Hourglass,
} from "lucide-react";
import { useUIStore } from "@/store";
import { useWaiterRequestStore } from "@/store";
import { useT } from "@/hooks/useT";
import type { WaiterRequestType, WaiterRequestStatus } from "@/types";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

const TYPE_META: Record<
  WaiterRequestType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  call: { icon: Bell, color: "text-primary", bg: "bg-primary-light" },
  bill: { icon: CreditCard, color: "text-success", bg: "bg-success/10" },
  water: { icon: Droplets, color: "text-info", bg: "bg-info/10" },
  napkin: { icon: ScrollText, color: "text-warning", bg: "bg-warning/10" },
  clean: { icon: Sparkles, color: "text-purple", bg: "bg-purple/10" },
  other: {
    icon: HelpCircle,
    color: "text-text-secondary",
    bg: "bg-surface-elevated",
  },
};

const STATUS_META: Record<
  WaiterRequestStatus,
  { icon: typeof Clock; color: string; bg: string }
> = {
  pending: { icon: Hourglass, color: "text-warning", bg: "bg-warning/10" },
  accepted: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  resolved: {
    icon: CheckCircle2,
    color: "text-text-secondary",
    bg: "bg-surface-elevated",
  },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDate(iso: string, todayLabel: string, yesterdayLabel: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return todayLabel;
  if (d.toDateString() === yesterday.toDateString()) return yesterdayLabel;
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

export default function WaiterRequestsScreen() {
  const { goBack, openModal } = useUIStore();
  const { requests } = useWaiterRequestStore();
  const t = useT();

  const grouped = requests.reduce<Record<string, typeof requests>>(
    (acc, req) => {
      const key = formatDate(req.createdAt, t.modal.today, t.common.yesterday);
      if (!acc[key]) acc[key] = [];
      acc[key].push(req);
      return acc;
    },
    {},
  );

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
        className="relative px-4 pt-4 pb-6 shrink-0"
        style={{ background: "linear-gradient(135deg,#00c2e8,#00c2a8)" }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={goBack}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0"
          >
            <ChevronLeft size={20} className="text-white" />
          </motion.button>
          <div>
            <h1 className="font-outfit text-xl font-bold text-white">
              {t.waiter.title}
            </h1>
            <p className="text-white/70 text-[12px] mt-0.5">
              {requests.length > 0
                ? `${requests.length} ${t.modal.request}`
                : t.waiter.noRequestsSent}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-24">
        <AnimatePresence mode="popLayout">
          {requests.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 pt-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center">
                <Bell size={32} className="text-primary" />
              </div>
              <p className="font-outfit text-lg font-bold text-text-primary">
                {t.waiter.noRequests}
              </p>
              <p className="text-text-secondary text-[13px] max-w-[220px]">
                {t.waiter.emptyNote}
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => openModal("waiterCall")}
                className="mt-2 px-6 py-3 rounded-2xl text-[14px] font-bold text-white shadow-primary-glow flex items-center gap-2"
                style={{
                  background: "linear-gradient(135deg,#00c2e8,#00c2a8)",
                }}
              >
                <Bell size={16} />
                {t.waiter.title}
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1">
                    {date}
                  </p>
                  <div className="space-y-2">
                    {items.map((req, i) => {
                      const meta = TYPE_META[req.type];
                      const Icon = meta.icon;
                      const statusMeta = STATUS_META[req.status];
                      const StatusIcon = statusMeta.icon;

                      return (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05, ...SPRING }}
                          className="bg-white rounded-2xl border border-border-light shadow-xs p-4"
                        >
                          <div className="flex items-start gap-3">
                            {/* Type icon */}
                            <div
                              className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}
                            >
                              <Icon
                                size={20}
                                className={meta.color}
                                strokeWidth={2}
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[15px] font-semibold text-text-primary">
                                  {t.waiter.types[req.type]}
                                </p>
                                <div
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${statusMeta.bg}`}
                                >
                                  <StatusIcon
                                    size={11}
                                    className={statusMeta.color}
                                  />
                                  <span
                                    className={`text-[11px] font-bold ${statusMeta.color}`}
                                  >
                                    {t.waiter.statuses[req.status]}
                                  </span>
                                </div>
                              </div>

                              {req.note && (
                                <p className="text-text-secondary text-[13px] mt-1 truncate">
                                  {req.note}
                                </p>
                              )}

                              <div className="flex items-center gap-1 mt-1.5">
                                <Clock
                                  size={11}
                                  className="text-text-tertiary"
                                />
                                <span className="text-text-tertiary text-[12px]">
                                  {formatTime(req.createdAt)} · {t.modal.table}{" "}
                                  {req.tableNumber}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* New request button */}
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ...SPRING }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openModal("waiterCall")}
                className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow"
                style={{
                  background: "linear-gradient(135deg,#00c2e8,#00c2a8)",
                }}
              >
                <Bell size={16} />
                {t.waiter.newRequest}
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
