import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, MapPin, CreditCard, Banknote, Tag, CheckCircle2, Loader2,
  UtensilsCrossed, ShoppingBag, Truck, AlertCircle, Phone, User, LogIn, Check,
} from 'lucide-react';
import { useUIStore, useCartStore, useOrderStore } from '@/store';
import { generateOrderId, getCurrentTime } from '@/utils';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

type OrderType = 'dine_in' | 'take_away' | 'delivery';
type PayMethod = 'cash' | 'card';

const ORDER_TYPES = [
  { id: 'dine_in'  as OrderType, label: 'Masa Xidməti', sub: 'Masaya gətirilir',     icon: UtensilsCrossed, color: '#667eea' },
  { id: 'take_away'as OrderType, label: 'Take Away',     sub: 'Özünüz alırsınız',    icon: ShoppingBag,     color: '#00c2e8' },
  { id: 'delivery' as OrderType, label: 'Çatdırılma',   sub: 'Ünvanınıza göndərilir', icon: Truck,           color: '#00c2a8' },
];

export default function CheckoutScreen() {
  const { goBack, setScreen, addToast, isQRSession, tableNumber, isLoggedIn, userInfo, setUserInfo, login } = useUIStore();
  const { items, getSubtotal, getServiceFee, getTotal, clearCart } = useCartStore();
  const addOrder = useOrderStore((s) => s.addOrder);

  const [orderType, setOrderType] = useState<OrderType>(isQRSession ? 'dine_in' : 'take_away');
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  /* Delivery auth form */
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ name: userInfo?.name ?? '', phone: userInfo?.phone ?? '', address: userInfo?.address ?? '' });
  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string>>({});

  const discount = promoApplied ? Math.round(getSubtotal() * 0.1 * 100) / 100 : 0;
  const total = Math.round((getTotal() - discount) * 100) / 100;

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'FOOD10') {
      setPromoApplied(true);
      addToast('Promo kod tətbiq edildi! -10%', 'success');
    } else {
      addToast('Yanlış promo kod', 'error');
    }
  };

  const validateDelivery = () => {
    const e: Record<string, string> = {};
    if (!deliveryForm.name.trim())    e.name    = 'Ad tələb olunur';
    if (!deliveryForm.phone.trim())   e.phone   = 'Telefon tələb olunur';
    if (!deliveryForm.address.trim()) e.address = 'Ünvan tələb olunur';
    setDeliveryErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveDeliveryInfo = () => {
    if (!validateDelivery()) return;
    login({ name: deliveryForm.name, phone: deliveryForm.phone, address: deliveryForm.address });
    setShowDeliveryForm(false);
    addToast('Məlumatlar saxlanıldı', 'success');
  };

  /* Can user proceed with delivery? */
  const deliveryReady = isLoggedIn && userInfo?.address && userInfo?.phone;

  const handleSelectType = (type: OrderType) => {
    if (type === 'delivery' && !isLoggedIn) {
      setOrderType('delivery');
      setShowDeliveryForm(true);
      return;
    }
    if (type === 'delivery' && isLoggedIn && (!userInfo?.address || !userInfo?.phone)) {
      setOrderType('delivery');
      setShowDeliveryForm(true);
      return;
    }
    setOrderType(type);
    setShowDeliveryForm(false);
  };

  const handleOrder = () => {
    if (orderType === 'delivery' && !deliveryReady) {
      addToast('Çatdırılma üçün məlumatları doldurun', 'error');
      setShowDeliveryForm(true);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const order = {
        id: generateOrderId(),
        items: [...items],
        status: 'new' as const,
        subtotal: getSubtotal(),
        serviceFee: getServiceFee(),
        discount,
        total,
        tableNumber: orderType === 'dine_in' ? tableNumber : 0,
        createdAt: getCurrentTime(),
        estimatedTime: orderType === 'delivery' ? 35 : orderType === 'take_away' ? 15 : 18,
      };
      addOrder(order);
      clearCart();
      setLoading(false);
      setScreen('orderSuccess');
    }, 1400);
  };

  /* Available order types */
  const availableTypes = isQRSession
    ? ORDER_TYPES.filter((t) => t.id !== 'delivery')
    : ORDER_TYPES;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 border-b border-border-light">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <h2 className="font-outfit text-[17px] font-bold text-text-primary">Ödəniş</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">

        {/* ── Order Type ── */}
        <Section title="Sifariş növü" icon={<UtensilsCrossed size={16} className="text-primary" />}>
          <div className={`grid gap-2 ${availableTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {availableTypes.map((t) => {
              const Icon = t.icon;
              const active = orderType === t.id;
              const isDelivery = t.id === 'delivery';
              const locked = isDelivery && !isQRSession && !deliveryReady && orderType !== 'delivery';
              return (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectType(t.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                    active
                      ? 'border-primary bg-primary-light'
                      : locked
                        ? 'border-border-light bg-surface-elevated opacity-70'
                        : 'border-transparent bg-surface-elevated'
                  }`}
                >
                  <Icon size={20} className={active ? 'text-primary' : 'text-text-secondary'} />
                  <p className={`text-[12px] font-bold text-center leading-tight ${active ? 'text-primary' : 'text-text-secondary'}`}>
                    {t.label}
                  </p>
                  <p className={`text-[10px] text-center leading-tight ${active ? 'text-primary/70' : 'text-text-tertiary'}`}>
                    {t.sub}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {/* Dine-in info */}
          {orderType === 'dine_in' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 p-3 bg-primary/10 rounded-xl"
            >
              <CheckCircle2 size={15} className="text-primary shrink-0" />
              <p className="text-[13px] text-primary font-medium">Masa {tableNumber} — sifariş masaya gətiriləcək</p>
            </motion.div>
          )}

          {/* Take-away info */}
          {orderType === 'take_away' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 p-3 bg-primary/10 rounded-xl"
            >
              <CheckCircle2 size={15} className="text-primary shrink-0" />
              <p className="text-[13px] text-primary font-medium">Sifariş hazır olduqda sizi məlumatlandıracağıq</p>
            </motion.div>
          )}

          {/* Delivery: not logged in — prompt */}
          {orderType === 'delivery' && !isLoggedIn && !showDeliveryForm && (
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowDeliveryForm(true)}
              className="mt-2 w-full flex items-center gap-2 p-3 bg-warning/10 rounded-xl"
            >
              <AlertCircle size={15} className="text-warning shrink-0" />
              <p className="text-[13px] text-warning font-medium flex-1 text-left">
                Çatdırılma üçün məlumatlarınızı daxil edin
              </p>
              <ChevronLeft size={14} className="text-warning rotate-180 shrink-0" />
            </motion.button>
          )}

          {/* Delivery: logged in but missing info */}
          {orderType === 'delivery' && isLoggedIn && !deliveryReady && !showDeliveryForm && (
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowDeliveryForm(true)}
              className="mt-2 w-full flex items-center gap-2 p-3 bg-warning/10 rounded-xl"
            >
              <AlertCircle size={15} className="text-warning shrink-0" />
              <p className="text-[13px] text-warning font-medium flex-1 text-left">
                Ünvan və ya telefon nömrəsi əksikdir
              </p>
              <ChevronLeft size={14} className="text-warning rotate-180 shrink-0" />
            </motion.button>
          )}

          {/* Delivery: info ready */}
          {orderType === 'delivery' && deliveryReady && (
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowDeliveryForm(!showDeliveryForm)}
              className="mt-2 w-full flex items-center gap-2 p-3 bg-success/10 rounded-xl"
            >
              <CheckCircle2 size={15} className="text-success shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-[12px] text-success font-semibold">{userInfo?.name} • {userInfo?.phone}</p>
                <p className="text-[11px] text-success/80 truncate">{userInfo?.address}</p>
              </div>
            </motion.button>
          )}

          {/* Delivery form */}
          <AnimatePresence>
            {orderType === 'delivery' && showDeliveryForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border-light space-y-3">
                  {!isLoggedIn && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setScreen('login')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-light text-primary text-[13px] font-semibold"
                    >
                      <LogIn size={15} />
                      Hesabla daxil ol (tövsiyə edilir)
                    </motion.button>
                  )}

                  {/* Name */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <User size={13} className="text-text-secondary" />
                      <p className="text-[12px] font-semibold text-text-secondary">Ad Soyad *</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Adınız"
                      value={deliveryForm.name}
                      onChange={(e) => { setDeliveryForm(f => ({ ...f, name: e.target.value })); setDeliveryErrors(er => ({ ...er, name: '' })); }}
                      className={`w-full h-11 px-3.5 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                        deliveryErrors.name ? 'border-coral bg-coral/5' : 'border-border-light bg-surface-elevated'
                      }`}
                    />
                    {deliveryErrors.name && <p className="text-coral text-[11px] mt-1">{deliveryErrors.name}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Phone size={13} className="text-text-secondary" />
                      <p className="text-[12px] font-semibold text-text-secondary">Telefon nömrəsi *</p>
                    </div>
                    <input
                      type="tel"
                      placeholder="+994 50 XXX XX XX"
                      value={deliveryForm.phone}
                      onChange={(e) => { setDeliveryForm(f => ({ ...f, phone: e.target.value })); setDeliveryErrors(er => ({ ...er, phone: '' })); }}
                      className={`w-full h-11 px-3.5 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                        deliveryErrors.phone ? 'border-coral bg-coral/5' : 'border-border-light bg-surface-elevated'
                      }`}
                    />
                    {deliveryErrors.phone && <p className="text-coral text-[11px] mt-1">{deliveryErrors.phone}</p>}
                  </div>

                  {/* Address */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin size={13} className="text-text-secondary" />
                      <p className="text-[12px] font-semibold text-text-secondary">Çatdırılma ünvanı *</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Küçə, ev nömrəsi, mənzil"
                      value={deliveryForm.address}
                      onChange={(e) => { setDeliveryForm(f => ({ ...f, address: e.target.value })); setDeliveryErrors(er => ({ ...er, address: '' })); }}
                      className={`w-full h-11 px-3.5 rounded-xl border text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
                        deliveryErrors.address ? 'border-coral bg-coral/5' : 'border-border-light bg-surface-elevated'
                      }`}
                    />
                    {deliveryErrors.address && <p className="text-coral text-[11px] mt-1">{deliveryErrors.address}</p>}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={saveDeliveryInfo}
                    className="w-full h-11 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 shadow-primary-glow"
                    style={{ background: 'linear-gradient(135deg, #00c2e8, #00c2a8)' }}
                  >
                    <Check size={15} />
                    Məlumatları Saxla
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* ── Payment method ── */}
        <Section title="Ödəniş üsulu" icon={<CreditCard size={16} className="text-primary" />}>
          <div className="flex gap-2">
            {(['cash', 'card'] as PayMethod[]).map((m) => {
              const Icon = m === 'cash' ? Banknote : CreditCard;
              const label = m === 'cash' ? 'Nağd' : 'Kart';
              return (
                <motion.button
                  key={m}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPayMethod(m)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                    payMethod === m
                      ? 'border-primary bg-primary-light'
                      : 'border-transparent bg-surface-elevated'
                  }`}
                >
                  <Icon size={22} className={payMethod === m ? 'text-primary' : 'text-text-tertiary'} />
                  <span className={`text-[13px] font-semibold ${payMethod === m ? 'text-primary' : 'text-text-secondary'}`}>
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </Section>

        {/* ── Promo code ── */}
        <Section title="Promo kod" icon={<Tag size={16} className="text-primary" />}>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Kodu daxil edin…"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              disabled={promoApplied}
              className="flex-1 px-4 py-3 bg-surface-elevated rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 transition-all"
            />
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={applyPromo}
              disabled={promoApplied || !promoCode.trim()}
              className="px-4 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00c2e8, #00c2a8)' }}
            >
              {promoApplied ? '✓' : 'Tətbiq et'}
            </motion.button>
          </div>
          <AnimatePresence>
            {promoApplied && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-success text-[12px] font-semibold mt-2 flex items-center gap-1"
              >
                <CheckCircle2 size={13} /> FOOD10 — 10% endirim tətbiq edildi
              </motion.p>
            )}
          </AnimatePresence>
        </Section>

        {/* ── Order summary ── */}
        <Section title="Sifariş xülasəsi" icon={<CheckCircle2 size={16} className="text-primary" />}>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-[13px] py-1.5 border-b border-border-light last:border-0">
              <span className="text-text-secondary truncate flex-1 pr-2">
                {item.product.name} × {item.quantity}
              </span>
              <span className="font-medium text-text-primary shrink-0">
                {(item.unitPrice * item.quantity).toFixed(2)} AZN
              </span>
            </div>
          ))}
          <div className="mt-3 space-y-1.5">
            <SummaryRow label="Ara cəmi" value={`${getSubtotal().toFixed(2)} AZN`} />
            <SummaryRow label="Xidmət haqqı (10%)" value={`${getServiceFee().toFixed(2)} AZN`} />
            {discount > 0 && (
              <SummaryRow label="Endirim" value={`-${discount.toFixed(2)} AZN`} valueClass="text-success" />
            )}
            <div className="flex justify-between pt-2 border-t border-border-light mt-2">
              <span className="font-outfit text-[16px] font-bold text-text-primary">Ümumi</span>
              <span className="font-outfit text-[16px] font-bold text-primary">{total.toFixed(2)} AZN</span>
            </div>
          </div>
        </Section>
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-border-light bg-white">
        {orderType === 'delivery' && !deliveryReady ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowDeliveryForm(true)}
            className="w-full py-4 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}
          >
            <AlertCircle size={18} />
            Çatdırılma məlumatlarını daxil et
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleOrder}
            disabled={loading || items.length === 0}
            className="w-full py-4 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2 shadow-primary-glow disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #00c2e8, #00c2a8)' }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              `Sifariş Ver — ${total.toFixed(2)} AZN`
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-border-light">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-outfit text-[15px] font-bold text-text-primary">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value, valueClass = 'text-text-primary' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
