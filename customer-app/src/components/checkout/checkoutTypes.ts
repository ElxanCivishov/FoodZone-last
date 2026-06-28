import type { OrderType } from "@/types";
import { Briefcase, Home, Map, ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";

export { SPRING } from "@/utils/motion";

export const ORDER_TYPES = [
  { id: "dine_in" as OrderType, label: "Masa", sub: "Masaya gətirilir", icon: UtensilsCrossed },
  { id: "take_away" as OrderType, label: "Take Away", sub: "Özünüz alırsınız", icon: ShoppingBag },
  { id: "delivery" as OrderType, label: "Çatdırılma", sub: "Ünvanınıza göndərilir", icon: Truck },
];

export const ADDR_ICONS: Record<string, typeof Home> = {
  home: Home,
  work: Briefcase,
  other: Map,
};

export const DEMO_ADDRESSES = [
  { id: 1, type: "home", label: "Ev", address: "Üzeyir Hacıbəyov küçəsi 12, mənzil 4", detail: "Bakı, AZ1001" },
  { id: 2, type: "work", label: "İş", address: "Neftçilər prospekti 89, mərtəbə 3", detail: "Bakı, AZ1010" },
];

export interface SavedCard {
  id: number;
  label: string;
  last4: string;
  expires: string;
  color: [string, string];
}

export const SAVED_CARDS: SavedCard[] = [
  { id: 1, label: "Visa", last4: "4242", expires: "12/27", color: ["#1a1a2e", "#16213e"] },
  { id: 2, label: "Mastercard", last4: "8899", expires: "09/26", color: ["#eb5757", "#b83232"] },
];

export function formatCardNum(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
