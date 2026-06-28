import CardHeader from "@/components/ui/CardHeader";
import CardShell from "@/components/ui/CardShell";
import IconDot from "@/components/ui/IconDot";
import { RESTAURANT_INFO } from "@/data/restaurantInfo";
import { ChevronRight, ExternalLink, MapPin, Phone } from "lucide-react";
import { useT } from "@/hooks/useT";

export default function ContactCard({
  addToast,
}: {
  addToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const t = useT();
  const mapsUrl = `https://www.google.com/maps?q=${RESTAURANT_INFO.coordinates.lat},${RESTAURANT_INFO.coordinates.lng}`;

  return (
    <CardShell>
      <CardHeader
        icon={<IconDot><Phone size={15} className="text-primary" /></IconDot>}
        title={t.info.contact}
        pb="pb-2"
      />

      <a
        href={`tel:${RESTAURANT_INFO.phone}`}
        className="flex items-center gap-3 px-4 py-3.5 border-b border-border-light active:bg-surface-elevated transition-colors"
      >
        <IconDot size="sm" bg="bg-success/10">
          <Phone size={13} className="text-success" />
        </IconDot>
        <div className="flex-1">
          <p className="text-[11px] text-text-tertiary mb-0.5">{t.info.phone}</p>
          <p className="text-[14px] font-semibold text-primary">
            {RESTAURANT_INFO.phone}
          </p>
        </div>
        <ChevronRight size={14} className="text-text-tertiary" />
      </a>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-elevated transition-colors"
      >
        <IconDot size="sm">
          <MapPin size={13} className="text-primary" />
        </IconDot>
        <div className="flex-1">
          <p className="text-[11px] text-text-tertiary mb-0.5">{t.info.address}</p>
          <p className="text-[14px] font-semibold text-text-primary">
            {RESTAURANT_INFO.address}
          </p>
        </div>
        <ExternalLink size={14} className="text-text-tertiary" />
      </a>
    </CardShell>
  );
}
