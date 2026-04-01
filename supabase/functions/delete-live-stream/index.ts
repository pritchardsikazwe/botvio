import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const { stream_id } = await req.json();
    if (!stream_id) throw new Error("stream_id is required");

    const { data: stream, error: streamErr } = await supabaseAdmin
      .from("live_streams")
      .select("id, creator_id")
      .eq("id", stream_id)
      .single();

    if (streamErr || !stream) throw new Error("Stream not found");

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"]);

    const isAdmin = (roles?.length ?? 0) > 0;
    if (stream.creator_id !== userId && !isAdmin) {
      throw new Error("Not allowed to delete this stream");
    }

    await Promise.all([
      supabaseAdmin.from("live_reactions").delete().eq("stream_id", stream_id),
      supabaseAdmin.from("live_comments").delete().eq("stream_id", stream_id),
      supabaseAdmin.from("live_stream_participants").delete().eq("stream_id", stream_id),
      supabaseAdmin.from("stream_replays").delete().eq("stream_id", stream_id),
    ]);

    const { error: deleteErr } = await supabaseAdmin
      .from("live_streams")
      .delete()
      .eq("id", stream_id);

    if (deleteErr) throw deleteErr;

    return new Response(
      JSON.stringify({ success: true, message: "Stream deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});