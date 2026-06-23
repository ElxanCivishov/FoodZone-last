import { Fragment, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XCircle } from "lucide-react";
import { Order } from "@/types";
import {
  getOrderFulfillmentLabel,
  getOrderFulfillmentType,
  getOrderPrimaryLabel,
} from "@/utils/orderDisplay";

export function ConfirmCancelModal({
  order,
  onConfirm,
  onClose,
  t,
}: {
  order: Order;
  onConfirm: (cancelReason?: string) => void;
  onClose: () => void;
  t: (k: string) => string;
}) {
  const fulfillmentType = getOrderFulfillmentType(order);
  const orderLabel =
    fulfillmentType === "dine_in"
      ? getOrderPrimaryLabel(order, t)
      : getOrderFulfillmentLabel(fulfillmentType, t);
  const [cancelReason, setCancelReason] = useState("");
  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        {/* Panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="bg-surface-elevated border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              {/* Icon + order info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-danger-500/10 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6 text-danger-500" />
                </div>
                <div>
                  <DialogTitle className="font-bold text-base">
                    {t("kitchen.cancelOrder")}
                  </DialogTitle>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {orderLabel} &mdash; #{order.orderNumber}
                  </p>
                </div>
              </div>

              {/* Items summary */}
              <div className="bg-surface rounded-xl border border-border p-3 mb-4 space-y-1 max-h-32 overflow-y-auto">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-md bg-primary-500/10 text-primary-500 text-xs font-bold flex items-center justify-center shrink-0">
                      {item.quantity}
                    </span>
                    <span className="text-foreground truncate">
                      {item.product?.name ?? item.productId}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-foreground-muted mb-5">
                {t("kitchen.cancelConfirmMessage")}
              </p>

              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t("kitchen.cancelReasonPlaceholder")}
                maxLength={300}
                className="w-full min-h-[76px] resize-none rounded-xl border border-border bg-surface p-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary-500 focus:outline-none mb-4"
              />

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => onConfirm(cancelReason.trim() || undefined)}
                  className="flex-1 h-10 rounded-xl bg-danger-500 hover:bg-danger-600 text-white text-sm font-semibold transition-all"
                >
                  {t("kitchen.cancelOrder")}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
