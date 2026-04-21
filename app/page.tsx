import Link from "next/link";
import { CandlestickChart, type Candle } from "@/components/CandlestickChart";
import { OrderEntryPanel } from "@/components/OrderEntryPanel";
import { PortfolioMini } from "@/components/PortfolioMini";
import { fetchNepseMethod, fetchNepseStocksResult } from "@/lib/api";
import type { NepseStock } from "@/lib/types";
import { clsx, formatNumber, pct } from "@/lib/utils";

function isoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeStartDate(range: string | undefined) {
  const now = new Date();
  const d = new Date(now);
  if (!range) d.setMonth(d.getMonth() - 6);
  else if (range === "1m") d.setMonth(d.getMonth() - 1);
  else if (range === "3m") d.setMonth(d.getMonth() - 3);
  else if (range === "6m") d.setMonth(d.getMonth() - 6);
  else if (range === "1y") d.setFullYear(d.getFullYear() - 1);
  else if (range === "all") d.setFullYear(d.getFullYear() - 3);
  else d.setMonth(d.getMonth() - 6);
  return isoDate(d);
}

export default async function Home({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const sp = searchParams ?? {};
  const requestedSymbol = typeof sp.symbol === "string" ? sp.symbol.trim().toUpperCase() : undefined;
  const rangeParam = typeof sp.range === "string" ? sp.range : undefined;
  const startDate = computeStartDate(rangeParam);
  const endDate = isoDate(new Date());

  const [stocksRes, marketOpenRes, topGainerRes, topLoserRes, newsRes] = await Promise.all([
    fetchNepseStocksResult({ limit: 80, allowMockFallback: true }),
    fetchNepseMethod<boolean>({ method: "is_market_open" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_gainer" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_loser" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_news" })
      .catch(() => fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_notices" }))
      .catch(() => ({ data: undefined })),
  ]);

  const stocks = stocksRes.items;
  const meta = stocksRes.meta;
  const marketOpen = marketOpenRes.data;

  const selected = pickSelectedStock(stocks, requestedSymbol);
  const selectedSymbol = selected?.symbol ?? stocks[0]?.symbol ?? "";

  const historyRes = await fetchNepseMethod<Array<Record<string, unknown>>>({
    method: "get_ticker_price_history",
    symbol: selectedSymbol,
    query: startDate ? { start_date: startDate, end_date: endDate } : undefined,
  }).catch(async () =>
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_ticker_price_history", symbol: selectedSymbol }).catch(() => ({ data: undefined }))
  );

  const candles = Array.isArray(historyRes.data)
    ? (historyRes.data
        .map((c): Candle | null => {
          if (!c || typeof c !== "object") return null;
          const time = typeof c.time === "string" ? c.time : null;
          const open = typeof c.open === "number" ? c.open : null;
          const high = typeof c.high === "number" ? c.high : null;
          const low = typeof c.low === "number" ? c.low : null;
          const close = typeof c.close === "number" ? c.close : null;
          const volume = typeof c.volume === "number" ? c.volume : undefined;
          if (!time || open === null || high === null || low === null || close === null) return null;
          return { time, open, high, low, close, volume };
        })
        .filter(Boolean) as Candle[])
    : [];

  const topGainer = (topGainerRes.data ?? [])[0];
  const topLoser = (topLoserRes.data ?? [])[0];
  const gSymbol = typeof topGainer?.symbol === "string" ? topGainer.symbol : undefined;
  const gPct = typeof topGainer?.percentageChange === "number" ? topGainer.percentageChange : undefined;
  const lSymbol = typeof topLoser?.symbol === "string" ? topLoser.symbol : undefined;
  const lPct = typeof topLoser?.percentageChange === "number" ? topLoser.percentageChange : undefined;

  const watchlist = stocks.slice(0, 6);
  const orderStocks = stocks.slice(0, 80).map((s) => ({ symbol: s.symbol, securityName: s.securityName, ltp: s.ltp }));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/5 bg-white/70 p-6 backdrop-blur dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-black/70 dark:text-white/70">Live NEPSE market data for tracking prices, movers, and chart-based analysis.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/stocks"
              className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              Market
            </Link>
            <Link
              href="/trade"
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Practice
            </Link>
            <Link
              href="/portfolio"
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Portfolio
            </Link>
          </div>
        </div>
      </section>

      {meta.source === "mock" ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-900 dark:text-amber-200">
          <div className="font-medium">You’re viewing demo data (live API not reachable).</div>
          <div className="mt-1">{meta.message ? <span>Reason: {meta.message}</span> : <span>Run <span className="font-medium">npm run dev</span> for live data.</span>}</div>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-3">
          <section className="rounded-2xl border border-black/5 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-black/30">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Market Overview</div>
              <div className="text-xs text-black/60 dark:text-white/60">Watchlist</div>
            </div>
            <div className="mt-4 space-y-3">
              {watchlist.map((s) => {
                const up = (s.percentChange ?? 0) >= 0;
                const href = s.symbol ? `/?symbol=${encodeURIComponent(s.symbol)}` : "/";
                return (
                  <Link
                    key={s.symbol}
                    href={href}
                    className={clsx(
                      "flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-white/60 px-3 py-2 hover:bg-white dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/10",
                      s.symbol === selectedSymbol ? "ring-4 ring-emerald-500/15" : ""
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{s.symbol}</div>
                      <div className="text-xs text-black/60 dark:text-white/60">{formatNumber(s.ltp)}</div>
                    </div>
                    <div className={clsx("shrink-0 text-xs tabular-nums", up ? "text-emerald-600" : "text-rose-600")}>
                      {pct(s.percentChange)}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20">
                <div className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Market</div>
                <div className="mt-1 flex items-center gap-2 font-medium">
                  <span
                    className={clsx(
                      "h-2.5 w-2.5 rounded-full",
                      marketOpen === undefined ? "bg-zinc-400" : marketOpen ? "bg-emerald-500" : "bg-rose-500"
                    )}
                  />
                  <span>{marketOpen === undefined ? "—" : marketOpen ? "Open" : "Closed"}</span>
                </div>
              </div>
              <div className="rounded-xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20">
                <div className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Movers</div>
                <div className="mt-1 text-xs text-black/70 dark:text-white/70">
                  <span className="font-medium">{gSymbol ?? "—"}</span> {pct(gPct)}
                </div>
                <div className="mt-1 text-xs text-black/70 dark:text-white/70">
                  <span className="font-medium">{lSymbol ?? "—"}</span> {pct(lPct)}
                </div>
              </div>
            </div>
          </section>

          <PortfolioMini stocks={stocks} />
        </div>

        <div className="space-y-4 lg:col-span-6">
          <section className="rounded-2xl border border-black/5 bg-gradient-to-r from-emerald-500/15 via-white/60 to-cyan-500/15 p-5 backdrop-blur dark:border-white/10 dark:from-emerald-500/10 dark:via-black/30 dark:to-cyan-500/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Selected</div>
                <div className="mt-1 text-2xl font-semibold">{selected?.symbol ?? "—"}</div>
                <div className="mt-1 text-sm text-black/70 dark:text-white/70">{selected?.securityName ?? "NEPSE security"}</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="text-xl font-semibold tabular-nums">{formatNumber(selected?.ltp)}</div>
                  <div
                    className={clsx(
                      "text-sm tabular-nums",
                      (selected?.percentChange ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {pct(selected?.percentChange)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="#order"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500/90"
                >
                  Buy
                </Link>
                <Link
                  href="#order"
                  className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500/90"
                >
                  Sell
                </Link>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-black/5 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-black/30">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Chart</div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 md:flex">
                  {[
                    { label: "1M", value: "1m" },
                    { label: "3M", value: "3m" },
                    { label: "6M", value: "6m" },
                    { label: "1Y", value: "1y" },
                    { label: "All", value: "all" },
                  ].map((r) => {
                    const active = (rangeParam ?? "all") === r.value;
                    const href = `/?symbol=${encodeURIComponent(selectedSymbol)}&range=${r.value}`;
                    return (
                      <Link
                        key={r.value}
                        href={href}
                        className={
                          active
                            ? "rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-black"
                            : "rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-xs text-black/80 hover:bg-black/5 dark:border-white/15 dark:bg-black/20 dark:text-white/80 dark:hover:bg-white/10"
                        }
                      >
                        {r.label}
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href={`/stocks/${encodeURIComponent(selectedSymbol)}`}
                  className="text-xs text-black/60 hover:underline dark:text-white/60"
                >
                  Full analysis
                </Link>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                {candles.length ? (
                  <CandlestickChart candles={candles.slice(-80)} height={240} />
                ) : (
                  <div className="rounded-xl border border-black/5 bg-white/60 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-black/20 dark:text-white/60">
                    Candlestick data not available right now.
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-black/20">
                  <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Open</div>
                  <div className="mt-1 text-sm font-medium tabular-nums">{formatNumber(selected?.open)}</div>
                </div>
                <div className="rounded-xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-black/20">
                  <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">High / Low</div>
                  <div className="mt-1 text-sm font-medium tabular-nums">
                    {formatNumber(selected?.high)} / {formatNumber(selected?.low)}
                  </div>
                </div>
                <div className="rounded-xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-black/20">
                  <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Prev Close</div>
                  <div className="mt-1 text-sm font-medium tabular-nums">{formatNumber(selected?.previousClose)}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4 lg:col-span-3">
          <OrderEntryPanel stocks={orderStocks} defaultSymbol={selectedSymbol} />
          <section className="rounded-2xl border border-black/5 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-black/30">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Market News</div>
              <Link href="/stocks" className="text-xs text-black/60 hover:underline dark:text-white/60">
                View market
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {(newsRes.data ?? []).slice(0, 6).map((n, i) => {
                const title =
                  typeof n?.title === "string"
                    ? n.title
                    : typeof n?.headline === "string"
                      ? n.headline
                      : typeof n?.noticeTitle === "string"
                        ? n.noticeTitle
                        : `Update ${i + 1}`;
                return (
                  <div key={i} className="rounded-xl border border-black/5 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-black/20">
                    {title}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function pickSelectedStock(stocks: NepseStock[], requestedSymbol?: string) {
  if (!stocks.length) return undefined;
  if (!requestedSymbol) return stocks[0];
  return stocks.find((s) => s.symbol === requestedSymbol) ?? stocks[0];
}
