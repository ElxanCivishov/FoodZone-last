import React from "react";
import { Order, OrderStatus } from "@/types";

export const COLUMN_DROP_STATUS: Record<string, OrderStatus> = {
  preparing: "preparing",
  ready: "ready",
  served: "served",
};

export const VALID_DRAG_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["preparing"],
  confirmed: ["preparing"],
  preparing: ["ready"],
  ready: ["served", "preparing"],
};

export const LANGS = ["az", "en", "ru", "tr"] as const;
export const ETA_OPTIONS = [10, 15, 20, 30] as const;

export type ColumnId = "new" | "preparing" | "ready" | "served" | "cancelled";

export interface ColDef {
  id: ColumnId;
  label: string;
  Icon: React.ElementType;
  orders: Order[];
  colorBorder: string;
  colorBg: string;
  colorText: string;
  metricTone: string;
  allowDrop: boolean;
}
