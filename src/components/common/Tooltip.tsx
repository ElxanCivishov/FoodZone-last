import { cn } from "@/utils/cn";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom";
  className?: string;
}

export function Tooltip({
  children,
  content,
  side = "top",
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({
      x: r.left + r.width / 2,
      y: side === "top" ? r.top - 8 : r.bottom + 8,
    });
    setOpen(true);
  }, [side]);

  const hide = useCallback(() => setOpen(false), []);

  return (
    <div
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      className={className}
    >
      {children}
      {open &&
        createPortal(
          <div
            className="fixed z-[9999] max-w-[240px] px-2.5 py-1.5 rounded-lg text-[11px] font-medium leading-snug pointer-events-none bg-surface-elevated border border-border text-foreground shadow-xl animate-fade-in"
            style={{
              left: pos.x,
              top: pos.y,
              transform:
                side === "top"
                  ? "translateX(-50%) translateY(-100%)"
                  : "translateX(-50%)",
            }}
          >
            {content}
            <span
              className={cn(
                "absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-surface-elevated",
                side === "top"
                  ? "top-full -mt-1 border-r border-b border-border"
                  : "bottom-full -mb-1 border-l border-t border-border",
              )}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
