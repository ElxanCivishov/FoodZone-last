import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import {
  ChevronDown,
  Filter,
  Hash,
  MessageSquareText,
  RotateCcw,
  Search,
  Table2,
} from "lucide-react";
import { Tooltip } from "@/components/common/Tooltip";
import { cn } from "@/utils/cn";

export interface PanelFilterState {
  query: string;
  table: string;
  type: string;
  notesOnly: boolean;
}

export const DEFAULT_PANEL_FILTERS: PanelFilterState = {
  query: "",
  table: "",
  type: "all",
  notesOnly: false,
};

export function countPanelFilters(filters: PanelFilterState) {
  return [
    filters.query.trim(),
    filters.table.trim(),
    filters.type !== "all",
    filters.notesOnly,
  ].filter(Boolean).length;
}

interface PanelFiltersProps {
  filters: PanelFilterState;
  onChange: (filters: PanelFilterState) => void;
  onReset: () => void;
  typeOptions?: Array<{ value: string; label: string }>;
  activeCount?: number;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export function PanelFilters({
  filters,
  onChange,
  onReset,
  typeOptions = [],
  activeCount = countPanelFilters(filters),
  t,
}: PanelFiltersProps) {
  const update = (patch: Partial<PanelFilterState>) =>
    onChange({ ...filters, ...patch });

  const resolvedTypeOptions = [
    { value: "all", label: t("filters.allTypes") },
    ...typeOptions,
  ];
  const selectedType =
    resolvedTypeOptions.find((option) => option.value === filters.type) ??
    resolvedTypeOptions[0];

  return (
    <Popover className="relative">
      <PopoverButton
        className={cn(
          "relative w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors focus:outline-none",
          activeCount > 0 && "border-primary-500/40 text-primary-500 bg-primary-500/10",
        )}
      >
        <Filter className="w-4 h-4" />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel
        anchor="bottom end"
        transition
        className={cn(
          "z-[9999] w-[min(92vw,320px)] rounded-2xl border border-border bg-surface-elevated p-3 shadow-2xl focus:outline-none",
          "[--anchor-gap:8px]",
          "transition duration-100 ease-out",
          "data-[closed]:scale-95 data-[closed]:opacity-0",
        )}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary-500" />
            <p className="text-sm font-bold">{t("filters.title")}</p>
          </div>
          <Tooltip content={t("common.clearFilters")} side="bottom">
            <span className="inline-flex">
              <button
                onClick={onReset}
                disabled={activeCount === 0}
                className="h-8 px-2 rounded-lg text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-surface transition-colors disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </span>
          </Tooltip>
        </div>

        <div className="space-y-2.5">
          <label className="block">
            <span className="text-[11px] font-semibold text-foreground-muted">
              {t("filters.search")}
            </span>
            <div className="mt-1 h-10 rounded-xl border border-border bg-surface flex items-center gap-2 px-3">
              <Search className="w-4 h-4 text-foreground-muted shrink-0" />
              <input
                value={filters.query}
                onChange={(e) => update({ query: e.target.value })}
                placeholder={t("filters.searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-foreground-muted">
              {t("filters.table")}
            </span>
            <div className="mt-1 h-10 rounded-xl border border-border bg-surface flex items-center gap-2 px-3">
              <Table2 className="w-4 h-4 text-foreground-muted shrink-0" />
              <input
                value={filters.table}
                onChange={(e) => update({ table: e.target.value })}
                placeholder={t("filters.tablePlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
              />
            </div>
          </label>

          {typeOptions.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-foreground-muted">
                {t("filters.type")}
              </span>
              <Listbox
                value={filters.type}
                onChange={(value) => update({ type: value })}
              >
                <ListboxButton className="mt-1 w-full h-10 rounded-xl border border-border bg-surface px-3 flex items-center gap-2 text-sm text-left focus:outline-none">
                  <Hash className="w-4 h-4 text-foreground-muted shrink-0" />
                  <span className="flex-1 truncate">{selectedType.label}</span>
                  <ChevronDown className="w-4 h-4 text-foreground-muted shrink-0" />
                </ListboxButton>
                <ListboxOptions
                  anchor="bottom"
                  transition
                  className="z-[10000] w-[var(--button-width)] rounded-xl border border-border bg-surface-elevated py-1 shadow-xl focus:outline-none [--anchor-gap:4px] data-[closed]:scale-95 data-[closed]:opacity-0"
                >
                  {resolvedTypeOptions.map((option) => (
                    <ListboxOption
                      key={option.value}
                      value={option.value}
                      className={({ focus, selected }) =>
                        cn(
                          "px-3 py-2 text-xs font-semibold cursor-pointer transition-colors",
                          focus && "bg-primary-500/10 text-primary-500",
                          selected && !focus && "text-primary-500",
                          !focus && !selected && "text-foreground-muted",
                        )
                      }
                    >
                      {option.label}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Listbox>
            </div>
          )}

          <button
            type="button"
            onClick={() => update({ notesOnly: !filters.notesOnly })}
            className={cn(
              "w-full h-10 rounded-xl border px-3 flex items-center gap-2 text-sm font-semibold transition-colors",
              filters.notesOnly
                ? "border-primary-500/40 bg-primary-500/10 text-primary-500"
                : "border-border bg-surface text-foreground-muted hover:text-foreground",
            )}
          >
            <MessageSquareText className="w-4 h-4" />
            {t("filters.notesOnly")}
          </button>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
