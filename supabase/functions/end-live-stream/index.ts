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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData.user) throw new Error("Unauthorized");
    const userId = userData.user.id;

    const { stream_id, replay_url, thumbnail_url } = await req.json();
    if (!stream_id) throw new Error("stream_id is required");

    const { data: stream, error: streamErr } = await supabaseAdmin
      .from("live_streams")
      .select("*")
      .eq("id", stream_id)
      .single();

    if (streamErr || !stream) throw new Error("Stream not found");
    if (stream.creator_id !== userId) throw new Error("Not allowed");

    await supabaseAdmin
      .from("live_streams")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
        replay_url: replay_url ?? null,
        thumbnail_url: thumbnail_url ?? stream.thumbnail_url,
        viewers_current: 0,
      })
      .eq("id", stream_id);

    await supabaseAdmin
      .from("live_stream_participants")
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq("stream_id", stream_id)
      .eq("is_active", true);

    await supabaseAdmin.rpc("finalize_stream", { p_stream_id: stream_id });

    if (replay_url) {
      await supabaseAdmin.from("stream_replays").upsert({
        stream_id,
        replay_url,
        thumbnail_url,
        storage_provider: "external",
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Stream ended successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
