import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StockCard } from "@/components/StockCard";
import { fetchNepseMethod, fetchNepseStocks } from "@/lib/api";
import { formatNumber, normalizeSymbol } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  const sym = normalizeSymbol(symbol);
  return {
    title: `${sym} NEPSE Stock Price`,
    description: `Latest ${sym} NEPSE stock price and details. Share price Nepal data with NEPSELab virtual portfolio tools.`,
  };
}

export default async function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sym = normalizeSymbol(symbol);

  const [items, tickerInfoRes] = await Promise.all([
    fetchNepseStocks({ symbol: sym }),
    fetchNepseMethod<Record<string, unknown>>({ method: "get_ticker_info", symbol: sym }).catch(() => ({ data: undefined })),
  ]);

  const stock = items[0];
  if (!stock) notFound();

  const info = tickerInfoRes.data;
  const security = (info && typeof info === "object" ? (info as Record<string, unknown>).security : undefined) as
    | Record<string, unknown>
    | undefined;
  const daily = (info && typeof info === "object" ? (info as Record<string, unknown>).securityDailyTradeDto : undefined) as
    | Record<string, unknown>
    | undefined;

  const isin = typeof security?.isin === "string" ? security.isin : undefined;
  const listingDate = typeof security?.listingDate === "string" ? security.listingDate : undefined;
  const faceValue = typeof security?.faceValue === "number" ? security.faceValue : undefined;

  const openPrice = typeof daily?.openPrice === "number" ? daily.openPrice : undefined;
  const highPrice = typeof daily?.highPrice === "number" ? daily.highPrice : undefined;
  const lowPrice = typeof daily?.lowPrice === "number" ? daily.lowPrice : undefined;
  const totalTrades = typeof daily?.totalTrades === "number" ? daily.totalTrades : undefined;
  const totalQty = typeof daily?.totalTradeQuantity === "number" ? daily.totalTradeQuantity : undefined;

  return (
    <div className="space-y-6">
      <StockCard stock={stock} />

      <section className="rounded-2xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-black/30">
        <h2 className="text-base font-semibold">Company details</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">ISIN</div>
            <div className="mt-1 font-medium">{isin ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Listing Date</div>
            <div className="mt-1 font-medium">{listingDate ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Face Value</div>
            <div className="mt-1 font-medium tabular-nums">{faceValue ? formatNumber(faceValue) : "—"}</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-black/30">
        <h2 className="text-base font-semibold">Today stats</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-5">
          <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Open</div>
            <div className="mt-1 font-medium tabular-nums">{formatNumber(openPrice)}</div>
          </div>
          <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">High</div>
            <div className="mt-1 font-medium tabular-nums">{formatNumber(highPrice)}</div>
          </div>
          <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Low</div>
            <div className="mt-1 font-medium tabular-nums">{formatNumber(lowPrice)}</div>
          </div>
          <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Trades</div>
            <div className="mt-1 font-medium tabular-nums">{formatNumber(totalTrades)}</div>
          </div>
          <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Quantity</div>
            <div className="mt-1 font-medium tabular-nums">{formatNumber(totalQty)}</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-6 text-sm text-black/70 dark:border-white/10 dark:bg-black/30 dark:text-white/70">
        <h2 className="text-base font-semibold text-black dark:text-white">About this page</h2>
        <p className="mt-2">
          This is a server-rendered stock details page designed for SEO keywords like “NEPSE stock price” and “share price Nepal”.
          Use the Simulator to place virtual buy/sell trades and track a local-only portfolio.
        </p>
      </section>
    </div>
  );
}
