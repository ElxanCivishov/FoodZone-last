import { motion } from 'framer-motion';
import { ChevronLeft, BarChart2, Package, Users, TrendingUp } from 'lucide-react';
import { useUIStore, useOrderStore } from '@/store';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

export default function AdminDashboard() {
  const { goBack } = useUIStore();
  const orders = useOrderStore((s) => s.orders);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const STATS = [
    { icon: Package,    label: 'Sifarişlər',  value: orders.length.toString(), color: 'text-primary bg-primary-light' },
    { icon: TrendingUp, label: 'Gəlir',        value: `${totalRevenue.toFixed(0)} AZN`, color: 'text-success bg-success/10' },
    { icon: Users,      label: 'Müştəri',      value: '—', color: 'text-warning bg-warning/10' },
    { icon: BarChart2,  label: 'Ortalama',     value: orders.length > 0 ? `${(totalRevenue / orders.length).toFixed(1)} AZN` : '—', color: 'text-secondary bg-secondary-light' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 border-b border-border-light">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <h1 className="font-outfit text-[18px] font-bold text-text-primary">Admin Paneli</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        <div className="grid grid-cols-2 gap-3">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, ...SPRING }}
                className="bg-white rounded-2xl p-4 shadow-xs border border-border-light"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${s.color}`}>
                  <Icon size={18} />
                </div>
                <p className="font-outfit text-xl font-bold text-text-primary">{s.value}</p>
                <p className="text-[12px] text-text-secondary mt-0.5">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {orders.length > 0 && (
          <div className="mt-4 bg-white rounded-2xl p-4 shadow-xs border border-border-light">
            <h3 className="font-outfit text-[15px] font-bold text-text-primary mb-3">Son Sifarişlər</h3>
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex justify-between items-center py-2.5 border-b border-border-light last:border-0">
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">{o.id}</p>
                  <p className="text-[11px] text-text-secondary">{o.createdAt}</p>
                </div>
                <span className="text-primary font-outfit text-[13px] font-bold">{o.total.toFixed(2)} AZN</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
