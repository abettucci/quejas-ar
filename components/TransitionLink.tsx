"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Same-page filter/sort links shouldn't feel like a navigation. Intercepts
 * the click, keeps the real href for accessibility/right-click/crawling,
 * but drives the actual update through router.replace inside a transition
 * so React keeps the current feed on screen (no Suspense fallback flash)
 * until the new data is ready.
 */
export function TransitionLink({
  href,
  className,
  pendingClassName,
  children,
}: {
  href: string;
  className?: string;
  pendingClassName?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Link
      href={href}
      scroll={false}
      onClick={(e) => {
        e.preventDefault();
        startTransition(() => {
          router.replace(href, { scroll: false });
        });
      }}
      className={cn(className, isPending && pendingClassName)}
    >
      {children}
    </Link>
  );
}
