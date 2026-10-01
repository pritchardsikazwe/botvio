import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c] || c))

const renderHtml = (message: string, name: string | null) => {
  const text = message.replaceAll("{{name}}", name || "there")
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:620px;margin:32px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden"><div style="padding:22px 26px;background:#062c22;color:#fff"><div style="font-size:24px;font-weight:800">Botvio</div><div style="font-size:12px;color:#fbbf24;margin-top:4px">AI TRADING INTELLIGENCE</div></div><div style="padding:28px 26px;font-size:15px;line-height:1.65">${escapeHtml(text).replaceAll("\\n","<br />")}</div><div style="padding:18px 26px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b">You are receiving this message because you have a Botvio account. Promotional email preferences are managed through your Botvio account.</div></div></body></html>`
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) return new Response(JSON.stringify({ error:"Server configuration error" }), { status:500, headers:{...corsHeaders,"Content-Type":"application/json"} })

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error:"Unauthorized" }), { status:401, headers:{...corsHeaders,"Content-Type":"application/json"} })

  const db = createClient(supabaseUrl, serviceKey)
  const { data: authData, error: authError } = await db.auth.getUser(authHeader.slice(7))
  if (authError || !authData.user) return new Response(JSON.stringify({ error:"Unauthorized" }), { status:401, headers:{...corsHeaders,"Content-Type":"application/json"} })

  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", authData.user.id)
  if (!roles?.some((r:any) => r.role === "admin" || r.role === "super_admin")) {
    return new Response(JSON.stringify({ error:"Admin access required" }), { status:403, headers:{...corsHeaders,"Content-Type":"application/json"} })
  }

  let body:any
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error:"Invalid JSON" }), { status:400, headers:{...corsHeaders,"Content-Type":"application/json"} }) }
  const subject = typeof body.subject === "string" ? body.subject.trim() : ""
  const message = typeof body.message === "string" ? body.message.trim() : ""
  const recipients = Array.isArray(body.recipients) ? body.recipients : []
  if (!subject || !message || !recipients.length) return new Response(JSON.stringify({ error:"Subject, message and recipients are required" }), { status:400, headers:{...corsHeaders,"Content-Type":"application/json"} })
  if (recipients.length > 100) return new Response(JSON.stringify({ error:"Maximum 100 recipients per promotion batch" }), { status:400, headers:{...corsHeaders,"Content-Type":"application/json"} })

  let queued=0, skipped=0
  for (const recipient of recipients) {
    const email = typeof recipient?.email === "string" ? recipient.email.trim().toLowerCase() : ""
    if (!email) { skipped++; continue }

    const { data: suppressed } = await db.from("suppressed_emails").select("id").eq("email",email).maybeSingle()
    if (suppressed) { skipped++; continue }

    let unsubscribeToken:string|null = null
    const { data: tokenRow } = await db.from("email_unsubscribe_tokens").select("token,used_at").eq("email",email).maybeSingle()
    if (tokenRow?.token && !tokenRow.used_at) unsubscribeToken=tokenRow.token
    if (!unsubscribeToken) {
      unsubscribeToken=crypto.randomUUID().replaceAll("-","")+crypto.randomUUID().replaceAll("-","")
      const { error } = await db.from("email_unsubscribe_tokens").upsert({ email, token:unsubscribeToken }, { onConflict:"email" })
      if (error) { skipped++; continue }
    }

    const messageId=crypto.randomUUID()
    const html=renderHtml(message,typeof recipient?.name==="string"?recipient.name:null)
    const text=message.replaceAll("{{name}}",typeof recipient?.name==="string"&&recipient.name?recipient.name:"there")

    const { error:logError } = await db.from("email_send_log").insert({ message_id:messageId,template_name:"admin-promotion",recipient_email:email,status:"pending" })
    if (logError) { skipped++; continue }

    const { error:queueError } = await db.rpc("enqueue_email",{
      queue_name:"transactional_emails",
      payload:{
        message_id:messageId,to:email,from:"Botvio <noreply@botvio.live>",sender_domain:"notify.botvio.live",
        subject,html,text,purpose:"promotional",label:"admin-promotion",
        idempotency_key:`admin-promotion-${messageId}`,unsubscribe_token:unsubscribeToken,queued_at:new Date().toISOString()
      }
    })
    if (queueError) { skipped++; continue }
    queued++
  }

  return new Response(JSON.stringify({ success:true,queued,skipped }),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}})
})
