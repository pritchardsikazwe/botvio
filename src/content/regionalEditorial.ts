export type RegionalKey = "dubai" | "usa" | "uk" | "canada" | "australia" | "africa";

export interface RegionalEditorialContext {
  key: RegionalKey;
  label: string;
  shortLabel: string;
  timezone: string;
  currency: string;
  language: string;
  intro: string;
  checklist: string[];
  links: { label: string; to: string }[];
}

export const REGIONAL_CONTEXTS: Record<RegionalKey, RegionalEditorialContext> = {
  dubai: {
    key: "dubai",
    label: "Dubai & UAE",
    shortLabel: "UAE",
    timezone: "Gulf Standard Time (GST, UTC+4)",
    currency: "UAE dirham (AED)",
    language: "English, with Arabic-ready terminology and RTL support",
    intro: "This research is localized for traders in Dubai and the wider UAE. Where broker availability, regulation, trading hours or account details matter, readers should verify the current terms for their UAE jurisdiction before acting.",
    checklist: ["Dubai/UAE time is used where session timing matters.", "AED is used for examples where a local-currency example is useful.", "Broker and regulatory claims are separated from Botvio's own research.", "Affiliate relationships are disclosed before commercial actions."],
    links: [{ label: "Dubai Trading Guide", to: "/dubai" }, { label: "Synthetic Indices", to: "/blog/category/synthetic-indices" }, { label: "Deriv research", to: "/blog/category/deriv" }],
  },
  usa: {
    key: "usa", label: "United States", shortLabel: "USA", timezone: "U.S. Eastern / Pacific time as stated", currency: "US dollar (USD)", language: "English",
    intro: "This research is written with U.S. readers in mind. Broker availability, products, leverage and legal requirements can vary by state and customer type, so readers should verify current terms with the relevant provider.",
    checklist: ["U.S. terminology is preferred where practical.", "Jurisdiction-specific claims are identified rather than generalized.", "Broker availability is treated as subject to current eligibility."],
    links: [{ label: "Forex research", to: "/blog/category/forex" }, { label: "Risk management", to: "/blog/category/risk-management" }],
  },
  uk: {
    key: "uk", label: "United Kingdom", shortLabel: "UK", timezone: "UK local time", currency: "Pound sterling (GBP)", language: "English",
    intro: "This research is localized for readers in the United Kingdom. Product availability, retail-client protections and broker terms can change, so current provider documentation should be checked before opening or funding an account.",
    checklist: ["UK terminology is preferred.", "Regulatory statements are attributed to the relevant authority or provider.", "No claim of authorization is made for Botvio unless explicitly documented."],
    links: [{ label: "Forex research", to: "/blog/category/forex" }, { label: "Broker research", to: "/blog/category/broker-reviews" }],
  },
  canada: {
    key: "canada", label: "Canada", shortLabel: "Canada", timezone: "Canadian local time by session", currency: "Canadian dollar (CAD)", language: "English",
    intro: "This research is localized for Canadian readers. Provincial rules, broker eligibility and product access can differ, so readers should verify the current conditions that apply to their province and account type.",
    checklist: ["Canadian terminology is used where useful.", "Provincial variation is not treated as one national rule.", "Product availability is presented as subject to current eligibility."],
    links: [{ label: "Forex research", to: "/blog/category/forex" }, { label: "Risk management", to: "/blog/category/risk-management" }],
  },
  australia: {
    key: "australia", label: "Australia", shortLabel: "Australia", timezone: "Australian local time by session", currency: "Australian dollar (AUD)", language: "English",
    intro: "This research is localized for Australian readers. Broker licensing, leverage limits and product availability depend on the provider and client classification, so current Australian terms should be checked before acting.",
    checklist: ["Australian terminology is used where useful.", "Regulatory claims are attributed.", "No performance or safety guarantee is implied."],
    links: [{ label: "Forex research", to: "/blog/category/forex" }, { label: "Broker research", to: "/blog/category/broker-reviews" }],
  },
  africa: {
    key: "africa", label: "Africa", shortLabel: "Africa", timezone: "Local African time zone stated per article", currency: "Local currency where stated", language: "English",
    intro: "This research is written for African readers without assuming that one country's financial rules apply across the continent. Broker access, payments, taxes and regulation should be checked for the reader's specific country.",
    checklist: ["Country-specific claims are identified.", "Currency and payment examples are labeled.", "No blanket regulatory claim is made for Africa as a whole."],
    links: [{ label: "Education", to: "/blog/category/education" }, { label: "Risk management", to: "/blog/category/risk-management" }],
  },
};

export const detectRegionalContext = (title = "", excerpt = "", category = ""): RegionalEditorialContext | null => {
  const text = `${title} ${excerpt} ${category}`.toLowerCase();
  if (/dubai|uae|united arab emirates|abu dhabi|gulf|middle east/.test(text)) return REGIONAL_CONTEXTS.dubai;
  if (/usa|united states|american|u\.s\./.test(text)) return REGIONAL_CONTEXTS.usa;
  if (/uk|united kingdom|british|england|fca/.test(text)) return REGIONAL_CONTEXTS.uk;
  if (/canada|canadian/.test(text)) return REGIONAL_CONTEXTS.canada;
  if (/australia|australian|asx|asic/.test(text)) return REGIONAL_CONTEXTS.australia;
  if (/zambia|nigeria|ghana|kenya|south africa|africa|african/.test(text)) return REGIONAL_CONTEXTS.africa;
  return null;
};
