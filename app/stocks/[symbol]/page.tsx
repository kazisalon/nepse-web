import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CandlestickChart, type Candle } from "@/components/CandlestickChart";
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

export default async function StockDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { symbol } = await params;
  const sym = normalizeSymbol(symbol);
  const rangeParam = typeof searchParams?.range === "string" ? searchParams.range : undefined;
  const startDate = computeStartDate(rangeParam);

  const [items, tickerInfoRes] = await Promise.all([
    fetchNepseStocks({ symbol: sym }),
    fetchNepseMethod<Record<string, unknown>>({ method: "get_ticker_info", symbol: sym }).catch(() => ({ data: undefined })),
  ]);

  const stock = items[0];
  if (!stock) notFound();

  const historyRes =
    (await fetchNepseMethod<Array<Record<string, unknown>>>({
      method: "get_ticker_price_history",
      symbol: sym,
      query: startDate ? { start_date: startDate, end_date: isoDate(new Date()) } : undefined,
    }).catch(() => ({ data: undefined }))) ?? { data: undefined };

  const info = tickerInfoRes.data;
  const security = (info && typeof info === "object" ? (info as Record<string, unknown>).security : undefined) as
    | Record<string, unknown>
    | undefined;
  const daily = (info && typeof info === "object" ? (info as Record<string, unknown>).securityDailyTradeDto : undefined) as
    | Record<string, unknown>
    | undefined;

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

      <section className="rounded-2xl border border-black/5 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold">Price action</h2>
            <p className="mt-1 text-sm text-black/70 dark:text-white/70">Candlesticks from NEPSE price history (cached for performance).</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              { label: "1M", value: "1m" },
              { label: "3M", value: "3m" },
              { label: "6M", value: "6m" },
              { label: "1Y", value: "1y" },
              { label: "All", value: "all" },
            ].map((r) => {
              const active = (rangeParam ?? "all") === r.value;
              return (
                <Link
                  key={r.value}
                  href={`/stocks/${encodeURIComponent(sym)}?range=${r.value}`}
                  className={
                    active
                      ? "rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
                      : "rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-sm text-black/80 hover:bg-black/5 dark:border-white/15 dark:bg-black/20 dark:text-white/80 dark:hover:bg-white/10"
                  }
                >
                  {r.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          {candles.length ? (
            <CandlestickChart candles={candles.slice(-80)} />
          ) : (
            <div className="rounded-2xl border border-black/5 bg-white/60 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-black/20 dark:text-white/60">
              No price history available right now.
            </div>
          )}
        </div>
      </section>

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
          This is a server-rendered stock analysis page designed for SEO keywords like “NEPSE stock price” and “share price Nepal”. Use
          the chart and daily stats to do quick analysis. The Simulator and Portfolio are optional learning tools.
        </p>
      </section>
    </div>
  );
}
