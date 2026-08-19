import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-black/[0.06] bg-white transition-shadow duration-200",
        "shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.06),0px_2px_4px_-2px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0px_2px_4px_-1px_rgba(0,0,0,0.10),0px_8px_16px_-4px_rgba(0,0,0,0.07)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-5 pt-0", className)} {...props} />;
}
