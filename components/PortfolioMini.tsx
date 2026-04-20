"use client";

import type { NepseStock } from "@/lib/types";
import { calculatePortfolioSummary, clsx, formatNpr, pct } from "@/lib/utils";
import { useTrading } from "./TradingProvider";

export function PortfolioMini({ stocks }: { stocks: NepseStock[] }) {
  const { portfolio } = useTrading();
  const summary = calculatePortfolioSummary(portfolio, stocks);
  const isUp = summary.pnl >= 0;

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Portfolio</div>
          <div className="mt-2 text-xl font-semibold tabular-nums">{formatNpr(summary.totalValue)}</div>
          <div className={clsx("mt-1 text-sm tabular-nums", isUp ? "text-emerald-600" : "text-rose-600")}>
            {isUp ? "+" : ""}
            {formatNpr(summary.pnl)} ({pct(summary.pnlPercent)})
          </div>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-black/70 dark:text-white/70">
        <div className="rounded-xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20">
          <div className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Cash</div>
          <div className="mt-1 font-medium tabular-nums">{formatNpr(summary.cash)}</div>
        </div>
        <div className="rounded-xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20">
          <div className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Holdings</div>
          <div className="mt-1 font-medium tabular-nums">{formatNpr(summary.holdingsValue)}</div>
        </div>
      </div>
    </section>
  );
}

