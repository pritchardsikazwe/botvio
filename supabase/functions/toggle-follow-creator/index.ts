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
    const followerId = userData.user.id;

    const { creator_id } = await req.json();
    if (!creator_id) throw new Error("creator_id is required");
    if (creator_id === followerId) throw new Error("Cannot follow yourself");

    const { data: existing } = await supabaseAdmin
      .from("stream_follows")
      .select("*")
      .eq("follower_id", followerId)
      .eq("creator_id", creator_id)
      .maybeSingle();

    let following = false;

    if (existing) {
      await supabaseAdmin
        .from("stream_follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("creator_id", creator_id);
    } else {
      await supabaseAdmin.from("stream_follows").insert({
        follower_id: followerId,
        creator_id,
      });
      following = true;

      await supabaseAdmin.from("notifications").insert({
        user_id: creator_id,
        type: "new_follower",
        title: "You have a new follower",
        message: "Someone started following your trading streams.",
        metadata: { follower_id: followerId },
      });
    }

    await supabaseAdmin.rpc("refresh_follower_count", { target_creator_id: creator_id });

    return new Response(
      JSON.stringify({ success: true, following }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
