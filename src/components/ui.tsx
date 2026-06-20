"use client";

import { cn } from "@/lib/utils";

/* Small set of reusable, pre-styled primitives. Add to these as you build. */

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
}) {
  const variants = {
    primary:
      "bg-accent text-white hover:opacity-90 shadow-[0_8px_30px_-8px_var(--accent)]",
    ghost: "text-foreground/80 hover:bg-surface-2 hover:text-foreground",
    outline: "border border-border text-foreground hover:bg-surface-2",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass rounded-2xl p-6 transition-all", className)}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
