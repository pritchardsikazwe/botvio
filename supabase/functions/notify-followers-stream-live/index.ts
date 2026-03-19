import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { creator_id, stream_id, title } = await req.json();
    if (!creator_id || !stream_id) throw new Error("creator_id and stream_id are required");

    const { data: followers, error: followersErr } = await supabaseAdmin
      .from("stream_follows")
      .select("follower_id")
      .eq("creator_id", creator_id);

    if (followersErr) throw followersErr;
    if (!followers || followers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = followers.map((f) => ({
      user_id: f.follower_id,
      type: "followed_creator_live",
      title: "A trader you follow is now live",
      message: title ?? "Tap to watch the live stream",
      metadata: { creator_id, stream_id },
    }));

    const { error } = await supabaseAdmin.from("notifications").insert(rows);
    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, inserted: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
