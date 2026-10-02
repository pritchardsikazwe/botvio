import type { BlogIndexEntry } from "./blogIndex";

export const DUBAI_BLOG_INDEX: BlogIndexEntry[] = [
  ["synthetic-indices-dubai-guide","Synthetic Indices in Dubai: Complete UAE Beginner's Guide","A Dubai-focused introduction to synthetic indices, market structure, trading routines and risk.","Dubai Trading","10 min"],
  ["how-to-trade-synthetic-indices-dubai","How to Trade Synthetic Indices in Dubai","A practical Dubai-time workflow for researching synthetic indices, setting risk controls and reviewing trades.","Dubai Trading","9 min"],
  ["deriv-synthetic-indices-uae","Deriv Synthetic Indices UAE: What Dubai Traders Need to Know","A factual guide to Deriv Derived Indices, UAE availability, MT5, demo practice and risk.","Dubai Trading","10 min"],
  ["synthetic-indices-vs-forex-dubai","Synthetic Indices vs Forex in Dubai","Compare market structure, hours, drivers, platform considerations and risk from a Dubai perspective.","Dubai Trading","9 min"],
  ["synthetic-indices-trading-hours-dubai","Synthetic Indices Trading Hours in Dubai","Understand 24/7 synthetic-index availability and build a disciplined Dubai-time routine.","Dubai Trading","8 min"],
  ["volatility-75-dubai-guide","Volatility 75 Trading in Dubai: Complete Guide","A Dubai-focused guide to V75, chart research, volatility and risk controls.","Dubai Trading","10 min"],
  ["v75-scalping-dubai","V75 Scalping Strategy for Dubai Traders","An educational, rules-based V75 scalping framework focused on process and risk.","Dubai Trading","10 min"],
  ["deriv-mt5-dubai-guide","How to Set Up Deriv MT5 in Dubai","A practical UAE guide to MT5 setup, account choices, charts and demo practice.","Dubai Trading","9 min"],
  ["forex-trading-dubai-guide","Forex Trading in Dubai: Beginner's Guide","A practical introduction to forex from Dubai, including sessions, leverage and risk management.","Dubai Trading","10 min"],
  ["gold-trading-dubai-guide","Gold XAUUSD Trading in Dubai: Beginner's Guide","A Dubai-time introduction to XAUUSD, sessions, macro drivers and risk controls.","Dubai Trading","10 min"],
].map(([slug,title,excerpt,category,readTime], i) => ({
  slug, title, excerpt, category, readTime, date: "2026-10-02", featured: i < 3, image: "🇦🇪",
}));
