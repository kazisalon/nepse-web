"use client";

import type { NepseStock } from "@/lib/types";
import { calculatePortfolioSummary, clsx, formatNpr, formatNumber, pct } from "@/lib/utils";
import { useTrading } from "./TradingProvider";

export function PortfolioSummary({ stocks }: { stocks: NepseStock[] }) {
  const { portfolio, reset } = useTrading();
  const summary = calculatePortfolioSummary(portfolio, stocks);
  const isUp = summary.pnl >= 0;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Cash</div>
          <div className="mt-2 text-xl font-semibold tabular-nums">{formatNpr(summary.cash)}</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Holdings Value</div>
          <div className="mt-2 text-xl font-semibold tabular-nums">{formatNpr(summary.holdingsValue)}</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Total Value</div>
          <div className="mt-2 text-xl font-semibold tabular-nums">{formatNpr(summary.totalValue)}</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Unrealized P/L</div>
          <div className={clsx("mt-2 text-xl font-semibold tabular-nums", isUp ? "text-emerald-600" : "text-rose-600")}>
            {isUp ? "+" : ""}
            {formatNpr(summary.pnl)} ({pct(summary.pnlPercent)})
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-black/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-semibold">Holdings</h2>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            Reset Demo
          </button>
        </div>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {Object.values(portfolio.holdings).length === 0 ? (
            <div className="px-4 py-8 text-sm text-black/60 dark:text-white/60">No holdings yet. Try the trade simulator.</div>
          ) : (
            Object.values(portfolio.holdings).map((h) => {
              const ltp = stocks.find((s) => s.symbol === h.symbol)?.ltp ?? h.avgPrice;
              const mv = h.quantity * ltp;
              const cost = h.quantity * h.avgPrice;
              const pnl = mv - cost;
              const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
              const rowUp = pnl >= 0;

              return (
                <div key={h.symbol} className="grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-6">
                  <div className="font-medium">{h.symbol}</div>
                  <div className="tabular-nums text-black/70 dark:text-white/70">Qty: {formatNumber(h.quantity)}</div>
                  <div className="tabular-nums text-black/70 dark:text-white/70">Avg: {formatNumber(h.avgPrice)}</div>
                  <div className="tabular-nums text-black/70 dark:text-white/70">LTP: {formatNumber(ltp)}</div>
                  <div className="tabular-nums text-black/70 dark:text-white/70">Value: {formatNumber(mv)}</div>
                  <div className={clsx("tabular-nums", rowUp ? "text-emerald-600" : "text-rose-600")}>
                    {rowUp ? "+" : ""}
                    {formatNumber(pnl)} ({pct(pnlPct)})
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
