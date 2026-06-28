interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  labelClass?: string;
  sub?: string;
  right?: React.ReactNode;
  border?: boolean;
}

export default function SettingsRow({
  icon,
  label,
  labelClass,
  sub,
  right,
  border = false,
}: SettingsRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5${border ? " border-b border-border-light" : ""}`}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium ${labelClass ?? "text-text-primary"}`}>
          {label}
        </p>
        {sub && <p className="text-[12px] text-text-secondary">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
