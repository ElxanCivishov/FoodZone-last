import CancellationBanner from "@/components/order-detail/CancellationBanner";
import CancelSheet from "@/components/order-detail/CancelSheet";
import { SPRING, STATUS_CONFIG, STEPS_BY_TYPE } from "@/components/order-detail/constants";
import OrderDetailHeader from "@/components/order-detail/OrderDetailHeader";
import OrderItemsCard from "@/components/order-detail/OrderItemsCard";
import OrderLocationCard from "@/components/order-detail/OrderLocationCard";
import OrderTotalsCard from "@/components/order-detail/OrderTotalsCard";
import PaymentPendingBanner from "@/components/order-detail/PaymentPendingBanner";
import StatusCard from "@/components/order-detail/StatusCard";
import { useOrderStore, useUIStore } from "@/store";
import type { OrderType } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Receipt, Star, XCircle } from "lucide-react";
import { useState } from "react";
import { useT } from "@/hooks/useT";

export default function OrderDetailScreen() {
  const t = useT();
  const { goBack, setScreen } = useUIStore();
  const { currentOrder, cancelOrder, payOrder } = useOrderStore();

  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  if (!currentOrder) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-canvas flex flex-col items-center justify-center gap-4"
      >
        <Receipt size={40} className="text-text-tertiary" />
        <p className="text-text-secondary text-[15px]">{t.order.notFound}</p>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={goBack}
          className="px-6 py-2.5 rounded-xl bg-primary text-white text-[14px] font-semibold"
        >
          {t.order.goBack}
        </motion.button>
      </motion.div>
    );
  }

  const order = currentOrder;
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.new;
  const orderType = (order.orderType ?? "dine_in") as OrderType;
  const steps = STEPS_BY_TYPE[orderType] ?? STEPS_BY_TYPE.dine_in;

  const elapsedMs = Date.now() - (order.createdAtMs ?? 0);
  const canCancel =
    elapsedMs < 120_000 &&
    !["cancelled", "completed", "delivered"].includes(order.status);
  const canPay = order.status === "payment_pending";

  const submitCancel = () => {
    const reason =
      selectedReason === "other"
        ? customReason.trim()
        : t.order.cancelReasons[selectedReason as keyof typeof t.order.cancelReasons];
    if (!reason) return;
    cancelOrder(order.id, reason);
    setShowCancelSheet(false);
  };

  const handlePayNow = () => {
    payOrder(order.id);
    setScreen("payment");
  };

  const currentStatusIndex = Math.max(
    0,
    steps.findIndex((s) => s.status === order.status),
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={SPRING}
        className="absolute inset-0 bg-canvas flex flex-col"
      >
        <OrderDetailHeader
          orderId={order.id}
          createdAt={order.createdAt}
          orderType={orderType}
          onBack={goBack}
        />

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 space-y-3">
          <AnimatePresence>
            {canPay && <PaymentPendingBanner onPayNow={handlePayNow} />}
          </AnimatePresence>

          {order.status === "cancelled" && order.cancellationReason && (
            <CancellationBanner reason={order.cancellationReason} />
          )}

          <StatusCard
            status={order.status}
            cfg={cfg}
            orderType={orderType}
            tableNumber={order.tableNumber}
            estimatedTime={order.estimatedTime}
            steps={steps}
            currentStatusIndex={currentStatusIndex}
          />

          <OrderItemsCard items={order.items} />

          <OrderTotalsCard
            subtotal={order.subtotal}
            serviceFee={order.serviceFee}
            discount={order.discount}
            total={order.total}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
          />

          <OrderLocationCard
            orderType={orderType}
            deliveryAddress={order.deliveryAddress}
            tableNumber={order.tableNumber}
          />

          {canCancel && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, ...SPRING }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCancelSheet(true)}
                className="w-full flex items-center gap-3 p-4 bg-coral/5 border border-coral/20 rounded-2xl"
              >
                <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center shrink-0">
                  <XCircle size={18} className="text-coral" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-[14px] font-semibold text-coral">
                    {t.order.cancelOrder}
                  </p>
                  <p className="text-[12px] text-coral/60">
                    {t.order.cancelWindow}
                  </p>
                </div>
              </motion.button>
            </motion.div>
          )}

          {order.status === "completed" && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, ...SPRING }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center gap-3 p-4 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs"
            >
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Star size={18} className="text-warning" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-semibold text-text-primary">
                  {t.modal.feedback}
                </p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  {t.order.rateThisOrder}
                </p>
              </div>
            </motion.button>
          )}
        </div>
      </motion.div>

      <CancelSheet
        show={showCancelSheet}
        onClose={() => setShowCancelSheet(false)}
        selectedReason={selectedReason}
        setSelectedReason={setSelectedReason}
        customReason={customReason}
        setCustomReason={setCustomReason}
        onSubmit={submitCancel}
        paymentMethod={order.paymentMethod}
      />
    </>
  );
}
