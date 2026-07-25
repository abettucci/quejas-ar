import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-900",
        complaint: "bg-red-100 text-red-900",
        experience: "bg-emerald-100 text-emerald-900",
        scam: "bg-orange-100 text-orange-900",
        pending: "bg-amber-100 text-amber-900",
        published: "bg-zinc-100 text-zinc-700",
        rejected: "bg-zinc-100 text-zinc-400",
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
