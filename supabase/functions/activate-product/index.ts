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
  const body=await req.json().catch(()=>null);
  const productId=String(body?.productId??"");
  const referralCode=body?.affiliateCode ? String(body.affiliateCode) : null;
  if(!productId) return json({ok:false,error:"Product is required"},400);
  const admin=createClient(url,service);
  const {data,result,error}=await admin.rpc("activate_product_atomic",{p_user_id:user.id,p_product_id:productId,p_referral_code:referralCode});
  if(error) return json({ok:false,error:error.message},400);
  return json({ok:true,...(result??data)});
 }catch(e){
  console.error("[activate-product]",e instanceof Error?e.message:"activation failed");
  return json({ok:false,error:e instanceof Error?e.message:"Activation failed"},400);
 }
});