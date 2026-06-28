import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-4 shadow-xs border border-border-light">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-outfit text-[15px] font-bold text-text-primary">
          {title}
        </h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 flex items-center gap-2 p-3 bg-primary/10 rounded-xl"
    >
      <CheckCircle2 size={15} className="text-primary shrink-0" />
      <p className="text-[13px] text-primary font-medium">{children}</p>
    </motion.div>
  );
}
