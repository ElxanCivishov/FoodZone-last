import CardHeader from "@/components/ui/CardHeader";
import CardShell from "@/components/ui/CardShell";
import IconDot from "@/components/ui/IconDot";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "Sifarişimi necə ləğv edə bilərəm?",
    a: 'Sifariş qəbul edildikdən sonra 2 dəqiqə ərzində ləğv edə bilərsiniz. "Sifarişlərim" bölməsinə keçib "Ləğv et" düyməsini basın.',
  },
  {
    q: "Çatdırılma vaxtı nə qədərdir?",
    a: "Orta çatdırılma vaxtı 15–30 dəqiqədir. Bu müddət sifariş sayı və məsafəyə görə dəyişə bilər.",
  },
  {
    q: "Sifarişdə problem olsa nə etməliyəm?",
    a: "Dəstək formasından müraciət göndərin. Müraciətiniz 24 saat ərzində baxılacaq.",
  },
  {
    q: "Ödənişi geri almaq mümkündürmü?",
    a: "Bəli, restoran tərəfindən ləğv edilmiş sifarişlər üçün tam geri ödəmə 3–5 iş günü ərzində hesabınıza köçürülür.",
  },
  {
    q: "Kupon kodu haradan tapa bilərəm?",
    a: 'Kupon kodlarını e-poçtunuza, sosial media səhifəmizdəki paylaşımlara və ya tətbiq daxilindəki "Kuponlar" bölməsinə baxaraq tapa bilərsiniz.',
  },
];

export default function FaqCard() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <CardShell>
      <CardHeader
        icon={<IconDot><HelpCircle size={15} className="text-primary" /></IconDot>}
        title="Tez-tez soruşulanlar"
      />
      <div>
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className={
              i < FAQS.length - 1 ? "border-b border-border-light" : ""
            }
          >
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="text-[13px] font-semibold text-text-primary pr-3 leading-snug">
                {faq.q}
              </span>
              <motion.div
                animate={{ rotate: openIdx === i ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0"
              >
                <ChevronDown size={15} className="text-text-tertiary" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-[13px] text-text-secondary leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
