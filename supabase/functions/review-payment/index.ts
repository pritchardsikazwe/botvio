import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:corsHeaders});
 try{
  const auth=req.headers.get("Authorization")??"";
  if(!auth.startsWith("Bearer ")) return json({ok:false,error:"Sign in required"},401);
  const url=Deno.env.get("SUPABASE_URL")!;
  const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user}}=await userClient.auth.getUser();
  if(!user) return json({ok:false,error:"Sign in required"},401);
  const admin=createClient(url,service);
  const {data:roleRows,error:roleError}=await admin.from("user_roles").select("role").eq("user_id",user.id).in("role",["admin","super_admin"]);
  if(roleError) return json({ok:false,error:roleError.message},500);
  if(!roleRows?.length) return json({ok:false,error:"Admin access required"},403);
  const body=await req.json().catch(()=>null);
  const requestId=String(body?.paymentRequestId??"");
  const action=String(body?.action??"");
  if(!requestId || !["approve","reject"].includes(action)) return json({ok:false,error:"paymentRequestId and action are required"},400);
  const { data, error } = await admin.rpc("review_payment_atomic",{p_admin_user_id:user.id,p_payment_request_id:requestId,p_action:action});
  if(error) return json({ok:false,error:error.message},400);
  return json({ok:true,...(data ?? {})});
 }catch(e){
  console.error("[review-payment]",e instanceof Error?e.message:"review failed");
  return json({ok:false,error:e instanceof Error?e.message:"Payment review failed"},400);
 }
});