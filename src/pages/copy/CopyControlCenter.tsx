import { Link } from "react-router-dom";
import {
  Activity, Bot, CheckCircle2, ChevronRight, CircleDollarSign,
  Copy, Gauge, LineChart, Pause, Play, Radio, Settings, ShieldCheck,
  SlidersHorizontal, Users, Wallet, Zap
} from "lucide-react";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const green = "text-emerald-400";
const gold = "text-amber-400";

const Stat = ({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: any }) => (
  <Card className="border-border/50 bg-card/80">
    <CardContent className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className={cn("mt-1 text-[11px]", sub.startsWith("+") ? green : "text-muted-foreground")}>{sub}</div>}
    </CardContent>
  </Card>
);

const SignalRow = ({ side, market, price, result, time }: { side: "BUY" | "SELL"; market: string; price: string; result: string; time: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3">
    <Badge className={side === "BUY" ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15" : "bg-red-500/15 text-red-400 hover:bg-red-500/15"}>{side}</Badge>
    <div className="min-w-0 flex-1">
      <div className="text-sm font-semibold">{market}</div>
      <div className="text-[10px] text-muted-foreground">{price} · {time}</div>
    </div>
    <span className={cn("text-sm font-semibold", result.startsWith("+") ? green : "text-red-400")}>{result}</span>
  </div>
);

export const FollowerDashboard = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[0.2em] text-primary">Follower Dashboard</p><h1 className="text-2xl font-bold">My Copy Trading</h1><p className="text-sm text-muted-foreground">Manage copied providers, connected accounts and live performance.</p></div>
        <Button asChild><Link to="/copy-trading"><Users className="mr-2 h-4 w-4" /> Discover Providers</Link></Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Investment" value="$500.00" sub="3 active copies" icon={Wallet} />
        <Stat label="Current Value" value="$632.40" sub="+$132.40" icon={CircleDollarSign} />
        <Stat label="Total Profit" value="+26.48%" sub="+$132.40 (30d)" icon={LineChart} />
        <Stat label="Open Copied Trades" value="7" sub="+3 today" icon={Copy} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Active Copies</CardTitle><Badge variant="outline" className="text-emerald-400"><Activity className="mr-1 h-3 w-3" /> Live</Badge></CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Hauza Master", "Synthetic Indices", "+32.4%", "$132.40", "92%"],
              ["Botvio Robot", "AI Trading Robot", "+28.7%", "$257.40", "86%"],
              ["Gold Queen", "Gold & Forex", "+18.9%", "$242.60", "88%"],
            ].map(([name, type, profit, value, win]) => (
              <div key={name} className="rounded-2xl border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">{name === "Botvio Robot" ? <Bot className="h-5 w-5" /> : <Users className="h-5 w-5" />}</div>
                  <div className="min-w-0 flex-1"><div className="font-semibold">{name} <span className="ml-1 text-[10px] text-muted-foreground">• {type}</span></div><div className="text-xs text-muted-foreground">Copying automatically</div></div>
                  <Badge className="bg-emerald-500/15 text-emerald-400">Active</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div><div className={cn("font-semibold", green)}>{profit}</div><div className="text-[10px] text-muted-foreground">Profit (30d)</div></div>
                  <div><div className="font-semibold">{win}</div><div className="text-[10px] text-muted-foreground">Win rate</div></div>
                  <div><div className="font-semibold">$100</div><div className="text-[10px] text-muted-foreground">Invested</div></div>
                  <div><div className="font-semibold">{value}</div><div className="text-[10px] text-muted-foreground">Current value</div></div>
                </div>
                <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" className="flex-1"><Settings className="mr-1 h-3.5 w-3.5" /> Settings</Button><Button size="sm" variant="destructive" className="flex-1">Stop Copying</Button></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-sm">Live Copied Signals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <SignalRow side="BUY" market="Volatility 75" price="0.5123" result="+$18.40" time="2m ago" />
            <SignalRow side="SELL" market="Boom 500" price="8421.35" result="+$22.10" time="5m ago" />
            <SignalRow side="BUY" market="Crash 1000" price="7201.45" result="+$15.25" time="8m ago" />
            <SignalRow side="BUY" market="XAUUSD" price="3,782.20" result="+$31.60" time="12m ago" />
            <Button variant="ghost" className="w-full text-xs">View full trade history <ChevronRight className="ml-1 h-3 w-3" /></Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-sm">Copy Controls</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            ["Risk per trade", "1.0%", "Maximum risk copied to each account"],
            ["Daily loss limit", "5.0%", "Pause copying when reached"],
            ["Copy mode", "Proportional", "Match provider risk to your balance"],
          ].map(([a,b,c]) => <div key={a} className="rounded-xl border border-border/50 p-4"><div className="text-xs text-muted-foreground">{a}</div><div className="mt-1 text-lg font-semibold">{b}</div><div className="mt-1 text-[11px] text-muted-foreground">{c}</div></div>)}
        </CardContent>
      </Card>
    </main>
  </div>
);

export const ProviderCommandCenter = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[0.2em] text-primary">Signal Provider</p><h1 className="text-2xl font-bold">Hauza Master Command Center</h1><p className="text-sm text-muted-foreground">Generate signals, publish trades and deliver them automatically to attached follower accounts.</p></div>
        <div className="flex gap-2"><Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Strategy</Button><Button><Radio className="mr-2 h-4 w-4" /> Go Live</Button></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="30D Return" value="+210%" sub="Historical performance" icon={LineChart} />
        <Stat label="Win Rate" value="92%" sub="684 closed trades" icon={Gauge} />
        <Stat label="Followers" value="1,245" sub="+18% this month" icon={Users} />
        <Stat label="Signals Sent" value="684" sub="+42 today" icon={Radio} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Signal Engine</CardTitle><Badge className="bg-emerald-500/15 text-emerald-400"><span className="mr-1 h-2 w-2 rounded-full bg-emerald-400" /> Running</Badge></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["Market","Volatility 75"],["Strategy","Scalp Engine"],["Risk","1.0%"],["Mode","Automated"]].map(([a,b])=><div key={a} className="rounded-xl bg-muted/30 p-3"><div className="text-[10px] text-muted-foreground">{a}</div><div className="mt-1 text-sm font-semibold">{b}</div></div>)}</div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary"><Bot className="h-6 w-6" /></div><div className="flex-1"><div className="font-semibold">AI signal generation</div><div className="text-xs text-muted-foreground">Signals are validated before distribution.</div></div><Badge className="bg-emerald-500/15 text-emerald-400">ON</Badge></div><div className="mt-4"><Progress value={78} /><div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>Signal confidence</span><span>78%</span></div></div></div>
            <div className="flex gap-2"><Button className="flex-1"><Play className="mr-2 h-4 w-4" /> Start Engine</Button><Button variant="outline"><Pause className="mr-2 h-4 w-4" /> Pause</Button></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-sm">Follower Delivery</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[["Followers connected","1,245"],["Accounts online","1,208"],["Signals delivered","1,231"],["Failed deliveries","3"]].map(([a,b],i)=><div key={a} className="flex items-center justify-between rounded-xl border border-border/50 p-3"><span className="text-xs text-muted-foreground">{a}</span><span className={cn("font-semibold",i===3?"text-red-400":green)}>{b}</span></div>)}
            <div className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-400"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Every active signal is routed to eligible follower accounts automatically.</div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-sm">Recent Signals</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <SignalRow side="BUY" market="Volatility 75" price="0.5123" result="+$18.40" time="2 min ago" />
          <SignalRow side="SELL" market="Boom 500" price="8421.35" result="+$22.10" time="5 min ago" />
          <SignalRow side="BUY" market="Crash 1000" price="7201.45" result="+$15.25" time="8 min ago" />
        </CardContent>
      </Card>
    </main>
  </div>
);

export const BotvioRobotDashboard = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[0.2em] text-primary">BOTVIO ROBOT</p><h1 className="text-2xl font-bold">Automated Provider</h1><p className="text-sm text-muted-foreground">AI-generated signals become provider trades and are distributed to connected followers.</p></div>
        <Badge className="bg-emerald-500/15 px-3 py-1.5 text-emerald-400"><span className="mr-2 h-2 w-2 rounded-full bg-emerald-400" /> Running</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Return (30d)" value="+352%" sub="Historical" icon={LineChart} />
        <Stat label="Win Rate" value="86%" sub="684 trades" icon={Gauge} />
        <Stat label="Followers" value="412" sub="+27 this week" icon={Users} />
        <Stat label="Signals Today" value="42" sub="+8 executed" icon={Zap} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/50">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Bot className="h-5 w-5 text-primary" /> AI Trading Robot</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15"><Bot className="h-9 w-9 text-primary" /></div><div><div className="text-lg font-bold">Volatility 75 · Scalp Strategy</div><div className="text-xs text-muted-foreground">Signal → validation → provider trade → follower copy</div></div></div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Confidence","92%"],["Risk","1.0%"],["Open Trades","3"],["Followers","412"]].map(([a,b])=><div key={a} className="rounded-xl bg-background/70 p-3"><div className="text-[10px] text-muted-foreground">{a}</div><div className="mt-1 font-semibold">{b}</div></div>)}</div>
              <div className="mt-5 flex gap-2"><Button className="flex-1"><Pause className="mr-2 h-4 w-4" /> Pause Robot</Button><Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4" /> Edit Strategy</Button></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-sm">System Flow</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {["AI scans market","Signal confidence check","Provider trade created","Signal sent to followers","Follower risk rules applied","Execution confirmed"].map((x,i)=><div key={x} className="flex items-center gap-3 rounded-xl border border-border/50 p-3"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs text-primary">{i+1}</div><span className="text-xs">{x}</span><CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" /></div>)}
          </CardContent>
        </Card>
      </div>
      <Card className="border-border/50"><CardHeader><CardTitle className="text-sm">Live Signals & Trades</CardTitle></CardHeader><CardContent className="space-y-2"><SignalRow side="BUY" market="Volatility 75" price="0.5123" result="+$18.40" time="2m ago" /><SignalRow side="SELL" market="Boom 500" price="8421.35" result="+$22.10" time="5m ago" /><SignalRow side="BUY" market="Crash 1000" price="7201.45" result="+$15.25" time="8m ago" /></CardContent></Card>
    </main>
  </div>
);

export const CopyTradingAdmin = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto max-w-7xl space-y-5 px-4 py-6">
      <div><p className="text-xs uppercase tracking-[0.2em] text-primary">SYSTEM ADMIN</p><h1 className="text-2xl font-bold">Copy Trading Control Center</h1><p className="text-sm text-muted-foreground">Manage users, providers, Botvio Robot, signals, follower delivery and platform health.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Total Users" value="1,248" sub="+12%" icon={Users} /><Stat label="Providers" value="24" sub="+3%" icon={ShieldCheck} /><Stat label="Followers" value="1,224" sub="+15%" icon={Copy} /><Stat label="Active Copies" value="532" sub="+18%" icon={Activity} /></div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="border-border/50"><CardHeader><CardTitle className="text-sm">Platform Growth</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-3">{[["Users","1,248"],["Providers","24"],["Followers","1,224"]].map(([a,b])=><div key={a} className="rounded-xl bg-muted/30 p-3"><div className="text-[10px] text-muted-foreground">{a}</div><div className="text-lg font-semibold">{b}</div></div>)}</div><div className="mt-4 h-36 rounded-2xl border border-border/50 bg-gradient-to-t from-primary/10 to-transparent p-4"><div className="flex h-full items-end gap-2">{[28,35,32,48,42,55,61,58,70,76,82,94].map((h,i)=><div key={i} className="flex-1 rounded-t bg-primary/70" style={{height:`${h}%`}} />)}</div></div></CardContent></Card>
        <Card className="border-border/50"><CardHeader><CardTitle className="text-sm">System Health</CardTitle></CardHeader><CardContent className="space-y-2">{["API Connection","Signal Engine","Copy Trading Engine","Execution Queue","Email Service"].map(x=><div key={x} className="flex items-center justify-between rounded-xl border border-border/50 p-3 text-xs"><span>{x}</span><Badge className="bg-emerald-500/15 text-emerald-400">Online</Badge></div>)}</CardContent></Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="border-border/50"><CardHeader><CardTitle className="text-sm">Botvio Robot</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3"><Bot className="h-9 w-9 text-primary" /><div className="flex-1"><div className="font-semibold">Active</div><div className="text-xs text-muted-foreground">412 followers · 42 signals today</div></div><Button size="sm" variant="outline" asChild><Link to="/botvio-robot">Manage</Link></Button></div></CardContent></Card>
        <Card className="border-border/50"><CardHeader><CardTitle className="text-sm">Provider Network</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">24</div><div className="text-xs text-muted-foreground">18 active · 6 pending review</div><Button className="mt-3 w-full" variant="outline" asChild><Link to="/provider-dashboard">Provider controls</Link></Button></CardContent></Card>
        <Card className="border-border/50"><CardHeader><CardTitle className="text-sm">Follower Copies</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">532</div><div className="text-xs text-muted-foreground">98.7% delivery success</div><Button className="mt-3 w-full" variant="outline" asChild><Link to="/copy-trading/my">Follower dashboard</Link></Button></CardContent></Card>
      </div>
      <Card className="border-border/50"><CardHeader><CardTitle className="text-sm">Recent Platform Activity</CardTitle></CardHeader><CardContent className="space-y-2">{["New follower registered","Provider published a new signal","Botvio Robot executed V75 BUY","Follower started copying Hauza Master","Signal delivery completed"].map((x,i)=><div key={x} className="flex items-center gap-3 rounded-xl border border-border/50 p-3 text-xs"><Activity className="h-4 w-4 text-primary" /><span className="flex-1">{x}</span><span className="text-muted-foreground">{i+2}m ago</span></div>)}</CardContent></Card>
    </main>
  </div>
);
