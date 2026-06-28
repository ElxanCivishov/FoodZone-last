import { motion } from "framer-motion";

export default function Toggle({
  on,
  onToggle,
  disabled,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onToggle}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition-colors duration-300 relative shrink-0 ${
        on ? "bg-primary" : "bg-border-light"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <motion.div
        animate={{ x: on ? 24 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </motion.button>
  );
}
