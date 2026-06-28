import CardShell from "@/components/ui/CardShell";
import IconDot from "@/components/ui/IconDot";
import { RESTAURANT_INFO } from "@/data/restaurantInfo";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock } from "lucide-react";
import { useState } from "react";
import { useT } from "@/hooks/useT";

export default function HoursCard({
  today,
  isOpen,
}: {
  today: number;
  isOpen: boolean;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const todayRow = RESTAURANT_INFO.hours.find((h) => h.idx === today);

  return (
    <CardShell>
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-4"
      >
        <IconDot><Clock size={15} className="text-primary" /></IconDot>
        <div className="flex-1 text-left">
          <p className="text-[13px] font-bold text-text-primary">{t.modal.hours}</p>
          <p className="text-[12px] text-text-secondary mt-0.5">
            {t.info.todayPrefix} {todayRow?.time ?? "—"}
          </p>
        </div>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full mr-2 ${
            isOpen ? "bg-success/10 text-success" : "bg-red-50 text-red-400"
          }`}
        >
          {isOpen ? t.info.open : t.info.closed}
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
                          {t.modal.today}
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
    </CardShell>
  );
}
