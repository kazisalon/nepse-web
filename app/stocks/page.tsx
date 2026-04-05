import type { Metadata } from "next";
import { StockTable } from "@/components/StockTable";
import { fetchNepseMethod, fetchNepseStocksResult } from "@/lib/api";
import { clsx, formatNumber, pct } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Live NEPSE Stock Price List",
  description: "Browse live NEPSE stock prices and daily changes. Explore share price Nepal data and open any symbol for details.",
};

export default async function StocksPage() {
  const [stocksRes, marketOpenRes, topGainersRes, topLosersRes, marketSummaryRes] = await Promise.all([
    fetchNepseStocksResult({ allowMockFallback: true }),
    fetchNepseMethod<boolean>({ method: "is_market_open" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_stocks", query: { category: "top_gainer" } }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_stocks", query: { category: "top_loser" } }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Record<string, unknown>>({ method: "get_market_summary" }).catch(() => ({ data: undefined })),
  ]);

  const stocks = stocksRes.items;
  const stocksMeta = stocksRes.meta;
  const marketOpen = marketOpenRes.data;
  const topGainer = (topGainersRes.data ?? [])[0];
  const topLoser = (topLosersRes.data ?? [])[0];
  const gSymbol = typeof topGainer?.symbol === "string" ? topGainer.symbol : undefined;
  const gPct = typeof topGainer?.percentageChange === "number" ? topGainer.percentageChange : undefined;
  const gLtp = typeof topGainer?.ltp === "number" ? topGainer.ltp : undefined;
  const lSymbol = typeof topLoser?.symbol === "string" ? topLoser.symbol : undefined;
  const lPct = typeof topLoser?.percentageChange === "number" ? topLoser.percentageChange : undefined;
  const lLtp = typeof topLoser?.ltp === "number" ? topLoser.ltp : undefined;

  const totalTurnover =
    typeof marketSummaryRes.data?.totalTurnover === "number"
      ? (marketSummaryRes.data.totalTurnover as number)
      : typeof marketSummaryRes.data?.totalTurnover === "string"
        ? Number(String(marketSummaryRes.data.totalTurnover).replaceAll(",", ""))
        : undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Market</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          Live NEPSE market dashboard powered by serverless Python (cached). Open any symbol for details.
        </p>
      </header>

      {stocksMeta.source === "mock" ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-900 dark:text-amber-200">
          Live API is not reachable from the current runtime, so you’re seeing demo data. Run the app with Vercel Functions locally
          (recommended: <span className="font-medium">vercel dev</span>) or deploy to Vercel for live NEPSE data.
          {stocksMeta.message ? <div className="mt-2 text-xs opacity-80">Reason: {stocksMeta.message}</div> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-black/5 bg-white p-5 text-sm text-black/70 dark:border-white/10 dark:bg-black/30 dark:text-white/70">
          Data status:{" "}
          <span className="font-medium">
            {stocksMeta.cached ? "cached" : "fresh"}
            {stocksMeta.fetchedAt ? ` · fetchedAt ${stocksMeta.fetchedAt}` : ""}
            {stocksMeta.ttlSeconds ? ` · ttl ${stocksMeta.ttlSeconds}s` : ""}
          </span>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Market</div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={clsx(
                "h-2.5 w-2.5 rounded-full",
                marketOpen === undefined ? "bg-zinc-400" : marketOpen ? "bg-emerald-500" : "bg-rose-500"
              )}
            />
            <div className="text-lg font-semibold">
              {marketOpen === undefined ? "Unavailable" : marketOpen ? "Open" : "Closed"}
            </div>
          </div>
          <div className="mt-1 text-sm text-black/70 dark:text-white/70">Cache TTL: 60s</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Top Gainer</div>
          <div className="mt-2 text-lg font-semibold">{gSymbol ?? "—"}</div>
          <div className="mt-1 text-sm tabular-nums text-black/70 dark:text-white/70">
            {formatNumber(gLtp)} ({pct(gPct)})
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Top Loser</div>
          <div className="mt-2 text-lg font-semibold">{lSymbol ?? "—"}</div>
          <div className="mt-1 text-sm tabular-nums text-black/70 dark:text-white/70">
            {formatNumber(lLtp)} ({pct(lPct)})
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Turnover</div>
          <div className="mt-2 text-lg font-semibold tabular-nums">{totalTurnover ? formatNumber(totalTurnover) : "—"}</div>
          <div className="mt-1 text-sm text-black/70 dark:text-white/70">Today’s market summary</div>
        </div>
      </section>

      {stocks.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-6 text-sm text-black/60 dark:border-white/10 dark:bg-black/30 dark:text-white/60">
          No stock data available.
        </div>
      ) : (
        <StockTable stocks={stocks} />
      )}
    </div>
  );
}
