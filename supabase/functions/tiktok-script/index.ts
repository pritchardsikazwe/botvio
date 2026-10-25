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

// Consume the SSE stream and return the final response payload.
async function readResponsesStream(res: Response): Promise<any> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed: any = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const evt of events) {
      const dataLine = evt.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const data = dataLine.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "response.completed") completed = parsed.response;
        if (parsed.type === "response.failed" || parsed.type === "error") {
          throw new Error(JSON.stringify(parsed).slice(0, 400));
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  return completed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!(await isAdmin(req))) return json({ error: "Admin authentication required" }, 401);

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { title, excerpt, category } = parsed.data;

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) return json({ error: "AI gateway not configured" }, 500);

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text:
              "You write TikTok content for Botvio, a trading-signals and market-education brand. " +
              "The hook is one spoken opening line of at most 12 words. " +
              "The script is a 30-60 second spoken video script in plain sentences with only short [bracketed] visual cues. " +
              "The caption is at most 150 characters with a soft call to read the article on botvio.live. " +
              "Hashtags are 5-8 tags without the # symbol. " +
              "Never promise profits or guaranteed wins; keep it educational and note that trading involves risk.",
          }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: `Article title: ${title}\nCategory: ${category}\nSummary: ${excerpt}` }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "tiktok_content",
          strict: true,
          schema: {
            type: "object",
            properties: {
              hook: { type: "string" },
              script: { type: "string" },
              caption: { type: "string" },
              hashtags: { type: "array", items: { type: "string" } },
            },
            required: ["hook", "script", "caption", "hashtags"],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!aiResponse.ok) {
    const body = await aiResponse.text();
    console.error(`AI gateway failed [${aiResponse.status}]: ${body}`);
    return json({ error: "AI generation failed", status: aiResponse.status }, 502);
  }

  try {
    const completed = await readResponsesStream(aiResponse);
    const message = completed?.output?.find((o: any) => o.type === "message");
    const text: string = message?.content?.find((c: any) => c.type === "output_text")?.text ?? "";
    if (!text) return json({ error: "AI returned an empty response" }, 502);
    const content = JSON.parse(text);
    return json({ ok: true, ...content });
  } catch (e) {
    console.error("AI parse failed:", e);
    return json({ error: "AI returned an unreadable response" }, 502);
  }
});
