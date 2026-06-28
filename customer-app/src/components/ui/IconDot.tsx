const SIZE_CLASSES = {
  xs: "w-7 h-7",
  sm: "w-8 h-8",
  md: "w-9 h-9",
};

interface IconDotProps {
  children: React.ReactNode;
  size?: keyof typeof SIZE_CLASSES;
  bg?: string;
  className?: string;
}

export default function IconDot({
  children,
  size = "md",
  bg = "bg-primary-light",
  className,
}: IconDotProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full ${bg} flex items-center justify-center shrink-0${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}
