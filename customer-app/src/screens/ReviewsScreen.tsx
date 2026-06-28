import { motion } from "framer-motion";
import {
  ChevronLeft,
  Star,
  Plus,
  UtensilsCrossed,
  HandPlatter,
} from "lucide-react";
import { useUIStore } from "@/store";
import { useT } from "@/hooks/useT";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

type WaiterRef = { name: string; emoji: string };

interface FeedbackItem {
  id: number;
  orderId: string;
  mealRating: number;
  serviceRating: number;
  note: string;
  date: string;
  waiter: WaiterRef | null;
}

const REVIEWS: FeedbackItem[] = [
  {
    id: 1,
    orderId: "S-1042",
    mealRating: 5,
    serviceRating: 4,
    note: "Çox ləzzətli idi, təzəliyi hiss olunurdu. Tövsiyə edirəm!",
    date: "15 İyun 2026",
    waiter: { name: "Əli Həsənov", emoji: "👨" },
  },
  {
    id: 2,
    orderId: "S-1038",
    mealRating: 4,
    serviceRating: 4,
    note: "Gözəl hazırlanmışdı, amma bir az gözlədim.",
    date: "2 İyun 2026",
    waiter: null,
  },
  {
    id: 3,
    orderId: "S-1021",
    mealRating: 5,
    serviceRating: 5,
    note: "Əla dad, xidmət tam yerindəydi. Yenidən gəlməyi planlaşdırıram.",
    date: "20 May 2026",
    waiter: { name: "Nigar Əliyeva", emoji: "👩" },
  },
];

const mealAvg = (
  REVIEWS.reduce((s, r) => s + r.mealRating, 0) / REVIEWS.length
).toFixed(1);
const serviceAvg = (
  REVIEWS.reduce((s, r) => s + r.serviceRating, 0) / REVIEWS.length
).toFixed(1);
const overallAvg = (
  REVIEWS.reduce((s, r) => s + (r.mealRating + r.serviceRating) / 2, 0) /
  REVIEWS.length
).toFixed(1);

function Stars({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= count
              ? "text-warning fill-warning"
              : "text-border-light fill-border-light dark:text-white/10 dark:fill-white/10"
          }
        />
      ))}
    </div>
  );
}

function RatingRow({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: typeof UtensilsCrossed;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 w-[72px] shrink-0">
        <Icon size={12} className="text-text-tertiary" />
        <span className="text-[12px] text-text-secondary font-medium">
          {label}
        </span>
      </div>
      <Stars count={value} size={12} />
      <span className="text-[12px] font-bold text-text-primary ml-auto">
        {value}.0
      </span>
    </div>
  );
}

export default function ReviewsScreen() {
  const { goBack, openModal } = useUIStore();
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div
        className="relative px-4 pt-4 pb-6 shrink-0 overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg,#0f0c29 0%,#302b63 55%,#24243e 100%)",
        }}
      >
        <div
          className="absolute -top-10 right-0 w-48 h-48 opacity-20"
          style={{
            background: "radial-gradient(circle,#a78bfa,transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-0 -left-8 w-40 h-40 opacity-15"
          style={{
            background: "radial-gradient(circle,#00c2e8,transparent 65%)",
          }}
        />

        <div className="relative z-10 flex items-center gap-3 mb-5">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={goBack}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0"
          >
            <ChevronLeft size={20} className="text-white" />
          </motion.button>
          <div>
            <h1 className="font-outfit text-[20px] font-bold text-white">
              {t.reviewsScreen.title}
            </h1>
            <p className="text-white/50 text-[12px] mt-0.5">
              {REVIEWS.length} {t.reviewsScreen.submitted}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex items-center gap-3">
          {/* Overall score */}
          <div className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-2xl bg-white/10 border border-white/15 shrink-0">
            <span className="font-outfit text-[26px] font-black text-white leading-none">
              {overallAvg}
            </span>
            <Star size={11} className="text-warning fill-warning mt-1" />
          </div>

          {/* Meal + Service avg pills */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 w-20 shrink-0">
                <UtensilsCrossed size={11} className="text-white/60" />
                <span className="text-white/60 text-[11px]">
                  {t.reviewsScreen.meal}
                </span>
              </div>
              <div className="flex-1 h-1.5 rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(parseFloat(mealAvg) / 5) * 100}%` }}
                  transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-warning to-amber-400"
                />
              </div>
              <span className="text-white font-bold text-[12px] w-6 text-right">
                {mealAvg}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 w-20 shrink-0">
                <HandPlatter size={11} className="text-white/60" />
                <span className="text-white/60 text-[11px]">
                  {t.reviewsScreen.service}
                </span>
              </div>
              <div className="flex-1 h-1.5 rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(parseFloat(serviceAvg) / 5) * 100}%` }}
                  transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-teal-400"
                />
              </div>
              <span className="text-white font-bold text-[12px] w-6 text-right">
                {serviceAvg}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-24 space-y-3">
        {REVIEWS.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, ...SPRING }}
            className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs overflow-hidden"
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border-light dark:border-white/07">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-primary-light text-primary text-[11px] font-bold">
                  #{r.orderId}
                </span>
                {r.waiter && (
                  <span className="flex items-center gap-1 text-[12px] text-text-secondary">
                    <span>{r.waiter.emoji}</span>
                    <span>{r.waiter.name}</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-text-tertiary">{r.date}</span>
            </div>

            {/* Ratings */}
            <div className="px-4 py-3 space-y-2.5">
              <RatingRow
                label={t.reviewsScreen.meal}
                value={r.mealRating}
                Icon={UtensilsCrossed}
              />
              <RatingRow
                label={t.reviewsScreen.service}
                value={r.serviceRating}
                Icon={HandPlatter}
              />
            </div>

            {/* Note */}
            {r.note && (
              <div className="px-4 pb-4">
                <p className="text-[13px] text-text-secondary leading-relaxed border-t border-border-light dark:border-white/07 pt-3">
                  "{r.note}"
                </p>
              </div>
            )}
          </motion.div>
        ))}

        {/* Write review CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...SPRING }}
          whileTap={{ scale: 0.97 }}
          onClick={() => openModal("feedback")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <Plus size={18} className="text-primary" />
          </div>
          <div className="text-left flex-1">
            <p className="text-[14px] font-semibold text-text-primary">
              {t.reviewsScreen.newReview}
            </p>
            <p className="text-[12px] text-text-secondary mt-0.5">
              {t.reviewsScreen.rateOrder}
            </p>
          </div>
          <Star size={16} className="text-warning fill-warning" />
        </motion.button>
      </div>
    </motion.div>
  );
}
