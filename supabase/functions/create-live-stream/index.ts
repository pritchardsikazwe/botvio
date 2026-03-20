import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AccessToken } from "npm:livekit-server-sdk@2.9.1";

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

    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      throw new Error("LiveKit credentials not configured");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData.user) throw new Error("Unauthorized");

    const userId = userData.user.id;
    const body = await req.json();
    const {
      title,
      description,
      stream_mode = "camera",
      broker_name,
      market_type,
      instrument,
      timeframe,
      strategy_tag,
      comments_enabled = true,
      reactions_enabled = true,
      is_public = true,
      is_recording_enabled = false,
      risk_warning_accepted = true,
    } = body;

    if (!title) throw new Error("title is required");

    const streamId = crypto.randomUUID();
    const roomName = `botvio-live-${streamId}`;

    // Generate LiveKit token for creator (can publish + subscribe)
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      name: title,
    });
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });
    const creatorToken = await token.toJwt();

    const { data, error } = await supabaseAdmin
      .from("live_streams")
      .insert({
        id: streamId,
        creator_id: userId,
        title,
        description,
        status: "live",
        stream_mode,
        room_name: roomName,
        livekit_creator_token: creatorToken,
        broker_name,
        market_type,
        instrument,
        timeframe,
        strategy_tag,
        comments_enabled,
        reactions_enabled,
        is_public,
        is_recording_enabled,
        risk_warning_accepted,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("live_stream_participants").insert({
      stream_id: streamId,
      user_id: userId,
      role: "creator",
      is_active: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        stream_id: streamId,
        room_name: roomName,
        token: creatorToken,
        ws_url: Deno.env.get("LIVEKIT_WS_URL") || "wss://botvio-knua21jl.livekit.cloud",
        stream: data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
