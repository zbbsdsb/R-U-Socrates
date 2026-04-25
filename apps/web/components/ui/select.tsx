"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── SelectTrigger ──────────────────────────────────────────────────────── */
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, className, "aria-label": ariaLabel, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>
  )
);
SelectTrigger.displayName = "SelectTrigger";

/* ── SelectValue ─────────────────────────────────────────────────────────── */
interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

function SelectValue({ placeholder }: SelectValueProps) {
  return <span className="text-muted-foreground">{placeholder ?? "Select…"}</span>;
}

/* ── SelectContent ──────────────────────────────────────────────────────── */
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, children, className, disabled, ...props }, ref) => (
    <div
      ref={ref}
      role="option"
      aria-selected="false"
      data-disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <svg className="h-4 w-4 opacity-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </span>
      {children}
    </div>
  )
);
SelectItem.displayName = "SelectItem";

/* ── SelectContent (portal) ────────────────────────────────────────────── */
interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

function SelectContent({ children, className }: SelectContentProps) {
  return (
    <div
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      <div className="max-h-60 overflow-y-auto py-1">
        {children}
      </div>
    </div>
  );
}

/* ── Select ──────────────────────────────────────────────────────────────── */
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

function Select({ value, onValueChange, options, placeholder, className, disabled, "aria-label": ariaLabel }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <SelectTrigger
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected?.label ?? placeholder ?? "Select…"}
        </span>
      </SelectTrigger>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full">
          <SelectContent>
            {options.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                data-selected={value === opt.value}
                onClick={() => {
                  onValueChange?.(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  value === opt.value && "bg-accent/50",
                  "cursor-pointer"
                )}
              >
                {opt.label}
                {value === opt.value && (
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <svg className="h-4 w-4 opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </div>
      )}
      {/* Hidden native select for form behaviour */}
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        disabled={disabled}
        className="sr-only"
        aria-label={ariaLabel}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
export type { SelectProps, SelectOption };
