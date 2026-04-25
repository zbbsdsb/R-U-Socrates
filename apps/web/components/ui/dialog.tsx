"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── Dialog ─────────────────────────────────────────────────────────────── */

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Also support uncontrolled: open/close via internal state
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = React.useCallback((v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  }, [isControlled, onOpenChange]);

  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, setOpen]);

  // Lock body scroll
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ open?: boolean; onOpenChange?: (v: boolean) => void }>, {
              open: isOpen,
              onOpenChange: setOpen,
            })
          : child
      )}
    </>
  );
}

/* ── DialogTrigger ──────────────────────────────────────────────────────── */

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

function DialogTrigger({ children, asChild, ...props }: DialogTriggerProps) {
  // Trigger is handled by Dialog's internal state via context — expose a render prop instead
  return <>{children}</>;
}

/* ── DialogPortal / DialogContent ───────────────────────────────────────── */

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

function DialogContent({ className, children, onClose }: DialogContentProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-xl border bg-background shadow-2xl",
          "animate-in zoom-in-95 fade-in-0 duration-200",
          "mx-4",
          className
        )}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18 18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Compound exports ──────────────────────────────────────────────────── */

const DialogPanel = DialogContent; // alias

function DialogHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-6 pb-0", className)}>
      {children}
    </div>
  );
}

function DialogFooter({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-end gap-3 p-6 pt-4", className)}>
      {children}
    </div>
  );
}

function DialogTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  );
}

function DialogDescription({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

function DialogBody({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pt-4", className)}>
      {children}
    </div>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogPanel,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
};
export type { DialogProps, DialogContentProps };
