import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface transition-shadow duration-200",
        "shadow-[0px_1px_2px_rgba(31,26,21,0.04),0px_1px_1px_rgba(31,26,21,0.03)]",
        "dark:shadow-none",
        "hover:shadow-[0px_8px_24px_-8px_rgba(31,26,21,0.14)]",
        "dark:hover:shadow-[0px_8px_24px_-8px_rgba(0,0,0,0.5)]",
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
