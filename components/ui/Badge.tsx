import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase border",
  {
    variants: {
      variant: {
        default: "bg-surface-hover text-muted border-border",
        complaint: "bg-accent-soft text-accent border-accent/20",
        experience: "bg-success-soft text-success border-success/20",
        scam: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
        pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
        published: "bg-surface-hover text-muted border-border",
        rejected: "bg-surface-hover text-muted/50 border-border",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
