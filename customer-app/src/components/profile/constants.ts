import type { Screen } from "@/types";
import {
  Award,
  Bell,
  CreditCard,
  Globe,
  Heart,
  HelpCircle,
  MapPin,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  Star,
  Tag,
} from "lucide-react";
import type React from "react";

export { SPRING } from "@/utils/motion";

export const MOCK_XP = 240; // TODO: fetch from Customer API

export const STATS = [
  { icon: Package, labelKey: "orders", value: "12" },
  { icon: Star, labelKey: "reviewCount", value: "8" },
  { icon: Award, labelKey: "points", value: "240" },
];

export type MenuItem = {
  icon: React.ElementType;
  labelKey: string;
  screen?: Screen;
  badge?: string;
  action?: "language";
};

export const GROUPS: { titleKey: string; items: MenuItem[] }[] = [
  {
    titleKey: "activity",
    items: [
      { icon: Receipt, labelKey: "orderHistory", screen: "orderHistory" },
      { icon: Heart, labelKey: "favorites", screen: "favorites" },
      { icon: Bell, labelKey: "waiterRequests", screen: "waiterRequests" },
    ],
  },
  {
    titleKey: "account",
    items: [
      { icon: CreditCard, labelKey: "payments", screen: "payments" },
      { icon: Tag, labelKey: "coupons", screen: "coupons" },
      { icon: MapPin, labelKey: "addresses", screen: "addresses" },
    ],
  },
  {
    titleKey: "feedbackSupport",
    items: [
      { icon: Star, labelKey: "myReviews", screen: "reviews" },
      { icon: MessageSquare, labelKey: "supportRequests", screen: "supportRequests" },
      { icon: HelpCircle, labelKey: "help", screen: "help" },
    ],
  },
  {
    titleKey: "preferences",
    items: [
      { icon: Globe, labelKey: "language", badge: "AZ", action: "language" },
      { icon: Settings, labelKey: "settings", screen: "settings" },
    ],
  },
];
