interface CardHeaderProps {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  pb?: string;
}

export default function CardHeader({
  icon,
  title,
  right,
  pb = "pb-3",
}: CardHeaderProps) {
  return (
    <div
      className={`px-4 pt-4 ${pb} border-b border-border-light flex items-center ${right ? "justify-between" : "gap-2"}`}
    >
      {right ? (
        <>
          <div className="flex items-center gap-2">
            {icon}
            <p className="font-outfit text-[14px] font-bold text-text-primary">
              {title}
            </p>
          </div>
          {right}
        </>
      ) : (
        <>
          {icon}
          <p className="font-outfit text-[14px] font-bold text-text-primary">
            {title}
          </p>
        </>
      )}
    </div>
  );
}
