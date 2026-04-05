import type { NepseStock, Portfolio, PortfolioSummary } from "./types";

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function formatNpr(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatNumber(value?: number) {
  if (value === undefined || value === null) return "—";
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-NP", { maximumFractionDigits: 2 }).format(value);
}

export function pct(value?: number) {
  if (value === undefined || value === null) return "—";
  if (!Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function clsx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function normalizeSymbol(value: string) {
  return value.trim().toUpperCase();
}

export function getLtpBySymbol(stocks: NepseStock[], symbol: string) {
  const s = normalizeSymbol(symbol);
  return stocks.find((x) => normalizeSymbol(x.symbol) === s)?.ltp;
}

export function calculatePortfolioSummary(portfolio: Portfolio, stocks: NepseStock[]): PortfolioSummary {
  const holdingsValue = Object.values(portfolio.holdings).reduce((sum, h) => {
    const ltp = getLtpBySymbol(stocks, h.symbol) ?? h.avgPrice;
    return sum + h.quantity * ltp;
  }, 0);

  const costBasis = Object.values(portfolio.holdings).reduce((sum, h) => sum + h.quantity * h.avgPrice, 0);
  const totalValue = portfolio.cash + holdingsValue;
  const pnl = holdingsValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  return { cash: portfolio.cash, holdingsValue, totalValue, pnl, pnlPercent };
}

export function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

