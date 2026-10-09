export type WeltradeCandle = { time: number; open: number; high: number; low: number; close: number };

export function unwrapStudio(value: unknown): unknown {
  if (typeof value === "string") {
    try { return unwrapStudio(JSON.parse(value)); } catch { return value; }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return record.data === undefined ? value : unwrapStudio(record.data);
  }
  return value;
}

export function studioSymbols(value: unknown): string[] {
  const raw = unwrapStudio(value);
  if (Array.isArray(raw)) return raw.map((item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    const row = item as Record<string, unknown>;
    return String(row.symbol ?? row.Symbol ?? row.name ?? row.Name ?? "");
  }).filter(Boolean);
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    for (const key of ["symbols", "Symbols", "items", "result"]) {
      if (record[key] !== undefined) return studioSymbols(record[key]);
    }
  }
  return [];
}

export function studioSymbolCandidates(requested: string, symbols: string[]): string[] {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = normalize(requested);
  return [...new Set([
    ...symbols.filter((symbol) => normalize(symbol) === key),
    ...symbols.filter((symbol) => normalize(symbol).startsWith(key)),
  ])];
}

export function studioTime(value: unknown): number {
  if (typeof value === "number") return value > 10_000_000_000 ? Math.floor(value / 1000) : value;
  const text = String(value ?? "");
  const zoned = /Z$|[+-]\d{2}:?\d{2}$/.test(text) ? text : `${text}Z`;
  return Math.floor(Date.parse(zoned) / 1000);
}

export function studioOffset(quote: unknown, now: number): number {
  const raw = unwrapStudio(quote);
  if (!raw || typeof raw !== "object") return 0;
  const record = raw as Record<string, unknown>;
  const time = studioTime(record.time ?? record.Time);
  const diff = time * 1000 - now;
  // An old quote must not shift the history window by days.
  return Number.isFinite(diff) && Math.abs(diff) <= 14 * 3600_000 ? Math.round(diff / 1800_000) * 1800 : 0;
}

export function studioCandles(value: unknown, offset = 0): WeltradeCandle[] {
  const raw = unwrapStudio(value);
  const record = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const list = Array.isArray(raw) ? raw : ["bars", "quotes", "items", "result"].map((key) => record[key]).find(Array.isArray) ?? [];
  const result = (list as unknown[]).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    return [{
      time: studioTime(row.time ?? row.Time ?? row.timestamp ?? row.Timestamp ?? row.date ?? row.Date) - offset,
      open: Number(row.open ?? row.Open ?? row.openPrice ?? row.OpenPrice),
      high: Number(row.high ?? row.High ?? row.highPrice ?? row.HighPrice),
      low: Number(row.low ?? row.Low ?? row.lowPrice ?? row.LowPrice),
      close: Number(row.close ?? row.Close ?? row.closePrice ?? row.ClosePrice),
    }];
  }).filter((bar) => Number.isFinite(bar.time) && bar.time > 0 && [bar.open, bar.high, bar.low, bar.close].every((price) => Number.isFinite(price) && price > 0) && bar.low <= Math.min(bar.open, bar.close) && bar.high >= Math.max(bar.open, bar.close));
  return [...new Map(result.map((bar) => [bar.time, bar])).values()].sort((a, b) => a.time - b.time);
}