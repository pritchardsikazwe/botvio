import { useState } from "react";
import { Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { normalizeWhatsApp } from "@/lib/profileContact";

/** Mandatory: signed-in users without a WhatsApp number must add one before continuing. */
export function WhatsAppProfileNotice() {
  const { user, profile, updateProfile } = useAuth();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user || !profile || profile.whatsapp_number?.trim()) return null;

  const save = async () => {
    const number = normalizeWhatsApp(value);
    if (!number) { toast.error("Enter a valid WhatsApp number with country code"); return; }
    setSaving(true);
    try {
      await updateProfile({ whatsapp_number: number });
      toast.success("WhatsApp number saved");
    } catch (e: any) {
      toast.error(e?.message || "Could not save number");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 p-4 backdrop-blur" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary"><Phone className="h-5 w-5" /></div>
          <h2 className="text-lg font-semibold">Add your WhatsApp number</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          A WhatsApp number is required to use Botvio so we can contact you about your account, MT5 setup and trading updates.
        </p>
        <Input aria-label="WhatsApp number with country code" type="tel" autoComplete="tel" placeholder="+260 97 1234567" value={value} onChange={(e) => setValue(e.target.value)} maxLength={20} />
        <Button className="mt-4 w-full" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save and continue"}</Button>
      </div>
    </div>
  );
}
