"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";

export default function ModerationActions({ postId, userId }: { postId: string; userId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function decide(action: "approve" | "reject") {
    setPending(true);
    await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, user_id: userId, action }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="mt-4 flex gap-2">
      <Button onClick={() => decide("approve")} disabled={pending} size="sm">
        Aprobar
      </Button>
      <Button
        onClick={() => decide("reject")}
        disabled={pending}
        size="sm"
        variant="destructive"
      >
        Rechazar
      </Button>
    </div>
  );
}
