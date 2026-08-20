"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function VerifyPhoneForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ phone });
    if (error) setError(error.message || "No se pudo enviar el código. Verificá que el proveedor de SMS esté configurado en Supabase.");
    else setStep("otp");
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "phone_change",
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Mark profile as phone-verified
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ phone_verified: true }).eq("id", user.id);
    }
    router.push("/nuevo");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {step === "phone" ? (
        <>
          <Input
            type="tel"
            placeholder="+54 9 11 1234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button onClick={sendOtp} disabled={loading || !phone} className="w-full">
            {loading ? "Enviando…" : "Enviar código"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">Te mandamos un código por SMS a {phone}.</p>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="123456"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Button onClick={verifyOtp} disabled={loading || token.length < 4} className="w-full">
            {loading ? "Validando…" : "Validar código"}
          </Button>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
