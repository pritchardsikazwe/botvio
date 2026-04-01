import { createClient } from "npm:@supabase/supabase-js@2";
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

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const jwt = authHeader.replace("Bearer ", "");
      const { data } = await supabaseAdmin.auth.getUser(jwt);
      userId = data.user?.id ?? null;
    }

    const { stream_id } = await req.json();
    if (!stream_id) throw new Error("stream_id is required");

    const { data: stream, error: streamErr } = await supabaseAdmin
      .from("live_streams")
      .select("*")
      .eq("id", stream_id)
      .single();

    if (streamErr || !stream) throw new Error("Stream not found");
    if (stream.status !== "live") throw new Error("Stream is not live");

    const viewerIdentity = userId ?? `guest-${crypto.randomUUID()}`;

    // Generate LiveKit viewer token (subscribe only)
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: viewerIdentity,
      name: `viewer-${viewerIdentity.slice(0, 8)}`,
    });
    token.addGrant({
      room: stream.room_name,
      roomJoin: true,
      canPublish: false,
      canSubscribe: true,
    });
    const viewerToken = await token.toJwt();

    if (userId) {
      await supabaseAdmin.from("live_stream_participants").insert({
        stream_id,
        user_id: userId,
        role: "viewer",
        is_active: true,
      });

      const { count } = await supabaseAdmin
        .from("live_stream_participants")
        .select("*", { count: "exact", head: true })
        .eq("stream_id", stream_id)
        .eq("is_active", true);

      const viewers = count ?? 0;
      await supabaseAdmin
        .from("live_streams")
        .update({
          viewers_current: viewers,
          viewers_peak: Math.max(stream.viewers_peak ?? 0, viewers),
        })
        .eq("id", stream_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        token: viewerToken,
        ws_url: Deno.env.get("LIVEKIT_WS_URL") || "wss://botvio-knua21jl.livekit.cloud",
        room_name: stream.room_name,
        stream,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
