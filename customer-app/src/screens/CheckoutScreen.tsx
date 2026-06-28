import CheckoutCTA from "@/components/checkout/CheckoutCTA";
import DeliverySection from "@/components/checkout/DeliverySection";
import OrderSummarySection from "@/components/checkout/OrderSummarySection";
import OrderTypeSection from "@/components/checkout/OrderTypeSection";
import PaymentSection from "@/components/checkout/PaymentSection";
import PromoSection from "@/components/checkout/PromoSection";
import {
  DEMO_ADDRESSES,
  SAVED_CARDS,
  SPRING,
  type SavedCard,
} from "@/components/checkout/checkoutTypes";
import { useCartStore, useOrderStore, useUIStore } from "@/store";
import type { OrderType, PaymentMethod } from "@/types";
import { generateOrderId, getCurrentTime } from "@/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useT } from "@/hooks/useT";

export default function CheckoutScreen() {
  const {
    goBack,
    setScreen,
    addToast,
    isQRSession,
    tableNumber,
    isLoggedIn,
    deliveryOnlyCard,
  } = useUIStore();
  const { items, getSubtotal, getServiceFee, getTotal, clearCart } =
    useCartStore();
  const { addOrder } = useOrderStore();
  const t = useT();

  const [orderType, setOrderType] = useState<OrderType>(
    isQRSession ? "dine_in" : "take_away",
  );
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAddrId, setSelectedAddrId] = useState(
    DEMO_ADDRESSES[0]?.id ?? 0,
  );
  const [selectedCardId, setSelectedCardId] = useState<number>(
    SAVED_CARDS[0]?.id ?? 0,
  );
  const [showNewCard, setShowNewCard] = useState(false);

  const subtotal = getSubtotal();
  const fee = getServiceFee();
  const discount = promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total = Math.round((getTotal() - discount) * 100) / 100;
  const selectedAddr = DEMO_ADDRESSES.find((a) => a.id === selectedAddrId);
  const effectivePayMethod: PaymentMethod =
    orderType === "delivery" && deliveryOnlyCard ? "card" : payMethod;

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === "FOOD10") {
      setPromoApplied(true);
      addToast(`${t.checkout.promoApplied}`, "success");
    } else {
      addToast(t.coupons.invalid, "error");
    }
  };

  const handleCardAdded = (card: SavedCard) => {
    SAVED_CARDS.push(card);
    setSelectedCardId(card.id);
    setShowNewCard(false);
    addToast(t.checkout.addCard, "success");
  };

  const handleOrder = () => {
    if (orderType === "delivery" && !isLoggedIn) {
      addToast(t.checkout.loginForDelivery, "error");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      addOrder({
        id: generateOrderId(),
        items: [...items],
        status: "new",
        orderType,
        paymentMethod: effectivePayMethod,
        paymentStatus: "paid",
        subtotal,
        serviceFee: fee,
        discount,
        total,
        tableNumber: orderType === "dine_in" ? tableNumber : 0,
        deliveryAddress: selectedAddr
          ? `${selectedAddr.address}, ${selectedAddr.detail}`
          : undefined,
        createdAt: getCurrentTime(),
        createdAtMs: Date.now(),
        estimatedTime:
          orderType === "delivery" ? 35 : orderType === "take_away" ? 15 : 18,
      });
      clearCart();
      setLoading(false);
      setScreen("orderSuccess");
    }, 1000);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={SPRING}
      className="absolute inset-0 bg-canvas flex flex-col"
    >
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a2e] px-4 py-4 flex items-center gap-3 border-b border-border-light shrink-0">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </motion.button>
        <h2 className="font-outfit text-[17px] font-bold text-text-primary">
          {t.checkout.chooseOrderType}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-8">
        <OrderTypeSection
          orderType={orderType}
          tableNumber={tableNumber}
          onChange={(type) => {
            setOrderType(type);
            if (type === "delivery" && deliveryOnlyCard) setPayMethod("card");
          }}
        />

        <AnimatePresence>
          {orderType === "delivery" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28 }}
              className="overflow-hidden"
            >
              <DeliverySection
                isLoggedIn={isLoggedIn}
                selectedAddrId={selectedAddrId}
                onSelectAddr={setSelectedAddrId}
                onLogin={() => setScreen("login")}
                onManageAddresses={() => setScreen("addresses")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <PaymentSection
          orderType={orderType}
          payMethod={payMethod}
          deliveryOnlyCard={deliveryOnlyCard}
          effectivePayMethod={effectivePayMethod}
          selectedCardId={selectedCardId}
          showNewCard={showNewCard}
          onChange={setPayMethod}
          onSelectCard={(id) => {
            setSelectedCardId(id);
            setShowNewCard(false);
          }}
          onShowNewCard={() => {
            setShowNewCard(true);
            setSelectedCardId(0);
          }}
          onCardAdded={handleCardAdded}
          onCancelNewCard={() => setShowNewCard(false)}
        />

        <PromoSection
          promoCode={promoCode}
          promoApplied={promoApplied}
          onChange={setPromoCode}
          onApply={applyPromo}
        />

        <OrderSummarySection
          items={items}
          subtotal={subtotal}
          fee={fee}
          discount={discount}
          total={total}
          promoApplied={promoApplied}
        />

        <div className="pt-2">
          <CheckoutCTA
            orderType={orderType}
            isLoggedIn={isLoggedIn}
            hasAddr={!!selectedAddr}
            effectivePayMethod={effectivePayMethod}
            selectedCardId={selectedCardId}
            showNewCard={showNewCard}
            loading={loading}
            total={total}
            itemsEmpty={items.length === 0}
            onOrder={handleOrder}
          />
        </div>
      </div>
    </motion.div>
  );
}
