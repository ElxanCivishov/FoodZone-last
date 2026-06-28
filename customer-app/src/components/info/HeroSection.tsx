import { RESTAURANT_INFO } from "@/data/restaurantInfo";
import { Clock, Star, Truck, Users } from "lucide-react";

export default function HeroSection({
  isOpen,
  todayHours,
}: {
  isOpen: boolean;
  todayHours: string;
}) {
  return (
    <div
      className="relative mx-0 pt-14 pb-6 px-5"
      style={{ background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}
    >
      <div
        className="absolute top-4 right-4 w-32 h-32 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle,#00c2e8,transparent)" }}
      />
      <div
        className="absolute bottom-0 left-8 w-24 h-24 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle,#a78bfa,transparent)" }}
      />

      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-4 shadow-lg">
        <span className="text-3xl">🍣</span>
      </div>

      <div className="flex items-start justify-between mb-1">
        <h1 className="font-outfit text-[26px] font-bold text-white leading-tight">
          {RESTAURANT_INFO.name}
        </h1>
        <span
          className={`mt-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ml-3 ${
            isOpen ? "bg-success/20 text-success" : "bg-white/10 text-white/50"
          }`}
        >
          {isOpen ? "● Açıqdır" : "● Bağlıdır"}
        </span>
      </div>

      <p className="text-white/60 text-[13px] mb-3">
        {RESTAURANT_INFO.tagline}
      </p>

      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={13}
            className={
              s <= Math.round(RESTAURANT_INFO.rating)
                ? "text-warning fill-warning"
                : "text-white/20"
            }
          />
        ))}
        <span className="text-white font-bold text-[14px] ml-1">
          {RESTAURANT_INFO.rating}
        </span>
        <span className="text-white/40 text-[12px]">
          ({RESTAURANT_INFO.reviewCount} rəy)
        </span>
      </div>

      <div className="flex gap-2">
        <StatPill
          icon={<Users size={12} />}
          label={`${RESTAURANT_INFO.tableCount} masa`}
        />
        <StatPill
          icon={<Clock size={12} />}
          label={todayHours || "10:00–22:00"}
        />
        <StatPill
          icon={<Truck size={12} />}
          label={`${RESTAURANT_INFO.deliveryFee} AZN`}
        />
      </div>
    </div>
  );
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
      <span className="text-white/60">{icon}</span>
      <span className="text-white/80 text-[11px] font-medium">{label}</span>
    </div>
  );
}
