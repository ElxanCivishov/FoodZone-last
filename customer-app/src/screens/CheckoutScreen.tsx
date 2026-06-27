import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, MapPin, CreditCard, Banknote, Tag, CheckCircle2, Loader2,
  UtensilsCrossed, ShoppingBag, Truck, AlertCircle, Home, Briefcase, Map,
  ChevronRight, Plus, X, Eye, EyeOff, Check, LogIn, Lock,
} from 'lucide-react';
import { useUIStore, useCartStore, useOrderStore } from '@/store';
import { generateOrderId, getCurrentTime } from '@/utils';
import type { OrderType, PaymentMethod } from '@/types';

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 };

const ORDER_TYPES = [
  { id: 'dine_in'   as OrderType, label: 'Masa',        sub: 'Masaya gətirilir',      icon: UtensilsCrossed },
  { id: 'take_away' as OrderType, label: 'Take Away',   sub: 'Özünüz alırsınız',      icon: ShoppingBag     },
  { id: 'delivery'  as OrderType, label: 'Çatdırılma',  sub: 'Ünvanınıza göndərilir', icon: Truck           },
];

const ADDR_ICONS: Record<string, typeof Home> = { home: Home, work: Briefcase, other: Map };
const DEMO_ADDRESSES = [
  { id: 1, type: 'home', label: 'Ev', address: 'Üzeyir Hacıbəyov küçəsi 12, mənzil 4', detail: 'Bakı, AZ1001' },
  { id: 2, type: 'work', label: 'İş', address: 'Neftçilər prospekti 89, mərtəbə 3',    detail: 'Bakı, AZ1010' },
];

interface SavedCard { id: number; label: string; last4: string; expires: string; color: [string, string] }
const SAVED_CARDS: SavedCard[] = [
  { id: 1, label: 'Visa',       last4: '4242', expires: '12/27', color: ['#1a1a2e', '#16213e'] },
  { id: 2, label: 'Mastercard', last4: '8899', expires: '09/26', color: ['#eb5757', '#b83232'] },
];

function formatCardNum(v: string) { return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); }
function formatExpiry(v: string)  { const d = v.replace(/\D/g,'').slice(0,4); return d.length>2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; }

export default function CheckoutScreen() {
  const { goBack, setScreen, addToast, isQRSession, tableNumber, isLoggedIn, deliveryOnlyCard } = useUIStore();
  const { items, getSubtotal, getServiceFee, getTotal, clearCart } = useCartStore();
  const { addOrder } = useOrderStore();

  const [orderType,    setOrderType]    = useState<OrderType>(isQRSession ? 'dine_in' : 'take_away');
  const [payMethod,    setPayMethod]    = useState<PaymentMethod>('cash');
  const [promoCode,    setPromoCode]    = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading,      setLoading]      = useState(false);

  /* Delivery */
  const [selectedAddrId, setSelectedAddrId] = useState(DEMO_ADDRESSES[0]?.id ?? 0);

  /* Card */
  const [selectedCardId, setSelectedCardId] = useState<number>(SAVED_CARDS[0]?.id ?? 0);
  const [showNewCard,    setShowNewCard]    = useState(false);
  const [cardForm,       setCardForm]       = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [cardErrors,     setCardErrors]     = useState<Record<string, string>>({});
  const [showCvv,        setShowCvv]        = useState(false);

  const subtotal  = getSubtotal();
  const fee       = getServiceFee();
  const discount  = promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total     = Math.round((getTotal() - discount) * 100) / 100;

  const selectedAddr = DEMO_ADDRESSES.find((a) => a.id === selectedAddrId);

  /* Effective pay method: delivery forces card only when deliveryOnlyCard setting is on */
  const effectivePayMethod: PaymentMethod = (orderType === 'delivery' && deliveryOnlyCard) ? 'card' : payMethod;

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'FOOD10') {
      setPromoApplied(true);
      addToast('Promo kod tətbiq edildi! -10%', 'success');
    } else {
      addToast('Yanlış promo kod', 'error');
    }
  };

  const validateCard = () => {
    const digits = cardForm.number.replace(/\s/g, '');
    const e: Record<string, string> = {};
    if (digits.length < 16)        e.number = 'Kart nömrəsi 16 rəqəm olmalıdır';
    if (!cardForm.name.trim())     e.name   = 'Ad soyad tələb olunur';
    if (cardForm.expiry.length < 5) e.expiry = 'MM/YY formatında daxil edin';
    if (cardForm.cvv.length < 3)   e.cvv    = 'CVV 3 rəqəm';
    setCardErrors(e);
    return Object.keys(e).length === 0;
  };

  const addNewCard = () => {
    if (!validateCard()) return;
    const digits   = cardForm.number.replace(/\s/g, '');
    const newCard: SavedCard = {
      id: Date.now(),
      label: digits.startsWith('4') ? 'Visa' : 'Mastercard',
      last4: digits.slice(-4),
      expires: cardForm.expiry,
      color: digits.startsWith('4') ? ['#1a1a2e','#16213e'] : ['#eb5757','#b83232'],
    };
    SAVED_CARDS.push(newCard);
    setSelectedCardId(newCard.id);
    setShowNewCard(false);
    setCardForm({ number:'', name:'', expiry:'', cvv:'' });
    addToast('Kart əlavə edildi', 'success');
  };

  const canProceed = () => {
    if (orderType === 'delivery' && !isLoggedIn) return false;
    if (orderType === 'delivery' && !selectedAddr) return false;
    if (effectivePayMethod === 'card' && !showNewCard && !SAVED_CARDS.find((c) => c.id === selectedCardId)) return false;
    return true;
  };

  const handleOrder = () => {
    if (!canProceed()) {
      if (orderType === 'delivery' && !isLoggedIn) {
        addToast('Çatdırılma üçün daxil olun', 'error');
        return;
      }
      addToast('Zəruri məlumatları doldurun', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const isCard = effectivePayMethod === 'card';
      addOrder({
        id: generateOrderId(),
        items: [...items],
        status: 'new',
        orderType,
        paymentMethod: effectivePayMethod,
        paymentStatus: 'paid',
        subtotal,
        serviceFee: fee,
        discount,
        total,
        tableNumber: orderType === 'dine_in' ? tableNumber : 0,
        deliveryAddress: selectedAddr ? `${selectedAddr.address}, ${selectedAddr.detail}` : undefined,
        createdAt: getCurrentTime(),
        createdAtMs: Date.now(),
        estimatedTime: orderType === 'delivery' ? 35 : orderType === 'take_away' ? 15 : 18,
      });
      clearCart();
      setLoading(false);
      setScreen('orderSuccess');
    }, 1000);
  };

  const availableTypes = ORDER_TYPES;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a2e] px-4 pt-12 pb-4 flex items-center gap-3 border-b border-border-light shrink-0">
        <motion.button whileTap={{ scale: 0.92 }} onClick={goBack}
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <h2 className="font-outfit text-[17px] font-bold text-text-primary">Sifariş növü seç</h2>
      </div>

      {/* Scrollable content — CTA is INSIDE here */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-8">

        {/* ── Order Type ── */}
        <Section title="Sifariş növü" icon={<UtensilsCrossed size={16} className="text-primary" />}>
          <div className="grid gap-2 grid-cols-3">
            {availableTypes.map((t) => {
              const Icon   = t.icon;
              const active = orderType === t.id;
              return (
                <motion.button key={t.id} whileTap={{ scale: 0.95 }}
                  onClick={() => { setOrderType(t.id); if (t.id === 'delivery' && deliveryOnlyCard) setPayMethod('card'); }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                    active ? 'border-primary bg-primary-light' : 'border-transparent bg-surface-elevated'
                  }`}>
                  <Icon size={20} className={active ? 'text-primary' : 'text-text-secondary'} />
                  <p className={`text-[12px] font-bold text-center leading-tight ${active ? 'text-primary' : 'text-text-secondary'}`}>{t.label}</p>
                  <p className={`text-[10px] text-center leading-tight ${active ? 'text-primary/70' : 'text-text-tertiary'}`}>{t.sub}</p>
                </motion.button>
              );
            })}
          </div>

          {orderType === 'dine_in' && (
            <InfoBox>Masa {tableNumber} — sifariş masaya gətiriləcək</InfoBox>
          )}
          {orderType === 'take_away' && (
            <InfoBox>Sifariş hazır olduqda sizi məlumatlandıracağıq</InfoBox>
          )}
        </Section>

        {/* ── Delivery ── */}
        <AnimatePresence>
          {orderType === 'delivery' && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
              exit={{ opacity:0, height:0 }} transition={{ duration:0.28 }} className="overflow-hidden">
              <Section title="Çatdırılma ünvanı" icon={<MapPin size={16} className="text-primary" />}>
                {!isLoggedIn ? (
                  <motion.button whileTap={{ scale:0.97 }} onClick={() => setScreen('login')}
                    className="w-full flex items-center gap-3 p-3.5 bg-warning/10 rounded-xl border border-warning/30">
                    <AlertCircle size={16} className="text-warning shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-[13px] font-semibold text-warning">Hesabınıza daxil olun</p>
                      <p className="text-[11px] text-warning/70">Çatdırılma üçün giriş tələb olunur</p>
                    </div>
                    <LogIn size={15} className="text-warning shrink-0" />
                  </motion.button>
                ) : (
                  <div className="space-y-2">
                    {DEMO_ADDRESSES.map((addr) => {
                      const Icon   = ADDR_ICONS[addr.type] ?? Map;
                      const active = selectedAddrId === addr.id;
                      return (
                        <motion.button key={addr.id} whileTap={{ scale:0.98 }}
                          onClick={() => setSelectedAddrId(addr.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            active ? 'border-primary bg-primary-light' : 'border-transparent bg-surface-elevated'
                          }`}>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-primary' : 'bg-border-light'}`}>
                            <Icon size={15} className={active ? 'text-white' : 'text-text-secondary'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-bold ${active ? 'text-primary' : 'text-text-primary'}`}>{addr.label}</p>
                            <p className="text-[12px] text-text-secondary truncate">{addr.address}</p>
                            <p className="text-[11px] text-text-tertiary">{addr.detail}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${active ? 'border-primary bg-primary' : 'border-border'}`}>
                            {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </motion.button>
                      );
                    })}
                    <motion.button whileTap={{ scale:0.97 }} onClick={() => setScreen('addresses')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-primary/40 bg-white dark:bg-transparent">
                      <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                        <Plus size={15} className="text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[13px] font-semibold text-primary">Ünvan əlavə et / dəyişdir</p>
                        <p className="text-[11px] text-text-tertiary">Ünvanlarım səhifəsinə keçin</p>
                      </div>
                      <ChevronRight size={15} className="text-primary shrink-0" />
                    </motion.button>
                  </div>
                )}
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Payment Method ── */}
        <Section title="Ödəniş üsulu" icon={<CreditCard size={16} className="text-primary" />}>
          {orderType === 'delivery' && deliveryOnlyCard ? (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
              <CreditCard size={14} className="text-primary shrink-0" />
              <p className="text-[13px] text-primary font-medium">Çatdırılma üçün yalnız kart qəbul edilir</p>
            </div>
          ) : (
            <div className="flex gap-2">
              {(['cash', 'card'] as PaymentMethod[]).map((m) => {
                const Icon   = m === 'cash' ? Banknote : CreditCard;
                const label  = m === 'cash' ? 'Nağd' : 'Kart';
                const active = payMethod === m;
                return (
                  <motion.button key={m} whileTap={{ scale:0.96 }} onClick={() => setPayMethod(m)}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                      active ? 'border-primary bg-primary-light' : 'border-transparent bg-surface-elevated'
                    }`}>
                    <Icon size={22} className={active ? 'text-primary' : 'text-text-tertiary'} />
                    <span className={`text-[13px] font-semibold ${active ? 'text-primary' : 'text-text-secondary'}`}>{label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Saved cards (when card selected) */}
          <AnimatePresence>
            {effectivePayMethod === 'card' && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                exit={{ opacity:0, height:0 }} transition={{ duration:0.25 }} className="overflow-hidden">
                <div className="mt-3 space-y-2">
                  <p className="text-[12px] font-semibold text-text-secondary">Saxlanmış kartlar</p>
                  {SAVED_CARDS.map((card) => {
                    const active = selectedCardId === card.id && !showNewCard;
                    return (
                      <motion.button key={card.id} whileTap={{ scale:0.98 }}
                        onClick={() => { setSelectedCardId(card.id); setShowNewCard(false); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          active ? 'border-primary bg-primary-light' : 'border-transparent bg-surface-elevated'
                        }`}>
                        <div className="w-10 h-6 rounded" style={{ background: `linear-gradient(135deg,${card.color[0]},${card.color[1]})` }} />
                        <div className="flex-1 text-left">
                          <p className={`text-[13px] font-bold ${active ? 'text-primary' : 'text-text-primary'}`}>{card.label}</p>
                          <p className="text-[11px] text-text-secondary">•••• {card.last4} · {card.expires}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${active ? 'border-primary bg-primary' : 'border-border'}`}>
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </motion.button>
                    );
                  })}

                  {/* Add new card trigger */}
                  {!showNewCard && (
                    <motion.button whileTap={{ scale:0.97 }} onClick={() => { setShowNewCard(true); setSelectedCardId(0); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-primary/40 bg-white dark:bg-transparent">
                      <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                        <Plus size={14} className="text-primary" />
                      </div>
                      <span className="text-[13px] font-semibold text-primary">Yeni kart əlavə et</span>
                    </motion.button>
                  )}

                  {/* New card form */}
                  <AnimatePresence>
                    {showNewCard && (
                      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                        exit={{ opacity:0, y:8 }} transition={SPRING}
                        className="bg-surface-elevated rounded-xl p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-bold text-text-primary">Yeni kart</p>
                          <motion.button whileTap={{ scale:0.88 }}
                            onClick={() => { setShowNewCard(false); setCardErrors({}); setCardForm({ number:'', name:'', expiry:'', cvv:'' }); }}
                            className="w-7 h-7 rounded-full bg-border-light flex items-center justify-center">
                            <X size={12} className="text-text-secondary" />
                          </motion.button>
                        </div>
                        {/* Card number */}
                        <CardInput label="Kart nömrəsi" error={cardErrors.number}
                          input={<input type="text" inputMode="numeric" placeholder="0000 0000 0000 0000"
                            value={cardForm.number}
                            onChange={(e) => { setCardForm(f=>({...f, number: formatCardNum(e.target.value)})); setCardErrors(er=>({...er, number:''})); }}
                            className={inputCls(!!cardErrors.number)} />} />
                        <CardInput label="Kartdakı ad" error={cardErrors.name}
                          input={<input type="text" placeholder="AD SOYAD"
                            value={cardForm.name}
                            onChange={(e) => { setCardForm(f=>({...f, name: e.target.value.toUpperCase()})); setCardErrors(er=>({...er, name:''})); }}
                            className={inputCls(!!cardErrors.name)} />} />
                        <div className="grid grid-cols-2 gap-2">
                          <CardInput label="Son tarix" error={cardErrors.expiry}
                            input={<input type="text" inputMode="numeric" placeholder="MM/YY"
                              value={cardForm.expiry}
                              onChange={(e) => { setCardForm(f=>({...f, expiry: formatExpiry(e.target.value)})); setCardErrors(er=>({...er, expiry:''})); }}
                              className={inputCls(!!cardErrors.expiry)} />} />
                          <CardInput label="CVV" error={cardErrors.cvv}
                            input={
                              <div className="relative">
                                <input type={showCvv ? 'text' : 'password'} inputMode="numeric" placeholder="•••" maxLength={4}
                                  value={cardForm.cvv}
                                  onChange={(e) => { setCardForm(f=>({...f, cvv: e.target.value.replace(/\D/g,'').slice(0,4)})); setCardErrors(er=>({...er, cvv:''})); }}
                                  className={inputCls(!!cardErrors.cvv) + ' pr-8'} />
                                <button type="button" onClick={() => setShowCvv(v=>!v)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary">
                                  {showCvv ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            } />
                        </div>
                        <motion.button whileTap={{ scale:0.97 }} onClick={addNewCard}
                          className="w-full h-10 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-1.5"
                          style={{ background:'linear-gradient(135deg,#00c2e8,#00c2a8)' }}>
                          <Check size={14} /> Kartı əlavə et
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* ── Promo ── */}
        <Section title="Promo kod" icon={<Tag size={16} className="text-primary" />}>
          <div className="flex gap-2">
            <input type="text" placeholder="Kodu daxil edin…"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              disabled={promoApplied}
              className="flex-1 px-4 py-3 bg-surface-elevated rounded-xl text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 transition-all" />
            <motion.button whileTap={{ scale:0.94 }} onClick={applyPromo}
              disabled={promoApplied || !promoCode.trim()}
              className="px-4 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
              style={{ background:'linear-gradient(135deg,#00c2e8,#00c2a8)' }}>
              {promoApplied ? '✓' : 'Tətbiq et'}
            </motion.button>
          </div>
          <AnimatePresence>
            {promoApplied && (
              <motion.p initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="text-success text-[12px] font-semibold mt-2 flex items-center gap-1">
                <CheckCircle2 size={13} /> FOOD10 — 10% endirim tətbiq edildi
              </motion.p>
            )}
          </AnimatePresence>
        </Section>

        {/* ── Summary ── */}
        <Section title="Sifariş xülasəsi" icon={<CheckCircle2 size={16} className="text-primary" />}>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-[13px] py-1.5 border-b border-border-light last:border-0">
              <span className="text-text-secondary truncate flex-1 pr-2">{item.product.name} × {item.quantity}</span>
              <span className="font-medium text-text-primary shrink-0">{(item.unitPrice * item.quantity).toFixed(2)} AZN</span>
            </div>
          ))}
          <div className="mt-3 space-y-1.5">
            <SummaryRow label="Ara cəmi" value={`${subtotal.toFixed(2)} AZN`} />
            <SummaryRow label="Xidmət haqqı (10%)" value={`+${fee.toFixed(2)} AZN`} />
            {promoApplied && (
              <SummaryRow label="Endirim (FOOD10 -10%)" value={`-${discount.toFixed(2)} AZN`} valueClass="text-success font-semibold" />
            )}
            <div className="flex justify-between pt-2 border-t border-border-light mt-2">
              <span className="font-outfit text-[16px] font-bold text-text-primary">Ümumi</span>
              <span className="font-outfit text-[16px] font-bold text-primary">{total.toFixed(2)} AZN</span>
            </div>
          </div>
        </Section>

        {/* ── CTA button (INSIDE scroll) ── */}
        <div className="pt-2">
          {orderType === 'delivery' && !isLoggedIn ? (
            <div className="w-full flex items-center gap-2 p-3.5 bg-warning/10 rounded-xl border border-warning/30">
              <AlertCircle size={15} className="text-warning shrink-0" />
              <p className="text-[13px] text-warning font-medium">Çatdırılma üçün hesabınıza daxil olun</p>
            </div>
          ) : orderType === 'delivery' && !selectedAddr ? (
            <div className="w-full flex items-center gap-2 p-3.5 bg-warning/10 rounded-xl border border-warning/30">
              <AlertCircle size={15} className="text-warning shrink-0" />
              <p className="text-[13px] text-warning font-medium">Çatdırılma ünvanı seçin</p>
            </div>
          ) : effectivePayMethod === 'card' && !selectedCardId && !showNewCard ? (
            <div className="w-full flex items-center gap-2 p-3.5 bg-warning/10 rounded-xl border border-warning/30">
              <AlertCircle size={15} className="text-warning shrink-0" />
              <p className="text-[13px] text-warning font-medium">Kart seçin və ya yeni əlavə edin</p>
            </div>
          ) : (
            <motion.button whileTap={{ scale:0.97 }} onClick={handleOrder}
              disabled={loading || items.length === 0 || showNewCard}
              className="w-full py-4 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2 shadow-primary-glow disabled:opacity-70"
              style={{ background:'linear-gradient(135deg,#00c2e8,#00c2a8)' }}>
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : effectivePayMethod === 'card' ? (
                <><Lock size={16} /> Ödəniş et — {total.toFixed(2)} AZN</>
              ) : (
                `Sifariş ver — ${total.toFixed(2)} AZN`
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-4 shadow-xs border border-border-light">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-outfit text-[15px] font-bold text-text-primary">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
      className="mt-2 flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
      <CheckCircle2 size={15} className="text-primary shrink-0" />
      <p className="text-[13px] text-primary font-medium">{children}</p>
    </motion.div>
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

function CardInput({ label, error, input }: { label: string; error?: string; input: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-secondary mb-1">{label}</p>
      {input}
      {error && <p className="text-coral text-[10px] mt-0.5">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full h-10 px-3 rounded-xl border text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors ${
    hasError ? 'border-coral bg-coral/5' : 'border-border-light bg-white dark:bg-[#22223a]'
  }`;
}
