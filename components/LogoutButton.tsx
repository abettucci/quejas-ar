"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/Button";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Salir
    </Button>
  );
}
