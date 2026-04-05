import Link from "next/link";
import type { NepseStock } from "@/lib/types";
import { clsx, formatNumber, pct } from "@/lib/utils";

export function StockTable({ stocks }: { stocks: NepseStock[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-black/30">
      <table className="w-full text-left text-sm">
        <thead className="bg-black/5 text-xs uppercase tracking-wide text-black/70 dark:bg-white/10 dark:text-white/70">
          <tr>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">LTP</th>
            <th className="px-4 py-3">Change</th>
            <th className="px-4 py-3">% Change</th>
            <th className="px-4 py-3">Volume</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/10">
          {stocks.map((s) => {
            const isUp = (s.change ?? 0) >= 0;
            return (
              <tr key={s.symbol} className="hover:bg-black/5 dark:hover:bg-white/5">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/stocks/${encodeURIComponent(s.symbol)}`} className="hover:underline">
                    {s.symbol}
                  </Link>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatNumber(s.ltp)}</td>
                <td className={clsx("px-4 py-3 tabular-nums", isUp ? "text-emerald-600" : "text-rose-600")}>
                  {s.change === undefined ? "—" : `${isUp ? "+" : ""}${formatNumber(s.change)}`}
                </td>
                <td className={clsx("px-4 py-3 tabular-nums", isUp ? "text-emerald-600" : "text-rose-600")}>
                  {pct(s.percentChange)}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatNumber(s.volume)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

