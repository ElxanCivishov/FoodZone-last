import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Coffee, Package, UtensilsCrossed, GlassWater, Sunrise, LayoutGrid } from 'lucide-react';
import { MENU_GROUPS, menuProducts } from '@/data/menuData';

const GROUP_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  LayoutGrid, Package, Coffee, UtensilsCrossed, GlassWater, Sunrise,
};

const ALL_GROUPS = [
  { id: 'all', label: 'Hamısı', icon: 'LayoutGrid', hasSubs: false },
  ...MENU_GROUPS.filter((g) => g.id !== 'all'),
];

interface Props {
  isOpen: boolean;
  activeGroupId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export default function CategoryBottomSheet({ isOpen, activeGroupId, onClose, onSelect }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.8 }}
            className="relative bg-white rounded-t-3xl overflow-hidden will-change-transform pb-10"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border-light" />
            </div>

            {/* Başlıq */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
              <h3 className="font-outfit text-[17px] font-bold text-text-primary">Kateqoriyalar</h3>
              <motion.button
                whileTap={{ scale: 0.88 }} onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center"
              >
                <X size={16} className="text-text-secondary" />
              </motion.button>
            </div>

            {/* Siyahı */}
            <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: '60vh' }}>
              {ALL_GROUPS.map((g) => {
                const Icon = GROUP_ICONS[g.icon];
                const count = g.id === 'all'
                  ? menuProducts.length
                  : menuProducts.filter((p) => p.groupId === g.id).length;
                const isActive = activeGroupId === g.id;

                return (
                  <motion.button
                    key={g.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(g.id)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 border-b border-border-light ${
                      isActive ? 'bg-primary-light' : 'bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-primary' : 'bg-surface-elevated'
                    }`}>
                      {Icon && <Icon size={18} className={isActive ? 'text-white' : 'text-text-secondary'} />}
                    </div>

                    <div className="flex-1 text-left">
                      <p className={`text-[15px] font-semibold ${isActive ? 'text-primary' : 'text-text-primary'}`}>
                        {g.label}
                      </p>
                      <p className="text-[12px] text-text-tertiary mt-0.5">{count} məhsul</p>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-primary opacity-100' : 'opacity-0'
                    }`}>
                      <Check size={13} className="text-white" strokeWidth={3} />
                    </div>
                  </motion.button>
                );
              })}
              <div className="h-6" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
