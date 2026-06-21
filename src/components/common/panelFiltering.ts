import { Order } from "@/types";
import { PanelFilterState } from "./PanelFilters";

type TableLike = {
  table?: { number?: string | number | null } | null;
  tableId: string;
};

export function normalizePanelValue(value?: string | null) {
  return (value ?? "").toLowerCase().trim();
}

export function panelTableNumber(item: TableLike) {
  return item.table?.number ?? item.tableId.slice(-4);
}

export function orderMatchesPanelFilters(
  order: Order,
  filters: PanelFilterState,
  options: { includeCancelReason?: boolean } = {},
) {
  const table = String(panelTableNumber(order));
  const query = normalizePanelValue(filters.query);
  const tableQuery = normalizePanelValue(filters.table);
  const searchable = normalizePanelValue(
    [
      order.orderNumber,
      table,
      order.specialRequest,
      options.includeCancelReason ? order.cancelReason : undefined,
      ...order.items.flatMap((item) => [
        item.product?.name,
        item.productId,
        item.specialNote,
        ...(item.extras?.map((extra) => extra.name) ?? []),
      ]),
    ]
      .filter(Boolean)
      .join(" "),
  );
  const hasNote =
    !!order.specialRequest ||
    (options.includeCancelReason && !!order.cancelReason) ||
    order.items.some(
      (item) => !!item.specialNote || (item.extras?.length ?? 0) > 0,
    );

  return (
    (!query || searchable.includes(query)) &&
    (!tableQuery || normalizePanelValue(table).includes(tableQuery)) &&
    (!filters.notesOnly || hasNote)
  );
}
