import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    // Verify the supplied identity against Auth before triggering email.
    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(user_id);
    const registeredEmail = authUserData?.user?.email?.trim().toLowerCase();
    if (authUserError || !registeredEmail || registeredEmail !== email.trim().toLowerCase()) {
      return new Response(JSON.stringify({ error: "Signup identity could not be verified" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Queue welcome email from this trusted server context. Unconfirmed signup
    // clients cannot invoke the JWT-protected transactional mailer themselves.
    const welcomeResponse = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        templateName: "welcome-email",
        recipientEmail: registeredEmail,
        idempotencyKey: `welcome-${user_id}`,
        templateData: { name: authUserData.user.user_metadata?.display_name || authUserData.user.user_metadata?.full_name || undefined },
      }),
    });
    if (!welcomeResponse.ok) {
      console.error("Welcome email could not be queued", await welcomeResponse.text());
    } else {
      console.log("Welcome email queued for new account", user_id);
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

    // Queue a separate inbox email for the admin using the existing transactional
    // mailer. This is best-effort and never blocks the new user's signup.
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          templateName: "admin-new-signup",
          recipientEmail: SUPER_ADMIN_EMAIL,
          idempotencyKey: `admin-signup-${user_id}`,
          templateData: { newUserEmail: email, newUserId: user_id, signupDate },
        }),
      });
      if (!emailResponse.ok) {
        console.error("Admin signup email could not be queued", await emailResponse.text());
      } else {
        console.log("Admin signup inbox email queued");
      }
    } catch (emailError) {
      console.error("Admin signup inbox email request failed", emailError);
    }

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
