import type { NepseStock } from "@/lib/types";
import { formatNumber, pct } from "@/lib/utils";

export function StockCard({ stock }: { stock: NepseStock }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-black/30">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{stock.symbol}</h1>
          {stock.securityName ? <p className="mt-1 text-sm text-black/60 dark:text-white/60">{stock.securityName}</p> : null}
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">{formatNumber(stock.ltp)}</div>
          <div className="mt-1 text-sm tabular-nums text-black/60 dark:text-white/60">{pct(stock.percentChange)}</div>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
          <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Change</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatNumber(stock.change)}</dd>
        </div>
        <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
          <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Volume</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatNumber(stock.volume)}</dd>
        </div>
        <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
          <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">High</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatNumber(stock.high)}</dd>
        </div>
        <div className="rounded-xl bg-black/5 p-4 dark:bg-white/10">
          <dt className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Low</dt>
          <dd className="mt-1 font-medium tabular-nums">{formatNumber(stock.low)}</dd>
        </div>
      </dl>
    </div>
  );
}

