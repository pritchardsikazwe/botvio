import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Super admin email - receives all signup notifications
const SUPER_ADMIN_EMAIL = "sifotech@gmail.com";

interface SignupNotificationRequest {
  email: string;
  user_id: string;
  created_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, user_id, created_at }: SignupNotificationRequest = await req.json();

    if (!email || !user_id) {
      throw new Error("Missing required fields: email or user_id");
    }

    // Find the super admin's user_id by email
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", SUPER_ADMIN_EMAIL)
      .maybeSingle();

    if (!adminProfile?.user_id) {
      console.log("Super admin profile not found, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "Admin not found, notification skipped" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const signupDate = new Date(created_at || Date.now()).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Create in-app notification for the super admin
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: adminProfile.user_id,
        title: "🆕 New User Signup",
        message: `New user registered: ${email} on ${signupDate}`,
        type: "admin_signup",
        metadata: {
          new_user_email: email,
          new_user_id: user_id,
          signed_up_at: created_at || new Date().toISOString(),
        },
        is_read: false,
      });

    if (notificationError) {
      console.error("Failed to create notification:", notificationError);
      throw new Error("Failed to create admin notification");
    }

    console.log("Admin in-app notification created for new user:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Admin notified via in-app notification" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in admin-signup-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
