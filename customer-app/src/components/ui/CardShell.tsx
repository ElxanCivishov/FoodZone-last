interface CardShellProps {
  shadow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function CardShell({
  shadow = false,
  className,
  children,
}: CardShellProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-border-light overflow-hidden${shadow ? " shadow-xs" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}
