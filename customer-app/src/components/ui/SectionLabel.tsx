interface SectionLabelProps {
  children: React.ReactNode;
  size?: "sm" | "xs";
}

export default function SectionLabel({
  children,
  size = "sm",
}: SectionLabelProps) {
  return (
    <p
      className={`${size === "xs" ? "text-[11px]" : "text-[12px]"} font-bold text-text-tertiary uppercase tracking-wider mb-2 px-1`}
    >
      {children}
    </p>
  );
}
