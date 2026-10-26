import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { assertAutomationKey } from "../_shared/automationAuth.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const LINKEDIN_GATEWAY = "https://connector-gateway.lovable.dev/linkedin";
const SITE = "https://botvio.live";
// 5 evenly spaced publishing slots (UTC): every 4 hours starting 06:00.
const SLOT_HOURS = [6, 10, 14, 18, 22];
const MAX_ATTEMPTS = 3;

const TOPICS = [
  "AI trading",
  "Forex",
  "Gold trading",
  "Crypto",
  "Synthetic Indices",
  "Trading education",
  "Risk management",
  "Market insights",
];

async function isAdmin(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) return false;
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return false;
  const { data: roles } = await admin().from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "super_admin"]);
  return !!roles?.length;
}

async function authorized(req: Request) {
  return (await isAdmin(req)) || (await assertAutomationKey(req));
}

async function getSetting(supabase: any, key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  const v = data?.value;
  if (v == null) return null;
  return typeof v === "string" ? v : String(v);
}

// ---- AI generation (Lovable AI Gateway, Responses API, streamed) ----

const ARTICLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["articles"],
  properties: {
    articles: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "excerpt", "body", "keywords", "hashtags", "topic", "product_page"],
        properties: {
          title: { type: "string" },
          excerpt: { type: "string" },
          body: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
          hashtags: { type: "array", items: { type: "string" } },
          topic: { type: "string" },
          product_page: { type: "string" },
        },
      },
    },
  },
};

async function generateArticles(topics: string[], avoidTitles: string[]): Promise<any[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const prompt = [
    "You are the content marketing writer for Botvio (https://botvio.live), an AI trading platform offering AI chart analysis, trading signals (Forex, Gold, Crypto, Synthetic Indices), MT5 copy trading, and trading education.",
    `Write exactly 5 original LinkedIn articles, one for each of these topics: ${topics.join(", ")}.`,
    "Requirements for each article:",
    "- SEO-friendly title (max 90 chars), engaging and specific, no clickbait, no guaranteed-profit claims.",
    "- excerpt: 1-2 sentence summary.",
    "- body: 400-700 words, professional LinkedIn formatting with short paragraphs and line breaks, educational and genuinely useful, naturally mentioning Botvio features (AI chart analysis, signals, copy trading, trading hubs) where relevant.",
    "- End the body with a clear call to action inviting readers to visit Botvio.",
    "- keywords: 4-8 SEO keywords. hashtags: 4-8 LinkedIn hashtags without the # symbol.",
    "- topic: the topic this article covers. product_page: the most relevant Botvio page path (e.g. /signals, /trading, /copy, /gold-trading, /synthetic-indices, /blog, /tools).",
    "- Never promise profits or guaranteed win rates. Include a brief risk note where trading advice is discussed.",
    avoidTitles.length ? `Do NOT reuse or closely paraphrase any of these previously used titles: ${avoidTitles.slice(0, 80).join(" | ")}` : "",
  ].filter(Boolean).join("\n");

  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      store: false,
      stream: true,
      reasoning: { effort: "low" },
      input: prompt,
      text: { format: { type: "json_schema", name: "botvio_articles", schema: ARTICLE_SCHEMA, strict: true } },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI gateway ${response.status}: ${text.slice(0, 300)}`);
  }

  // Accumulate the streamed output_text deltas.
  let output = "";
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload);
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") output += event.delta;
        else if (event.type === "response.completed" && event.response?.output_text) output = event.response.output_text;
      } catch { /* ignore partial lines */ }
    }
  }

  const parsed = JSON.parse(output);
  if (!Array.isArray(parsed.articles) || parsed.articles.length === 0) throw new Error("AI returned no articles");
  return parsed.articles;
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}

async function actionGenerate(supabase: any, targetDate?: string) {
  const date = targetDate || new Date().toISOString().slice(0, 10);
  const { data: existingToday } = await supabase
    .from("linkedin_content_posts").select("id").eq("generation_date", date).limit(1);
  if (existingToday?.length) return { success: true, created: 0, message: `Articles for ${date} already generated` };

  // Rotate topics by day-of-year so every day covers a different mix.
  const dayOfYear = Math.floor((Date.parse(date) - Date.parse(`${date.slice(0, 4)}-01-01`)) / 86400000);
  const topics = Array.from({ length: 5 }, (_, i) => TOPICS[(dayOfYear + i) % TOPICS.length]);

  const { data: recent } = await supabase
    .from("linkedin_content_posts").select("title").order("created_at", { ascending: false }).limit(80);
  const avoidTitles = (recent || []).map((r: any) => r.title);

  const articles = await generateArticles(topics, avoidTitles);

  const rows = [];
  const usedSlugs = new Set<string>();
  for (let i = 0; i < Math.min(5, articles.length); i++) {
    const a = articles[i];
    let slug = slugify(a.title || `article-${i}`);
    if (!slug) slug = `article-${date}-${i}`;
    while (usedSlugs.has(slug)) slug = `${slug}-${i}`;
    usedSlugs.add(slug);
    const scheduled = new Date(`${date}T00:00:00Z`);
    scheduled.setUTCHours(SLOT_HOURS[i], 0, 0, 0);
    const page = typeof a.product_page === "string" && a.product_page.startsWith("/") ? a.product_page : "/";
    rows.push({
      slug: `${slug}-${date}`,
      title: String(a.title || "Botvio market insight").slice(0, 120),
      excerpt: a.excerpt ? String(a.excerpt).slice(0, 300) : null,
      body: String(a.body || ""),
      keywords: Array.isArray(a.keywords) ? a.keywords.map(String).slice(0, 10) : [],
      hashtags: Array.isArray(a.hashtags) ? a.hashtags.map((h: string) => String(h).replace(/^#/, "")).slice(0, 10) : [],
      topic: a.topic ? String(a.topic) : topics[i],
      cta_url: `${SITE}${page}?utm_source=linkedin&utm_medium=organic&utm_campaign=daily_content`,
      status: "approved",
      scheduled_at: scheduled.toISOString(),
      generation_date: date,
    });
  }

  const { data: inserted, error } = await supabase
    .from("linkedin_content_posts").upsert(rows, { onConflict: "slug" }).select("id, title");
  if (error) throw error;
  return { success: true, created: inserted?.length ?? 0, date, titles: (inserted || []).map((r: any) => r.title) };
}

// ---- LinkedIn publishing ----

function linkedinHeaders() {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connectionKey = Deno.env.get("LINKEDIN_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!connectionKey) throw new Error("LinkedIn connection is not linked to this project");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
    "Linkedin-Version": "202603",
  };
}

async function getMemberUrn(): Promise<string> {
  const res = await fetch(`${LINKEDIN_GATEWAY}/v2/userinfo`, { headers: linkedinHeaders() });
  if (!res.ok) throw new Error(`LinkedIn profile read failed (${res.status})`);
  const info = await res.json();
  if (!info.sub) throw new Error("LinkedIn member id missing");
  return `urn:li:person:${info.sub}`;
}

function composeCommentary(post: any) {
  const tags = (post.hashtags || []).map((h: string) => `#${h}`).join(" ");
  return `${post.title}\n\n${post.body}\n\nLearn more: ${post.cta_url}\n\n${tags}`.slice(0, 2900);
}

async function publishOne(supabase: any, post: any, target: string, orgUrn: string | null) {
  let author: string;
  if (target === "organization") {
    if (!orgUrn) {
      throw new Error("Company Page is not configured: add your LinkedIn organization URN in the admin LinkedIn Content page. Company Page posting also requires the w_organization_social permission on your LinkedIn app.");
    }
    author = orgUrn;
  } else {
    author = await getMemberUrn();
  }

  await supabase.from("linkedin_content_posts")
    .update({ status: "publishing", attempts: (post.attempts || 0) + 1, error: null, updated_at: new Date().toISOString() })
    .eq("id", post.id);

  const res = await fetch(`${LINKEDIN_GATEWAY}/rest/posts`, {
    method: "POST",
    headers: linkedinHeaders(),
    body: JSON.stringify({
      author,
      commentary: composeCommentary(post),
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 403 && target === "organization") {
      throw new Error("LinkedIn refused Company Page posting (permission w_organization_social missing). Request that permission in your LinkedIn developer app, or switch the target to your personal profile in the admin page.");
    }
    throw new Error(`LinkedIn API ${res.status}: ${text.slice(0, 400)}`);
  }
  const externalId = res.headers.get("x-restli-id") || null;
  await supabase.from("linkedin_content_posts")
    .update({ status: "published", published_at: new Date().toISOString(), linkedin_post_id: externalId, error: null, updated_at: new Date().toISOString() })
    .eq("id", post.id);
  return { success: true, externalId };
}

async function actionPublish(supabase: any, postId?: string) {
  if (await getSetting(supabase, "linkedin_content_paused") === "true") {
    return { success: true, published: 0, message: "Publishing is paused" };
  }
  const target = (await getSetting(supabase, "linkedin_content_target")) || "organization";
  const orgUrn = await getSetting(supabase, "linkedin_org_urn");

  let posts: any[] = [];
  if (postId) {
    const { data } = await supabase.from("linkedin_content_posts").select("*").eq("id", postId).single();
    if (data) posts = [data];
  } else {
    const now = new Date().toISOString();
    const { data: due } = await supabase.from("linkedin_content_posts").select("*")
      .in("status", ["approved", "scheduled"]).lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true }).limit(5);
    const { data: retries } = await supabase.from("linkedin_content_posts").select("*")
      .eq("status", "failed").lt("attempts", MAX_ATTEMPTS)
      .order("updated_at", { ascending: true }).limit(3);
    posts = [...(due || []), ...(retries || [])];
  }

  let published = 0;
  const errors: string[] = [];
  for (const post of posts) {
    if (post.status === "published") continue; // never duplicate
    try {
      await publishOne(supabase, post, target, orgUrn);
      published++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(message);
      await supabase.from("linkedin_content_posts")
        .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
        .eq("id", post.id);
      // A missing Company Page configuration affects every post — stop the batch.
      if (message.includes("Company Page is not configured") || message.includes("w_organization_social")) break;
    }
  }
  return { success: errors.length === 0, published, attempted: posts.length, errors: errors.slice(0, 3) };
}

async function actionRegenerate(supabase: any, postId: string) {
  const { data: post } = await supabase.from("linkedin_content_posts").select("*").eq("id", postId).single();
  if (!post) return { success: false, error: "Post not found" };
  if (post.status === "published") return { success: false, error: "Published posts cannot be regenerated" };
  const articles = await generateArticles([post.topic || "AI trading"], [post.title]);
  const a = articles[0];
  if (!a) throw new Error("AI returned no replacement article");
  const page = typeof a.product_page === "string" && a.product_page.startsWith("/") ? a.product_page : "/";
  const { error } = await supabase.from("linkedin_content_posts").update({
    title: String(a.title || post.title).slice(0, 120),
    excerpt: a.excerpt ? String(a.excerpt).slice(0, 300) : post.excerpt,
    body: String(a.body || post.body),
    keywords: Array.isArray(a.keywords) ? a.keywords.map(String).slice(0, 10) : post.keywords,
    hashtags: Array.isArray(a.hashtags) ? a.hashtags.map((h: string) => String(h).replace(/^#/, "")).slice(0, 10) : post.hashtags,
    cta_url: `${SITE}${page}?utm_source=linkedin&utm_medium=organic&utm_campaign=daily_content`,
    status: "approved",
    error: null,
    updated_at: new Date().toISOString(),
  }).eq("id", postId);
  if (error) throw error;
  return { success: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!(await authorized(req))) return json({ success: false, error: "Admin authentication required" }, 401);
    const supabase = admin();
    const body = await req.json().catch(() => ({}));
    const action = body.action || "publish";

    if (action === "generate") return json(await actionGenerate(supabase, body.date));
    if (action === "publish") return json(await actionPublish(supabase, body.post_id));
    if (action === "regenerate") return json(await actionRegenerate(supabase, body.post_id));
    if (action === "status") {
      const target = (await getSetting(supabase, "linkedin_content_target")) || "organization";
      const orgUrn = await getSetting(supabase, "linkedin_org_urn");
      const paused = (await getSetting(supabase, "linkedin_content_paused")) === "true";
      return json({ success: true, target, orgUrnConfigured: !!orgUrn, paused });
    }
    return json({ success: false, error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
