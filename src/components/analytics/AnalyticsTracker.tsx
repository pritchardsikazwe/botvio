import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { storage, setStorage, makeId, deviceType, sourceFrom, VISITOR_KEY, SESSION_KEY } from "./analytics";

const PREV_KEY="botvio_previous_path";
const START_KEY="botvio_page_started_at";

export function AnalyticsTracker(){
 const {user}=useAuth(); const location=useLocation(); const userRef=useRef(user?.id); userRef.current=user?.id;
 useEffect(()=>{
  let visitor=storage(VISITOR_KEY); if(!visitor){visitor=makeId();setStorage(VISITOR_KEY,visitor);} let session=storage(SESSION_KEY); if(!session){session=makeId();setStorage(SESSION_KEY,session);}
  const previous=storage(PREV_KEY); const started=Number(storage(START_KEY)||Date.now());
  if(previous&&previous!==location.pathname){void supabase.from("analytics_events").insert({event_name:"page_time",visitor_id:visitor,session_id:session,user_id:userRef.current||null,path:previous,referrer:document.referrer||"",source:sourceFrom(document.referrer||""),device_type:deviceType(),metadata:{duration_seconds:Math.max(0,Math.round((Date.now()-started)/1000))}});}
  setStorage(PREV_KEY,location.pathname); setStorage(START_KEY,String(Date.now()));
  const params=new URLSearchParams(location.search); void supabase.from("analytics_events").insert({event_name:"page_view",visitor_id:visitor,session_id:session,user_id:userRef.current||null,path:location.pathname,referrer:document.referrer||"",source:sourceFrom(document.referrer||""),medium:params.get("utm_medium"),campaign:params.get("utm_campaign")||params.get("utm_source"),device_type:deviceType(),metadata:{title:document.title}});
  const autoEvent=location.pathname.startsWith("/brokers/")?"broker_page_view":location.pathname.startsWith("/chart/")?"ai_analysis_open":location.pathname==="/signals"?"signal_view":location.pathname.startsWith("/markets")||location.pathname==="/gold"||location.pathname==="/synthetic"||location.pathname==="/synthetic-hub"?"market_open":null;
  if(autoEvent) void supabase.from("analytics_events").insert({event_name:autoEvent,visitor_id:visitor,session_id:session,user_id:userRef.current||null,path:location.pathname,source:sourceFrom(document.referrer||""),device_type:deviceType(),metadata:{title:document.title}});
 },[location.pathname,location.search]);
 useEffect(()=>{if(!user?.id)return; const visitor=storage(VISITOR_KEY)||makeId(); const session=storage(SESSION_KEY)||makeId(); void supabase.from("analytics_events").insert({event_name:"authenticated_session",visitor_id:visitor,session_id:session,user_id:user.id,path:location.pathname,device_type:deviceType(),metadata:{}});},[user?.id]);
 return null;
}