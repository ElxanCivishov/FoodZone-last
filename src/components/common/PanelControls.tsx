import type React from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import {
  ChevronDown,
  Clock,
  Globe,
  Maximize2,
  Minimize2,
  Moon,
  RefreshCw,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SOUND_DURATION_OPTIONS, SoundDuration } from "@/hooks/useSoundSettings";
import { cn } from "@/utils/cn";
import { Tooltip } from "./Tooltip";

const PANEL_LANGS = ["az", "en", "ru", "tr"] as const;

type TooltipSide = "top" | "bottom";

export function PanelHeaderBrand({
  icon: Icon,
  title,
  subtitle,
  iconClassName,
  iconWrapClassName,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  iconClassName: string;
  iconWrapClassName: string;
}) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          iconWrapClassName,
        )}
      >
        <Icon className={cn("w-5 h-5", iconClassName)} />
      </div>
      <div className="hidden sm:block">
        <h1 className="font-bold text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-foreground-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

export function PanelControlScroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center gap-2 w-max ml-auto">{children}</div>
    </div>
  );
}

export function PanelLanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (lang: string) => void;
}) {
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton className="group flex items-center gap-1.5 bg-surface border border-border rounded-xl px-2.5 py-1.5 cursor-pointer hover:border-primary-500/50 transition-colors focus:outline-none">
        <Globe className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
        <span className="text-xs font-bold uppercase text-foreground">
          {value}
        </span>
        <ChevronDown className="w-3 h-3 text-foreground-muted transition-transform duration-150 group-data-[open]:rotate-180" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom end"
        transition
        className={cn(
          "z-[9999] w-20 bg-surface-elevated border border-border rounded-xl shadow-xl overflow-hidden py-1 focus:outline-none",
          "[--anchor-gap:6px]",
          "transition duration-100 ease-out",
          "data-[closed]:scale-95 data-[closed]:opacity-0",
        )}
      >
        {PANEL_LANGS.map((lang) => (
          <ListboxOption
            key={lang}
            value={lang}
            className={({ focus, selected }) =>
              cn(
                "px-3 py-1.5 text-xs font-bold uppercase cursor-pointer transition-colors",
                focus && "bg-primary-500/10 text-primary-500",
                selected && !focus && "text-primary-500",
                !focus && !selected && "text-foreground-muted",
              )
            }
          >
            {lang.toUpperCase()}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

export function PanelIconButton({
  tooltip,
  children,
  className,
  activeClassName,
  active = false,
  side = "bottom",
  ...buttonProps
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tooltip: string;
  children: React.ReactNode;
  active?: boolean;
  activeClassName?: string;
  side?: TooltipSide;
}) {
  return (
    <Tooltip content={tooltip} side={side}>
      <button
        {...buttonProps}
        className={cn(
          "w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors disabled:opacity-60",
          active && (activeClassName ?? "bg-primary-500/10 border-primary-500/30 text-primary-500"),
          className,
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function PanelSoundDurationSelect({
  value,
  onChange,
  tooltip,
}: {
  value: SoundDuration;
  onChange: (value: SoundDuration) => void;
  tooltip: string;
}) {
  return (
    <Tooltip content={tooltip} side="bottom">
      <div>
        <Listbox value={value} onChange={onChange}>
          <ListboxButton className="group h-9 rounded-xl border border-border bg-surface px-2.5 flex items-center gap-1.5 text-foreground-muted hover:text-foreground transition-colors focus:outline-none">
            <Clock className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold tabular-nums text-foreground">
              {value}s
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-150 group-data-[open]:rotate-180" />
          </ListboxButton>
          <ListboxOptions
            anchor="bottom end"
            transition
            className={cn(
              "z-[9999] w-20 bg-surface-elevated border border-border rounded-xl shadow-xl overflow-hidden py-1 focus:outline-none",
              "[--anchor-gap:6px]",
              "transition duration-100 ease-out",
              "data-[closed]:scale-95 data-[closed]:opacity-0",
            )}
          >
            {SOUND_DURATION_OPTIONS.map((seconds) => (
              <ListboxOption
                key={seconds}
                value={seconds}
                className={({ focus, selected }) =>
                  cn(
                    "px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors",
                    focus && "bg-primary-500/10 text-primary-500",
                    selected && !focus && "text-primary-500",
                    !focus && !selected && "text-foreground-muted",
                  )
                }
              >
                {seconds}s
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
      </div>
    </Tooltip>
  );
}

export function PanelSoundToggle({
  enabled,
  onToggle,
  muteLabel,
  unmuteLabel,
}: {
  enabled: boolean;
  onToggle: () => void;
  muteLabel: string;
  unmuteLabel: string;
}) {
  return (
    <PanelIconButton
      tooltip={enabled ? muteLabel : unmuteLabel}
      onClick={onToggle}
    >
      {enabled ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <VolumeX className="w-4 h-4 text-danger-500" />
      )}
    </PanelIconButton>
  );
}

export function PanelThemeToggle({
  isDark,
  onToggle,
  lightLabel,
  darkLabel,
}: {
  isDark: boolean;
  onToggle: () => void;
  lightLabel: string;
  darkLabel: string;
}) {
  return (
    <PanelIconButton
      tooltip={isDark ? lightLabel : darkLabel}
      onClick={onToggle}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </PanelIconButton>
  );
}

export function PanelFullscreenToggle({
  isFullscreen,
  onToggle,
  enterLabel,
  exitLabel,
}: {
  isFullscreen: boolean;
  onToggle: () => void;
  enterLabel: string;
  exitLabel: string;
}) {
  return (
    <PanelIconButton
      tooltip={isFullscreen ? exitLabel : enterLabel}
      onClick={onToggle}
    >
      {isFullscreen ? (
        <Minimize2 className="w-4 h-4" />
      ) : (
        <Maximize2 className="w-4 h-4" />
      )}
    </PanelIconButton>
  );
}

export function PanelRefreshButton({
  onRefresh,
  loading,
  label,
}: {
  onRefresh: () => void;
  loading: boolean;
  label: string;
}) {
  return (
    <PanelIconButton tooltip={label} onClick={onRefresh}>
      <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
    </PanelIconButton>
  );
}

export function PanelConnectionBadge({
  connected,
  connectedLabel,
  disconnectedLabel,
}: {
  connected: boolean;
  connectedLabel: string;
  disconnectedLabel: string;
}) {
  return (
    <div
      className={cn(
        "hidden sm:flex px-3 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 border",
        connected
          ? "bg-success-500/10 text-success-500 border-success-500/20"
          : "bg-danger-500/10 text-danger-500 border-danger-500/20",
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          connected ? "bg-success-500 animate-pulse" : "bg-danger-500",
        )}
      />
      {connected ? connectedLabel : disconnectedLabel}
    </div>
  );
}
