import { createClient } from "npm:@supabase/supabase-js@2";

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

    const { stream_id, body, parent_comment_id } = await req.json();
    if (!stream_id || !body) throw new Error("stream_id and body are required");

    const { data: stream } = await supabaseAdmin
      .from("live_streams")
      .select("id, creator_id, comments_enabled")
      .eq("id", stream_id)
      .single();

    if (!stream) throw new Error("Stream not found");
    if (!stream.comments_enabled) throw new Error("Comments disabled");

    const { data: comment, error } = await supabaseAdmin
      .from("live_comments")
      .insert({
        stream_id,
        user_id: userId,
        body,
        parent_comment_id: parent_comment_id ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    if (stream.creator_id !== userId) {
      await supabaseAdmin.from("notifications").insert({
        user_id: stream.creator_id,
        type: "stream_comment",
        title: "New comment on your live stream",
        message: body,
        metadata: { stream_id, comment_id: comment.id, from_user_id: userId },
      });
    }

    return new Response(
      JSON.stringify({ success: true, comment }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
