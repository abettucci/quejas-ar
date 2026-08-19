import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-700 border-zinc-200",
        complaint: "bg-red-50 text-red-700 border-red-200",
        experience: "bg-emerald-50 text-emerald-700 border-emerald-200",
        scam: "bg-orange-50 text-orange-700 border-orange-200",
        pending: "bg-amber-50 text-amber-700 border-amber-200",
        published: "bg-zinc-100 text-zinc-600 border-zinc-200",
        rejected: "bg-zinc-100 text-zinc-400 border-zinc-200",
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
