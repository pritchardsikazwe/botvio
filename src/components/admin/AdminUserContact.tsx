import { Phone, Globe2 } from "lucide-react";

export function AdminUserContact({ number, country }: { number: string | null; country: string | null }) {
  return <dl className="space-y-2 text-sm">
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <dt className="flex items-center gap-1 font-medium text-foreground"><Phone className="h-3.5 w-3.5" />WhatsApp:</dt>
      <dd>{number?.trim() ? <a className="break-all font-medium text-primary underline underline-offset-2" href={`https://wa.me/${number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{number}</a> : <span className="text-destructive">Not provided</span>}</dd>
    </div>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <dt className="flex items-center gap-1 font-medium text-foreground"><Globe2 className="h-3.5 w-3.5" />Country:</dt>
      <dd className="text-muted-foreground">{country || "Not provided"}</dd>
    </div>
  </dl>;
}