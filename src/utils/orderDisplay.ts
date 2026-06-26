import type { Order, OrderFulfillmentType } from "@/types";

type TFn = (key: string, options?: Record<string, unknown>) => string;

export const orderFulfillmentTypes: OrderFulfillmentType[] = [
  "delivery",
  "takeaway",
  "dine_in",
];

const fulfillmentFallbackLabels: Record<OrderFulfillmentType, string> = {
  delivery: "Delivery",
  takeaway: "Takeaway",
  dine_in: "Dine-in",
};

export function getOrderFulfillmentType(order: Pick<Order, "fulfillmentType">) {
  return order.fulfillmentType ?? "dine_in";
}

export function getOrderTableNumber(
  order: Pick<Order, "table" | "tableId">,
) {
  return order.table?.number ?? order.tableId?.slice(-4) ?? "-";
}

export function getOrderFulfillmentLabel(
  type: OrderFulfillmentType,
  t: TFn,
) {
  const key = `order.fulfillment.${type}`;
  const label = t(key);
  return label === key ? fulfillmentFallbackLabels[type] : label;
}

export function getOrderPrimaryLabel(order: Order, t: TFn) {
  const type = getOrderFulfillmentType(order);
  if (type === "dine_in") {
    return `${t("kitchen.table")} ${getOrderTableNumber(order)}`;
  }
  const customer = order.customerName?.trim() || `#${order.orderNumber}`;
  return `${getOrderFulfillmentLabel(type, t)} · ${customer}`;
}

export function getOrderSecondaryLabel(order: Order) {
  const type = getOrderFulfillmentType(order);
  if (type === "delivery") {
    return order.deliveryAddress || order.customerPhone || "";
  }
  if (type === "takeaway") {
    return order.customerPhone || "";
  }
  return "";
}

export function getOrderFulfillmentTone(type: OrderFulfillmentType) {
  const tones: Record<OrderFulfillmentType, string> = {
    delivery: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    takeaway: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    dine_in: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };
  return tones[type];
}

export function getOrderFulfillmentAccent(type: OrderFulfillmentType) {
  const accents: Record<
    OrderFulfillmentType,
    { bar: string; border: string; ring: string }
  > = {
    delivery: {
      bar: "bg-sky-500",
      border: "border-sky-500/35",
      ring: "ring-sky-500/20",
    },
    takeaway: {
      bar: "bg-violet-500",
      border: "border-violet-500/35",
      ring: "ring-violet-500/20",
    },
    dine_in: {
      bar: "bg-emerald-500",
      border: "border-emerald-500/35",
      ring: "ring-emerald-500/20",
    },
  };
  return accents[type];
}

export function getOrderSearchText(order: Order, t: TFn) {
  return [
    order.orderNumber,
    getOrderPrimaryLabel(order, t),
    getOrderSecondaryLabel(order),
    order.customerName,
    order.customerPhone,
    order.deliveryAddress,
    order.deliveryNote,
    getOrderTableNumber(order),
  ]
    .filter(Boolean)
    .join(" ");
}
