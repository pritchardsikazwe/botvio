import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return json({ok:false,error:"POST required"},405);
 const token=(req.headers.get("Authorization")??"").replace(/^Bearer\s+/i,"");
 if(!token) return json({ok:false,error:"Authentication required"},401);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key) return json({ok:false,error:"Server configuration is incomplete"},500);
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error:authError}=await admin.auth.getUser(token);
 if(authError||!data.user) return json({ok:false,error:"Your session is invalid or expired"},401);
 const body=await req.json().catch(()=>({}));
 if(body?.confirm!==true) return json({ok:false,error:"Explicit confirmation is required"},400);
 const uid=data.user.id;
 const direct=[["copied_trades","subscriber_user_id"],["copy_subscriptions","subscriber_user_id"],["affiliate_links","user_id"],["affiliate_profiles","user_id"],["audit_logs","user_id"],["broker_tokens","user_id"],["chart_analyses","user_id"],["deriv_connection_logs","user_id"],["deriv_connections","user_id"],["notifications","user_id"],["orders","user_id"],["p2p_offers","user_id"],["payment_requests","user_id"],["payout_methods","user_id"],["payout_requests","user_id"],["risk_sessions","user_id"],["strategy_purchases","user_id"],["subscription_requests","user_id"],["symbol_mappings","user_id"],["syntx_api_connections","user_id"],["tradecopy_audit_log","user_id"],["tradecopy_credentials","user_id"],["trial_grants","user_id"],["user_plan_subscriptions","user_id"],["user_roles","user_id"],["user_settings","user_id"],["user_trades","user_id"],["bot_instances","user_id"],["trading_accounts","user_id"],["providers","user_id"],["profiles","user_id"]] as const;
 for(const [table,column] of direct){const {error}=await admin.from(table).delete().eq(column,uid);if(error){console.error(table,error.message);return json({ok:false,error:"Account cleanup could not be completed. The authentication account was not removed."},500);}}
 const {error:storageError}=await admin.from("storage.objects").delete().eq("bucket_id","charts").eq("owner_id",uid);
 if(storageError) console.error("storage cleanup warning",storageError.message);
 const {error:deleteError}=await admin.auth.admin.deleteUser(uid);
 if(deleteError) return json({ok:false,error:"Account removal could not be completed. Please try again."},500);
 return json({ok:true});
});