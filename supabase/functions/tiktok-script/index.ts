// Generates a TikTok-ready short video script + caption from a Botvio article (admin only).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BodySchema = z.object({
  title: z.string().min(3).max(300),
  excerpt: z.string().max(2000).optional().default(""),
  category: z.string().max(120).optional().default(""),
});

async function isAdmin(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) return false;
  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return false;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "super_admin"]);
  return !!roles?.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!(await isAdmin(req))) return json({ error: "Admin authentication required" }, 401);

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { title, excerpt, category } = parsed.data;

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) return json({ error: "AI gateway not configured" }, 500);

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.8-flash",
      messages: [
        {
          role: "system",
          content:
            "You write TikTok content for Botvio, a trading-signals and market-education brand. " +
            "Return ONLY a JSON object with keys: hook (one spoken opening line, max 12 words), " +
            "script (30-60 second spoken video script, plain sentences, no stage directions beyond short [brackets]), " +
            "caption (TikTok caption, max 150 chars, includes a soft call to read the article on botvio.live), " +
            "hashtags (array of 5-8 hashtags without the # symbol). " +
            "Never promise profits or guaranteed wins; keep it educational and mention that trading involves risk.",
        },
        { role: "user", content: `Article title: ${title}\nCategory: ${category}\nSummary: ${excerpt}` },
      ],
      max_tokens: 900,
    }),
  });

  if (!aiResponse.ok) {
    const body = await aiResponse.text();
    console.error(`AI gateway failed [${aiResponse.status}]: ${body}`);
    return json({ error: "AI generation failed", status: aiResponse.status }, 502);
  }

  const aiData = await aiResponse.json();
  const text: string = aiData.choices?.[0]?.message?.content || "";
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
  if (!match) return json({ error: "AI returned an unreadable response" }, 502);

  try {
    const content = JSON.parse(match[1] || match[0]);
    return json({ ok: true, ...content });
  } catch {
    return json({ error: "AI returned invalid JSON" }, 502);
  }
});
