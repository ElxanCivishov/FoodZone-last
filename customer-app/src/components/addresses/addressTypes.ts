import { Briefcase, Home, Map } from "lucide-react";

export interface Address {
  id: number;
  type: "home" | "work" | "other";
  label: string;
  address: string;
  detail: string;
}

export const TYPE_ICONS = { home: Home, work: Briefcase, other: Map };

export const TYPE_OPTS: { id: Address["type"] }[] = [
  { id: "home" },
  { id: "work" },
  { id: "other" },
];

export { SPRING } from "@/utils/motion";
