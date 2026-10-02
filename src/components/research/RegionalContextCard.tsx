import { Globe2, Clock3, WalletCards, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import type { RegionalEditorialContext } from "@/content/regionalEditorial";

export const RegionalContextCard = ({ context }: { context: RegionalEditorialContext }) => (
  <section className="my-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Localized research</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">{context.label}</h2>
      </div>
      <Globe2 className="h-5 w-5 text-primary" />
    </div>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">{context.intro}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border/60 bg-card p-3"><Clock3 className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Time</p><p className="text-sm font-medium">{context.timezone}</p></div>
      <div className="rounded-xl border border-border/60 bg-card p-3"><WalletCards className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Currency</p><p className="text-sm font-medium">{context.currency}</p></div>
      <div className="rounded-xl border border-border/60 bg-card p-3"><Languages className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Language</p><p className="text-sm font-medium">{context.language}</p></div>
    </div>
    <ul className="mt-4 grid gap-2 text-sm text-foreground/85">
      {context.checklist.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}
    </ul>
    <div className="mt-4 flex flex-wrap gap-3">
      {context.links.map((link) => <Link key={link.to} to={link.to} className="text-sm font-medium text-primary underline underline-offset-4">{link.label}</Link>)}
    </div>
  </section>
);
