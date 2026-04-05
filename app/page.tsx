import Link from "next/link";
import { StockTable } from "@/components/StockTable";
import { fetchNepseMethod, fetchNepseStocksResult } from "@/lib/api";
import { clsx, formatNumber, pct } from "@/lib/utils";

export default function Home() {
  const stocksPromise = fetchNepseStocksResult({ limit: 12, allowMockFallback: true });

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/5 bg-white p-8 dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">NEPSELab: live NEPSE market data, movers, indices</h1>
            <p className="max-w-2xl text-sm text-black/70 dark:text-white/70">
              Track NEPSE stock price moves, explore company details, and use the simulator for learning. Built for “NEPSE stock price” and “share price Nepal” searches.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/stocks"
              className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              Live Market
            </Link>
            <Link
              href="/trade"
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Simulator
            </Link>
            <Link href="/portfolio" className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">
              Portfolio
            </Link>
          </div>
        </div>
      </section>

      <HomeSnapshot stocksPromise={stocksPromise} />
    </div>
  );
}

async function HomeSnapshot({ stocksPromise }: { stocksPromise: Promise<Awaited<ReturnType<typeof fetchNepseStocksResult>>> }) {
  const [stocks, marketOpenRes, topGainersRes, topLosersRes] = await Promise.all([
    stocksPromise,
    fetchNepseMethod<boolean>({ method: "is_market_open" }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_stocks", query: { category: "top_gainer" } }).catch(() => ({ data: undefined })),
    fetchNepseMethod<Array<Record<string, unknown>>>({ method: "get_top_stocks", query: { category: "top_loser" } }).catch(() => ({ data: undefined })),
  ]);

  const stocksMeta = stocks.meta;
  const stocksItems = stocks.items;
  const marketOpen = marketOpenRes.data;
  const topGainer = (topGainersRes.data ?? [])[0];
  const topLoser = (topLosersRes.data ?? [])[0];

  const gSymbol = typeof topGainer?.symbol === "string" ? topGainer.symbol : undefined;
  const gPct = typeof topGainer?.percentageChange === "number" ? topGainer.percentageChange : undefined;
  const gLtp = typeof topGainer?.ltp === "number" ? topGainer.ltp : undefined;

  const lSymbol = typeof topLoser?.symbol === "string" ? topLoser.symbol : undefined;
  const lPct = typeof topLoser?.percentageChange === "number" ? topLoser.percentageChange : undefined;
  const lLtp = typeof topLoser?.ltp === "number" ? topLoser.ltp : undefined;

  return (
    <section className="space-y-6">
      {stocksMeta.source === "mock" ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-900 dark:text-amber-200">
          You’re viewing demo data (live API not reachable). Use <span className="font-medium">vercel dev</span> locally or deploy to Vercel for live NEPSE data.
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Snapshot</div>
          <div className="mt-2 text-lg font-semibold">Latest NEPSE price list</div>
          <div className="mt-1 text-sm text-black/70 dark:text-white/70">Showing {stocksItems.length} symbols</div>
        </div>
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
          <div className="mt-1 text-sm text-black/70 dark:text-white/70">Data is cached for performance</div>
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
      </div>

      {stocksItems.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-6 text-sm text-black/60 dark:border-white/10 dark:bg-black/30 dark:text-white/60">
          No stocks available right now.
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">NEPSE stocks (preview)</h2>
            <Link href="/stocks" className="text-sm font-medium hover:underline">
              Market dashboard
            </Link>
          </div>
          <StockTable stocks={stocksItems} />
        </div>
      )}
    </section>
  );
}
