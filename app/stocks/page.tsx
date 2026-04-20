import type { Metadata } from "next";
import Link from "next/link";
import { StockTable } from "@/components/StockTable";
import { fetchNepseMethod, fetchNepseStocksResult } from "@/lib/api";
import { clsx, formatNumber, pct } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Live NEPSE Stock Price List",
  description: "Browse live NEPSE stock prices and daily changes. Explore share price Nepal data and open any symbol for details.",
};

async function StatCard({ label, value, sub, children }: { label: string; value?: string | number; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
      <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">{label}</div>
      <div className="mt-2 text-lg font-semibold">{children ?? value ?? "—"}</div>
      {sub ? <div className="mt-1 text-sm text-black/70 dark:text-white/70">{sub}</div> : null}
    </div>
  );
}

export default async function StocksPage() {
  const [
    stocksRes,
    marketOpenRes,
    isTradingDayRes,
    topGainersRes,
    topLosersRes,
    topTurnoverRes,
    topTradeRes,
    topTransactionRes,
    topTradeQtyRes,
    marketSummaryRes,
    todayMarketSummaryRes,
    sectorwiseSummaryRes,
    noticesRes,
  ] = await Promise.all([
    fetchNepseStocksResult({ allowMockFallback: true }),
    fetchNepseMethod<boolean>({ method: "is_market_open" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<boolean>({ method: "is_trading_day" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_gainer" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_loser" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_turnover" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_trade" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_transaction" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_by_trade_quantity" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Record<string, unknown>>({ method: "get_market_summary" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Record<string, unknown>>({ method: "get_today_market_summary" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_sectorwise_summary" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_notices" }).catch(() => ({ data: undefined })),
  ]);

  const stocks = stocksRes.items;
  const stocksMeta = stocksRes.meta;
  const marketOpen = marketOpenRes.data;
  const isTradingDay = isTradingDayRes.data;

  function pickFirstItem(items: Array<Record<string, unknown>> | undefined) {
    const first = (items ?? [])[0];
    if (!first) return { symbol: undefined, ltp: undefined, change: undefined, percentChange: undefined, turnover: undefined };
    const symbol = typeof first?.symbol === "string" ? first.symbol : undefined;
    const ltp = typeof first?.ltp === "number" ? first.ltp : undefined;
    const percentChange = typeof first?.percentageChange === "number" ? first.percentageChange : undefined;
    const change = typeof first?.change === "number" ? first.change : undefined;
    const turnover = typeof first?.turnover === "number" ? first.turnover : undefined;
    return { symbol, ltp, change, percentChange, turnover };
  }

  const tg = pickFirstItem(topGainersRes.data);
  const tl = pickFirstItem(topLosersRes.data);
  const tto = pickFirstItem(topTurnoverRes.data);
  const ttr = pickFirstItem(topTradeRes.data);
  const ttn = pickFirstItem(topTransactionRes.data);
  const ttq = pickFirstItem(topTradeQtyRes.data);

  const totalTurnover =
    typeof (marketSummaryRes.data ?? todayMarketSummaryRes.data)?.totalTurnover === "number"
      ? ((marketSummaryRes.data ?? todayMarketSummaryRes.data)?.totalTurnover as number)
      : typeof (marketSummaryRes.data ?? todayMarketSummaryRes.data)?.totalTurnover === "string"
        ? Number(String((marketSummaryRes.data ?? todayMarketSummaryRes.data)?.totalTurnover).replaceAll(",", ""))
        : undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Market</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          Live NEPSE market dashboard: prices, movers, indices, notices, and more—powered by serverless Python (cached).
        </p>
      </header>

      {stocksMeta.source === "mock" ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-900 dark:text-amber-200">
          <div className="font-medium">You’re viewing demo data (live API not reachable).</div>
          <div className="mt-1">
            {stocksMeta.message ? <span>Reason: {stocksMeta.message}</span> : <span>Run <span className="font-medium">npm run dev</span> locally (starts UI + Python server) or deploy to your serverless platform for live NEPSE data.</span>}
          </div>
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Market Status"
          sub={isTradingDay === true ? "Trading day" : isTradingDay === false ? "Not a trading day" : "Check NEPSE for today’s calendar"}
        >
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
        </StatCard>

        <StatCard label="Top Gainer">
          <div className="mt-2 text-lg font-semibold">{tg.symbol ?? "—"}</div>
          <div className="mt-1 text-sm tabular-nums text-black/70 dark:text-white/70">
            {formatNumber(tg.ltp)} ({pct(tg.percentChange)})
          </div>
        </StatCard>

        <StatCard label="Top Loser">
          <div className="mt-2 text-lg font-semibold">{tl.symbol ?? "—"}</div>
          <div className="mt-1 text-sm tabular-nums text-black/70 dark:text-white/70">
            {formatNumber(tl.ltp)} ({pct(tl.percentChange)})
          </div>
        </StatCard>

        <StatCard label="Turnover" value={totalTurnover ? formatNumber(totalTurnover) : undefined} sub="Today’s total turnover" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Top Turnover">
          <div className="mt-2 text-lg font-semibold">{tto.symbol ?? "—"}</div>
          <div className="mt-1 text-sm tabular-nums text-black/70 dark:text-white/70">
            {tto.turnover ? formatNumber(tto.turnover) : "—"}
          </div>
        </StatCard>

        <StatCard label="Top Trade">
          <div className="mt-2 text-lg font-semibold">{ttr.symbol ?? "—"}</div>
        </StatCard>

        <StatCard label="Top Transaction">
          <div className="mt-2 text-lg font-semibold">{ttn.symbol ?? "—"}</div>
        </StatCard>

        <StatCard label="Top Trade Qty">
          <div className="mt-2 text-lg font-semibold">{ttq.symbol ?? "—"}</div>
        </StatCard>
      </section>

      {(sectorwiseSummaryRes.data ?? []).length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Sectorwise Summary</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(sectorwiseSummaryRes.data ?? []).slice(0, 6).map((s, i) => {
              const name = typeof s?.sectorName === "string" ? s.sectorName : typeof s?.sector === "string" ? s.sector : `Sector ${i + 1}`;
              const change = typeof s?.change === "number" ? s.change : undefined;
              const percentChange = typeof s?.percentChange === "number" ? s.percentChange : undefined;
              return (
                <div key={i} className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-black/30">
                  <div className="font-medium">{name}</div>
                  <div className="mt-1 text-sm tabular-nums text-black/70 dark:text-white/70">
                    {change !== undefined ? formatNumber(change) : ""} {percentChange !== undefined ? `(${pct(percentChange)})` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {(noticesRes.data ?? []).length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Latest Notices</h2>
          <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-black/30">
            <ul className="space-y-2">
              {(noticesRes.data ?? []).slice(0, 5).map((n, i) => {
                const title = typeof n?.title === "string" ? n.title : typeof n?.noticeTitle === "string" ? n.noticeTitle : `Notice ${i + 1}`;
                return (
                  <li key={i} className="text-sm">
                    • {title}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">NEPSE Stocks</h2>
          <Link href="/portfolio" className="text-sm font-medium hover:underline">
            Simulator
          </Link>
        </div>
        {stocks.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white p-6 text-sm text-black/60 dark:border-white/10 dark:bg-black/30 dark:text-white/60">
            No stock data available.
          </div>
        ) : (
          <StockTable stocks={stocks} />
        )}
      </section>
    </div>
  );
}
