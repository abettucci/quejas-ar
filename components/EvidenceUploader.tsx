"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function EvidenceUploader({
  value,
  onChange,
  max = 5,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - value.length;
    const toUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión expirada");
      setUploading(false);
      return;
    }

    const uploadedUrls: string[] = [];
    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} pesa más de 5MB`);
        continue;
      }
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("evidence").upload(path, file);
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      const { data } = supabase.storage.from("evidence").getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }

    onChange([...value, ...uploadedUrls]);
    setUploading(false);
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {value.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-md border border-zinc-200">
              <Image src={url} alt="evidencia" fill className="object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1 right-1 rounded-full bg-zinc-900/80 p-1 text-white hover:bg-zinc-900"
                aria-label="Eliminar"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < max && (
        <label
          className={`inline-flex h-10 cursor-pointer items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-100 ${
            uploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? "Subiendo…" : `Subir imagen (${value.length}/${max})`}
        </label>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
