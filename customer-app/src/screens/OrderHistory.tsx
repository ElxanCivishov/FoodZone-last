import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useUIStore, useOrderStore } from '@/store';
import type { Order } from '@/types';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

const STATUS_CONFIG = {
  new:       { label: 'Qəbul edildi',  color: 'text-info bg-info/10',     icon: Package },
  preparing: { label: 'Hazırlanır',    color: 'text-warning bg-warning/10', icon: Clock },
  ready:     { label: 'Hazırdır',      color: 'text-success bg-success/10', icon: CheckCircle2 },
  served:    { label: 'Təqdim edildi', color: 'text-success bg-success/10', icon: CheckCircle2 },
  completed: { label: 'Tamamlandı',   color: 'text-success bg-success/10', icon: CheckCircle2 },
  cancelled: { label: 'Ləğv edildi',   color: 'text-coral bg-coral/10',    icon: XCircle },
};

export default function OrderHistory() {
  const { setScreen } = useUIStore();
  const orders = useOrderStore((s) => s.orders);
  const setCurrentOrderFn = useOrderStore((s) => s.setCurrentOrder);

  const viewOrder = (order: Order) => {
    setCurrentOrderFn(order);
    setScreen('orderDetail');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-border-light">
        <h1 className="font-outfit text-[20px] font-bold text-text-primary">Sifarişlərim</h1>
        <p className="text-text-secondary text-[13px] mt-0.5">{orders.length} sifariş</p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mb-4">
              <Package size={36} className="text-primary" />
            </div>
            <p className="font-outfit text-[17px] font-bold text-text-primary">Hələ sifariş yoxdur</p>
            <p className="text-text-secondary text-[13px] mt-1 text-center">
              İlk sifarişinizi menyudan verin
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => (useUIStore.getState() as any).setActiveTab('home')}
              className="mt-5 px-6 py-3 rounded-xl text-[14px] font-semibold text-white shadow-primary-glow"
              style={{ background: 'linear-gradient(135deg, #00c2e8, #00c2a8)' }}
            >
              Menyuya bax
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, ...SPRING }}
                  className="bg-white rounded-2xl p-4 shadow-xs border border-border-light"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-outfit text-[15px] font-bold text-text-primary">
                        Sifariş {order.id}
                      </p>
                      <p className="text-[12px] text-text-secondary mt-0.5">{order.createdAt}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.color}`}>
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="space-y-1 mb-3">
                    {order.items.slice(0, 2).map((item, j) => (
                      <div key={j} className="flex justify-between text-[12px]">
                        <span className="text-text-secondary truncate flex-1 pr-2">
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="text-text-primary font-medium shrink-0">
                          {(item.unitPrice * item.quantity).toFixed(2)} AZN
                        </span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[11px] text-text-tertiary">
                        +{order.items.length - 2} məhsul daha
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border-light">
                    <span className="font-outfit text-[15px] font-bold text-primary">
                      {order.total.toFixed(2)} AZN
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => viewOrder(order)}
                      className="flex items-center gap-1 text-[12px] font-semibold text-primary"
                    >
                      Detallara bax <ChevronRight size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
