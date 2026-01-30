import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Super admin email - receives all signup notifications
const ADMIN_EMAIL = "pritchardsikazwe@gmail.com";

interface SignupNotificationRequest {
  email: string;
  user_id: string;
  created_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "Email notifications not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, user_id, created_at }: SignupNotificationRequest = await req.json();

    // Validate required fields
    if (!email || !user_id) {
      throw new Error("Missing required fields: email or user_id");
    }

    const signupDate = new Date(created_at || Date.now()).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });

    // Use Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Botvio <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: "🆕 New User Signup on Botvio",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 24px; border: 1px solid #333; }
              .header { text-align: center; margin-bottom: 24px; }
              .logo { font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #f59e0b, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
              .content { background: #222; border-radius: 8px; padding: 16px; margin: 16px 0; }
              .label { color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
              .value { color: #fff; font-size: 16px; font-weight: 500; }
              .footer { text-align: center; margin-top: 24px; color: #666; font-size: 12px; }
              .badge { display: inline-block; background: #059669; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🤖 BOTVIO</div>
                <p style="color: #888; margin-top: 8px;">New User Registration Alert</p>
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <span class="badge">New Signup</span>
              </div>
              
              <div class="content">
                <div class="label">Email Address</div>
                <div class="value">${email}</div>
              </div>
              
              <div class="content">
                <div class="label">User ID</div>
                <div class="value" style="font-family: monospace; font-size: 14px;">${user_id}</div>
              </div>
              
              <div class="content">
                <div class="label">Signup Date</div>
                <div class="value">${signupDate}</div>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from Botvio.</p>
                <p>© 2025 Botvio - AI Trading Platform</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const result = await emailResponse.json();
    console.log("Admin signup notification sent:", result);

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in admin-signup-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
