"use client";

import { useMemo, useState } from "react";
import type { NepseStock } from "@/lib/types";
import { clsx, formatNpr, formatNumber } from "@/lib/utils";
import { useTrading } from "./TradingProvider";

type Side = "BUY" | "SELL";

export function OrderEntryPanel({
  stocks,
  defaultSymbol,
}: {
  stocks: Array<Pick<NepseStock, "symbol" | "securityName" | "ltp">>;
  defaultSymbol?: string;
}) {
  const { portfolio, buy, sell, lastError, clearError } = useTrading();
  const [side, setSide] = useState<Side>("BUY");
  const [symbol, setSymbol] = useState(defaultSymbol ?? stocks[0]?.symbol ?? "");
  const [quantity, setQuantity] = useState(10);

  const selected = useMemo(() => {
    const sym = symbol.trim().toUpperCase();
    return stocks.find((s) => s.symbol === sym);
  }, [stocks, symbol]);

  const ltp = selected?.ltp ?? 0;
  const cost = ltp * (Number.isFinite(quantity) ? quantity : 0);
  const holdingQty = portfolio.holdings[symbol]?.quantity ?? 0;

  const canSubmit = useMemo(() => {
    if (!symbol) return false;
    if (!Number.isFinite(quantity) || quantity <= 0) return false;
    if (!Number.isFinite(ltp) || ltp <= 0) return false;
    if (side === "BUY") return portfolio.cash >= cost;
    return holdingQty >= quantity;
  }, [symbol, quantity, ltp, side, portfolio.cash, cost, holdingQty]);

  function onSubmit() {
    clearError();
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    if (side === "BUY") buy(sym, quantity, ltp);
    else sell(sym, quantity, ltp);
  }

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-black/30" id="order">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Order Entry</div>
        <div className="text-xs text-black/60 dark:text-white/60">Simulator</div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Symbol</div>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm text-black outline-none ring-black/10 focus:ring-4 dark:border-white/15 dark:bg-black/20 dark:text-white dark:ring-white/20"
          >
            {stocks.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol}
                {s.securityName ? ` — ${s.securityName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            className={clsx(
              "rounded-xl px-3 py-2 text-sm font-medium",
              side === "BUY"
                ? "bg-emerald-500 text-white"
                : "border border-black/10 bg-white/60 text-black hover:bg-black/5 dark:border-white/15 dark:bg-black/20 dark:text-white dark:hover:bg-white/10"
            )}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            className={clsx(
              "rounded-xl px-3 py-2 text-sm font-medium",
              side === "SELL"
                ? "bg-rose-500 text-white"
                : "border border-black/10 bg-white/60 text-black hover:bg-black/5 dark:border-white/15 dark:bg-black/20 dark:text-white dark:hover:bg-white/10"
            )}
          >
            Sell
          </button>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Quantity</div>
          <input
            type="number"
            value={quantity}
            min={1}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm text-black outline-none ring-black/10 focus:ring-4 dark:border-white/15 dark:bg-black/20 dark:text-white dark:ring-white/20"
          />
        </div>

        <div className="rounded-xl border border-black/5 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-black/20">
          <div className="flex items-center justify-between text-black/70 dark:text-white/70">
            <span>Market price</span>
            <span className="tabular-nums">{formatNumber(ltp)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-black/70 dark:text-white/70">
            <span>Total estimate</span>
            <span className="tabular-nums">{formatNpr(cost)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-black/70 dark:text-white/70">
            <span>Available</span>
            <span className="tabular-nums">{formatNpr(portfolio.cash)}</span>
          </div>
          {side === "SELL" ? (
            <div className="mt-2 flex items-center justify-between text-black/70 dark:text-white/70">
              <span>Holding</span>
              <span className="tabular-nums">{formatNumber(holdingQty)}</span>
            </div>
          ) : null}
        </div>

        {lastError ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
            {lastError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={clsx(
            "w-full rounded-xl px-4 py-2.5 text-sm font-medium",
            canSubmit
              ? "bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
              : "cursor-not-allowed bg-black/20 text-black/50 dark:bg-white/10 dark:text-white/40"
          )}
        >
          Place order
        </button>
      </div>
    </section>
  );
}

