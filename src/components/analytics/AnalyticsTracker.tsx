import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VISITOR_KEY="botvio_visitor_id";
const SESSION_KEY="botvio_session_id";
const START_KEY="botvio_session_started_at";
const PREV_KEY="botvio_prev_path";
const makeId=()=>Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
const storage=(key:string)=>{try{return localStorage.getItem(key)}catch{return null}};
const setStorage=(key:string,value:string)=>{try{localStorage.setItem(key,value)}catch{}};

function deviceType(){
 const ua=navigator.userAgent.toLowerCase();
 if(/tablet|ipad|playbook|silk/.test(ua)||(navigator.maxTouchPoints>1&&/macintosh/.test(ua))) return "tablet";
 if(/mobile|android|iphone|ipod|windows phone/.test(ua)) return "mobile";
 return "desktop";
}
function sourceFrom(referrer:string){
 if(!referrer) return "Direct";
 try { const host=new URL(referrer).hostname.replace(/^www\./,""); if(host===location.hostname)return "Internal"; if(/google\./.test(host))return "Google"; if(/bing\.com$/.test(host))return "Bing"; if(/facebook|instagram|tiktok|linkedin|youtube|twitter|x\.com/.test(host))return "Social"; if(/lovable/.test(host))return "Lovable"; return host; } catch { return "Referral"; }
}
export function trackBotvioEvent(event_name:string, metadata:Record<string,unknown>={}){
 const visitor=storage(VISITOR_KEY)||makeId(); const session=storage(SESSION_KEY)||makeId(); setStorage(VISITOR_KEY,visitor); setStorage(SESSION_KEY,session);
 const params=new URLSearchParams(location.search); const referrer=document.referrer||"";
 void supabase.from("analytics_events").insert({event_name,visitor_id:visitor,session_id:session,path:location.pathname,referrer,source:sourceFrom(referrer),medium:params.get("utm_medium"),campaign:params.get("utm_campaign")||params.get("utm_source"),device_type:deviceType(),metadata});
}
export function AnalyticsTracker(){
 const {user}=useAuth(); const location=useLocation(); const userRef=useRef(user?.id); userRef.current=user?.id;
 useEffect(()=>{
  let visitor=storage(VISITOR_KEY); if(!visitor){visitor=makeId();setStorage(VISITOR_KEY,visitor);} let session=storage(SESSION_KEY); if(!session){session=makeId();setStorage(SESSION_KEY,session);}
  const previous=storage(PREV_KEY); const started=Number(storage(START_KEY)||Date.now());
  if(previous&&previous!==location.pathname){void supabase.from("analytics_events").insert({event_name:"page_time",visitor_id:visitor,session_id:session,user_id:userRef.current||null,path:previous,referrer:document.referrer||"",source:sourceFrom(document.referrer||""),device_type:deviceType(),metadata:{duration_seconds:Math.max(0,Math.round((Date.now()-started)/1000))}});}
  setStorage(PREV_KEY,location.pathname); setStorage(START_KEY,String(Date.now()));
  const params=new URLSearchParams(location.search); void supabase.from("analytics_events").insert({event_name:"page_view",visitor_id:visitor,session_id:session,user_id:userRef.current||null,path:location.pathname,referrer:document.referrer||"",source:sourceFrom(document.referrer||""),medium:params.get("utm_medium"),campaign:params.get("utm_campaign")||params.get("utm_source"),device_type:deviceType(),metadata:{title:document.title}});\n  const autoEvent=location.pathname.startsWith("/brokers/")?"broker_page_view":location.pathname.startsWith("/chart/")?"ai_analysis_open":location.pathname==="/signals"?"signal_view":location.pathname.startsWith("/markets")||location.pathname==="/gold"||location.pathname==="/synthetic"||location.pathname==="/synthetic-hub"?"market_open":null;\n  if(autoEvent) void supabase.from("analytics_events").insert({event_name:autoEvent,visitor_id:visitor,session_id:session,user_id:userRef.current||null,path:location.pathname,source:sourceFrom(document.referrer||""),device_type:deviceType(),metadata:{title:document.title}});
 },[location.pathname,location.search]);
 useEffect(()=>{if(!user?.id)return; const visitor=storage(VISITOR_KEY)||makeId(); const session=storage(SESSION_KEY)||makeId(); void supabase.from("analytics_events").insert({event_name:"authenticated_session",visitor_id:visitor,session_id:session,user_id:user.id,path:location.pathname,device_type:deviceType(),metadata:{}});},[user?.id]);
 return null;
}