import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLinkedInCallback() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Connecting your LinkedIn Company Page…");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("error")) { setMsg(`LinkedIn: ${p.get("error_description") || p.get("error")}`); return; }
    (async () => {
      const { data, error } = await supabase.functions.invoke("linkedin-org-oauth", {
        body: { action: "callback", code: p.get("code"), state: p.get("state"), origin: window.location.origin },
      });
      if (error || !data?.success) {
        let details = data?.error || error?.message || "Connection failed";
        try { const c = await (error as any)?.context?.json?.(); if (c?.error) details = `${c.error}${c.details ? ` — ${c.details}` : ""}`; } catch { /* ignore */ }
        setMsg(details);
        return;
      }
      setMsg(`Connected: ${data.orgName || data.orgUrn}. Redirecting…`);
      setTimeout(() => navigate("/admin/linkedin-content"), 1500);
    })();
  }, [navigate]);

  return <div className="p-8 text-center text-sm">{msg}</div>;
}
