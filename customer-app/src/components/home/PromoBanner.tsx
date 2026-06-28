import { AnimatePresence, motion } from "framer-motion";
import { Clock, Info, Percent, ShoppingBag, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PROMOS = [
  {
    id: 1,
    title: "Xoş gəldiniz!",
    sub: "Bugünün ən yaxşı menyusu",
    grad: "linear-gradient(135deg,#667eea,#764ba2)",
  },
  {
    id: 2,
    title: "Ödənişsiz çatdırılma",
    sub: "25 AZN-dən yuxarı sifarişlərə",
    grad: "linear-gradient(135deg,#00b4d8,#0077b6)",
  },
  {
    id: 3,
    title: "Yeni Setlər",
    sub: "Xüsusi kombinasiyalar hazırdır",
    grad: "linear-gradient(135deg,#f093fb,#f5576c)",
  },
];

const INFO = {
  cuisine: "Yapon Mətbəxi • Sushi • Ramen",
  rating: 4.8,
  reviews: 2340,
  minTime: 15,
  maxTime: 25,
  minOrder: 10,
  deliveryFee: 2,
  serviceFee: 10,
};

function MetaBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
      <span className="text-white/80">{icon}</span>
      <span className="text-white text-[11px] font-medium">{text}</span>
    </div>
  );
}

export default function PromoBanner() {
  const [promoIdx, setPromoIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setPromoIdx((i) => (i + 1) % PROMOS.length),
      4500,
    );
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (idx: number) => {
    setPromoIdx(idx);
    resetTimer();
  };

  return (
    <motion.div
      className="mx-4 mt-2 rounded-2xl overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
      style={{ height: 200 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => {
        if (info.offset.x < -40) goTo((promoIdx + 1) % PROMOS.length);
        else if (info.offset.x > 40)
          goTo((promoIdx - 1 + PROMOS.length) % PROMOS.length);
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={promoIdx}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 flex flex-col justify-between p-5"
          style={{ background: PROMOS[promoIdx].grad }}
        >
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[60%] -right-[15%] w-[220px] h-[220px] rounded-full bg-white/10"
          />
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute -bottom-[40%] -left-[10%] w-[160px] h-[160px] rounded-full bg-white/8"
          />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-white/75 text-[12px]">{INFO.cuisine}</p>
              <h1 className="text-white font-outfit text-xl font-bold mt-0.5">
                {PROMOS[promoIdx].title}
              </h1>
              <p className="text-white/80 text-[13px] mt-0.5">
                {PROMOS[promoIdx].sub}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Star size={12} className="text-yellow-300 fill-yellow-300" />
              <span className="text-white text-[12px] font-bold">
                {INFO.rating}
              </span>
              <span className="text-white/70 text-[11px]">
                ({INFO.reviews})
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 flex-wrap">
            <MetaBadge
              icon={<Clock size={11} />}
              text={`${INFO.minTime}-${INFO.maxTime} dəq`}
            />
            <MetaBadge
              icon={<ShoppingBag size={11} />}
              text={`min ${INFO.minOrder} AZN`}
            />
            <MetaBadge
              icon={<Info size={11} />}
              text={`${INFO.deliveryFee} AZN çatdırılma`}
            />
            <MetaBadge
              icon={<Percent size={11} />}
              text={`${INFO.serviceFee}% servis`}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {PROMOS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === promoIdx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
