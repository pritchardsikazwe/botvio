import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Activity, BarChart3, Bell, Bot, ChevronLeft, ChevronRight, FileText, Globe2, LayoutDashboard, Mail, Menu, MoreVertical, RefreshCw, Search, Send, Settings, ShieldCheck, Signal, Sparkles, TrendingUp, UserCheck, Users, WalletCards } from "lucide-react";

type AdminUser = { user_id:string; email:string|null; display_name:string|null; country:string|null; created_at:string|null; plan:string; status:"Active"|"Inactive" };
const PAGE_SIZE=10;

export default function AdminControlCenter(){
  const { user }=useAuth();
  const [users,setUsers]=useState<AdminUser[]>([]),[loading,setLoading]=useState(true),[search,setSearch]=useState("");
  const [planFilter,setPlanFilter]=useState("all"),[statusFilter,setStatusFilter]=useState("all"),[countryFilter,setCountryFilter]=useState("all");
  const [page,setPage]=useState(1),[selected,setSelected]=useState<string[]>([]),[promotionOpen,setPromotionOpen]=useState(false),[sending,setSending]=useState(false);
  const [subject,setSubject]=useState("New AI Signals & Trading Update 🚀");
  const [message,setMessage]=useState("Hi {{name}},\n\nWe’ve just released new AI trading signals and market analysis on Botvio.\n\nLog in to your dashboard to see the latest updates.\n\nTrade smarter with Botvio.");

  const loadUsers=async()=>{
    setLoading(true);
    try{
      const {data:profiles,error}=await supabase.from("profiles").select("user_id,email,display_name,country,created_at").order("created_at",{ascending:false});
      if(error) throw error;
      const ids=(profiles||[]).map(p=>p.user_id); let subs:any[]=[];
      if(ids.length){const {data}=await supabase.from("user_plan_subscriptions").select("user_id,status,pricing_plans(name,code)").in("user_id",ids); subs=data||[];}
      const byUser=new Map(subs.map(s=>[s.user_id,s]));
      setUsers((profiles||[]).map(p=>{const s=byUser.get(p.user_id);return {user_id:p.user_id,email:p.email,display_name:p.display_name,country:p.country,created_at:p.created_at,plan:s?.pricing_plans?.name||s?.pricing_plans?.code||"Free",status:s?.status&&s.status!=="active"?"Inactive":"Active"}}));
    }catch(e:any){toast.error(e?.message||"Could not load users");}finally{setLoading(false);}
  };
  useEffect(()=>{loadUsers()},[]);

  const countries=useMemo(()=>Array.from(new Set(users.map(u=>u.country).filter(Boolean) as string[])).sort(),[users]);
  const plans=useMemo(()=>Array.from(new Set(users.map(u=>u.plan))).sort(),[users]);
  const filtered=useMemo(()=>{const q=search.toLowerCase().trim();return users.filter(u=>(!q||[u.email,u.display_name,u.country].some(v=>v?.toLowerCase().includes(q)))&&(planFilter==="all"||u.plan===planFilter)&&(statusFilter==="all"||u.status.toLowerCase()===statusFilter)&&(countryFilter==="all"||u.country===countryFilter))},[users,search,planFilter,statusFilter,countryFilter]);
  const pageCount=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)),visible=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  useEffect(()=>{if(page>pageCount)setPage(pageCount)},[page,pageCount]);

  const sendPromotion=async()=>{
    const recipients=users.filter(u=>selected.includes(u.user_id)&&u.email).map(u=>({user_id:u.user_id,email:u.email,name:u.display_name}));
    if(!recipients.length)return toast.error("Select at least one user with an email address");
    if(!subject.trim()||!message.trim())return toast.error("Subject and message are required");
    if(recipients.length>100)return toast.error("Select up to 100 users per promotion batch");
    setSending(true);
    try{const {data,error}=await supabase.functions.invoke("send-admin-promotion",{body:{subject:subject.trim(),message:message.trim(),recipients}});if(error)throw error;toast.success(`Promotion queued for ${data?.queued??recipients.length} users`);setSelected([]);setPromotionOpen(false)}catch(e:any){toast.error(e?.message||"Promotion could not be queued")}finally{setSending(false)}
  };

  const Stat=({label,value,icon}:{label:string;value:string|number;icon:React.ReactNode})=><Card><CardContent className="p-4 flex justify-between items-center"><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div><div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{icon}</div></CardContent></Card>;

  return <div className="min-h-screen bg-slate-50 text-slate-900 flex">
    <aside className="hidden lg:flex w-64 bg-slate-950 text-white flex-col shrink-0">
      <div className="p-5 border-b border-white/10"><div className="text-2xl font-black">▮▮ Botvio</div><div className="text-[11px] text-amber-300 tracking-widest">ADMIN PANEL</div></div>
      <ScrollArea className="flex-1"><nav className="p-3 space-y-1 text-sm">
        <div className="px-3 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-semibold flex gap-3"><LayoutDashboard className="h-4 w-4"/>Dashboard</div>
        <p className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-widest text-slate-500">Users & Community</p>
        {[Users,"Users",UserCheck,"User Segments",Send,"Send Promotions",WalletCards,"Subscriptions",Activity,"Activity Logs"].reduce<any[]>((a,v,i)=>{if(i%2===0)a.push([v,arguments]);return a},[]).map(()=>null)}
        {[[Users,"Users"],[UserCheck,"User Segments"],[Send,"Send Promotions"],[WalletCards,"Subscriptions"],[Activity,"Activity Logs"]].map(([I,l])=><div key={l as string} className="px-3 py-2.5 rounded-lg flex gap-3 text-slate-300"><I className="h-4 w-4"/>{l}</div>)}
        <p className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-widest text-slate-500">Trading Intelligence</p>
        {[[Signal,"Signals"],[Bot,"AI Bots"],[TrendingUp,"Copy Trading"],[ShieldCheck,"Providers"]].map(([I,l])=><div key={l as string} className="px-3 py-2.5 rounded-lg flex gap-3 text-slate-300"><I className="h-4 w-4"/>{l}</div>)}
        <p className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-widest text-slate-500">Content & SEO</p>
        {[[FileText,"Blog & Articles"],[Globe2,"Pages"],[Sparkles,"SEO Settings"]].map(([I,l])=><div key={l as string} className="px-3 py-2.5 rounded-lg flex gap-3 text-slate-300"><I className="h-4 w-4"/>{l}</div>)}
        <p className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-widest text-slate-500">System</p>
        {[[BarChart3,"Analytics"],[Settings,"Settings"]].map(([I,l])=><div key={l as string} className="px-3 py-2.5 rounded-lg flex gap-3 text-slate-300"><I className="h-4 w-4"/>{l}</div>)}
      </nav></ScrollArea>
      <div className="p-4 border-t border-white/10 text-xs text-slate-400">{user?.email||"Admin"}<div className="text-slate-600">Super Admin</div></div>
    </aside>

    <main className="flex-1 min-w-0">
      <header className="h-16 bg-white border-b flex items-center gap-3 px-4 lg:px-7 sticky top-0 z-20"><Button variant="ghost" size="icon" className="lg:hidden"><Menu/></Button><div className="relative flex-1 max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/><Input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search users, signals, content, analytics..." className="pl-9 bg-slate-50 border-0"/></div><Button variant="ghost" size="icon"><Bell/></Button><Button variant="ghost" size="icon"><Settings/></Button></header>
      <div className="p-4 lg:p-7 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-start"><div><h1 className="text-3xl font-bold">Dashboard</h1><p className="text-muted-foreground">Manage Botvio users, promotions and platform activity.</p></div><Button variant="outline" onClick={loadUsers}><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button></div>
        <div className="grid grid-cols-2 xl:grid-cols-6 gap-4"><Stat label="Total Users" value={users.length} icon={<Users/>}/><Stat label="Active Users" value={users.filter(u=>u.status==="Active").length} icon={<UserCheck/>}/><Stat label="Premium Users" value={users.filter(u=>u.plan.toLowerCase()!=="free").length} icon={<Sparkles/>}/><Stat label="Live Signals" value="Online" icon={<Signal/>}/><Stat label="AI Bots" value="Online" icon={<Bot/>}/><Stat label="Selected" value={selected.length} icon={<Send/>}/></div>

        <div className="grid xl:grid-cols-[1fr_360px] gap-6 items-start">
          <Card className="overflow-hidden"><div className="p-5 border-b flex flex-wrap justify-between gap-3"><div><h2 className="text-lg font-semibold">Users</h2><p className="text-sm text-muted-foreground">Search, filter and select users for promotions.</p></div><Button className="bg-amber-500 hover:bg-amber-600 text-slate-950" onClick={()=>setPromotionOpen(true)} disabled={!selected.length}><Send className="h-4 w-4 mr-2"/>Send Promotion ({selected.length})</Button></div>
            <div className="p-4 border-b bg-slate-50 flex flex-wrap gap-2">
              <Select value={planFilter} onValueChange={v=>{setPlanFilter(v);setPage(1)}}><SelectTrigger className="w-36 bg-white"><SelectValue placeholder="Plan"/></SelectTrigger><SelectContent><SelectItem value="all">All Plans</SelectItem>{plans.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
              <Select value={countryFilter} onValueChange={v=>{setCountryFilter(v);setPage(1)}}><SelectTrigger className="w-40 bg-white"><SelectValue placeholder="Country"/></SelectTrigger><SelectContent><SelectItem value="all">All Countries</SelectItem>{countries.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              <Select value={statusFilter} onValueChange={v=>{setStatusFilter(v);setPage(1)}}><SelectTrigger className="w-36 bg-white"><SelectValue placeholder="Status"/></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
              <Button variant="ghost" onClick={()=>{setSearch("");setPlanFilter("all");setCountryFilter("all");setStatusFilter("all");setPage(1)}}>Clear</Button>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-3 text-left"><Checkbox checked={visible.length>0&&visible.every(u=>selected.includes(u.user_id))} onCheckedChange={v=>setSelected(prev=>v?Array.from(new Set([...prev,...visible.map(u=>u.user_id)])):prev.filter(id=>!visible.some(u=>u.user_id===id)))}/></th><th className="p-3 text-left">User</th><th className="p-3 text-left">Country</th><th className="p-3 text-left">Plan</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Joined</th><th/></tr></thead><tbody>
              {loading?Array.from({length:6}).map((_,i)=><tr key={i} className="border-b"><td colSpan={7} className="p-5"><div className="h-4 bg-slate-100 rounded animate-pulse"/></td></tr>):visible.map(u=><tr key={u.user_id} className="border-b hover:bg-slate-50"><td className="p-3"><Checkbox checked={selected.includes(u.user_id)} onCheckedChange={v=>setSelected(prev=>v?Array.from(new Set([...prev,u.user_id])):prev.filter(id=>id!==u.user_id))}/></td><td className="p-3"><div className="font-medium">{u.display_name||"Unnamed user"}</div><div className="text-xs text-muted-foreground">{u.email||"No email"}</div></td><td className="p-3">{u.country||"—"}</td><td className="p-3"><Badge variant={u.plan.toLowerCase()==="free"?"secondary":"default"}>{u.plan}</Badge></td><td className="p-3"><Badge className={u.status==="Active"?"bg-emerald-600":"bg-slate-400"}>{u.status}</Badge></td><td className="p-3 text-muted-foreground">{u.created_at?new Date(u.created_at).toLocaleDateString():"—"}</td><td className="p-3"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></td></tr>)}
              {!loading&&!visible.length&&<tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No users match your filters.</td></tr>}
            </tbody></table></div>
            <div className="p-4 flex justify-between text-sm text-muted-foreground"><span>Showing {filtered.length?((page-1)*PAGE_SIZE)+1:0}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</span><div className="flex items-center gap-1"><Button variant="outline" size="icon" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft/></Button><span className="px-2">{page}/{pageCount}</span><Button variant="outline" size="icon" disabled={page>=pageCount} onClick={()=>setPage(p=>p+1)}><ChevronRight/></Button></div></div>
          </Card>
          <Card className="sticky top-24"><CardContent className="p-0"><div className="p-5 border-b"><h2 className="font-semibold flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/>Send Promotion</h2><p className="text-sm text-muted-foreground mt-1">Select users and compose a campaign.</p></div><div className="p-5 space-y-4"><div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm"><strong>{selected.length}</strong> recipients selected</div><div><label className="text-sm font-medium">Subject</label><Input className="mt-1" value={subject} onChange={e=>setSubject(e.target.value)}/></div><div><label className="text-sm font-medium">Message</label><Textarea className="mt-1 min-h-44" value={message} onChange={e=>setMessage(e.target.value)}/><p className="text-xs text-muted-foreground mt-1">Use {"{{name}}"} for the user's display name.</p></div><Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950" disabled={!selected.length} onClick={()=>setPromotionOpen(true)}><Send className="h-4 w-4 mr-2"/>Review & Send</Button></div></CardContent></Card>
        </div>
      </div>
    </main>

    <Dialog open={promotionOpen} onOpenChange={setPromotionOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Send Botvio Promotion</DialogTitle><DialogDescription>Review before queueing the promotion.</DialogDescription></DialogHeader><div className="space-y-4"><div className="rounded-lg bg-slate-50 p-4"><div className="text-xs text-muted-foreground">Recipients</div><div className="font-semibold">{selected.length} selected users</div><div className="text-xs text-muted-foreground mt-1">Suppressed/unsubscribed addresses are skipped by the server.</div></div><div><label className="text-sm font-medium">Subject</label><Input className="mt-1" value={subject} onChange={e=>setSubject(e.target.value)}/></div><div><label className="text-sm font-medium">Message</label><Textarea className="mt-1 min-h-48" value={message} onChange={e=>setMessage(e.target.value)}/></div></div><DialogFooter><Button variant="outline" onClick={()=>setPromotionOpen(false)} disabled={sending}>Cancel</Button><Button className="bg-amber-500 hover:bg-amber-600 text-slate-950" onClick={sendPromotion} disabled={sending}>{sending?<><RefreshCw className="h-4 w-4 mr-2 animate-spin"/>Queueing…</>:<><Send className="h-4 w-4 mr-2"/>Send Promotion</>}</Button></DialogFooter></DialogContent></Dialog>
  </div>
}