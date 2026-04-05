"use client";

import { useMemo, useState } from "react";
import type { NepseStock } from "@/lib/types";
import { clsx, formatNpr, formatNumber, normalizeSymbol } from "@/lib/utils";
import { useTrading } from "./TradingProvider";

export function TradePanel({ stocks }: { stocks: NepseStock[] }) {
  const { portfolio, buy, sell, lastError, clearError } = useTrading();
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState<number | "">("");

  const normalized = useMemo(() => normalizeSymbol(symbol || ""), [symbol]);
  const market = useMemo(() => stocks.find((s) => normalizeSymbol(s.symbol) === normalized), [stocks, normalized]);
  const holding = normalized ? portfolio.holdings[normalized] : undefined;

  const canSubmit =
    normalized.length > 0 && Number.isFinite(quantity) && quantity > 0 && price !== "" && Number(price) > 0 && !lastError;

  function submit() {
    clearError();
    const p = Number(price);
    if (side === "BUY") buy(normalized, quantity, p);
    else sell(normalized, quantity, p);
  }

  const est = price === "" ? 0 : quantity * Number(price);

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-black/30 lg:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">Trade Simulator</h1>
          <div className="flex items-center rounded-full bg-black/5 p-1 text-sm dark:bg-white/10">
            <button
              type="button"
              onClick={() => {
                clearError();
                setSide("BUY");
              }}
              className={clsx(
                "rounded-full px-4 py-1.5",
                side === "BUY" ? "bg-white text-black dark:bg-black dark:text-white" : "text-black/70 dark:text-white/70"
              )}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => {
                clearError();
                setSide("SELL");
              }}
              className={clsx(
                "rounded-full px-4 py-1.5",
                side === "SELL" ? "bg-white text-black dark:bg-black dark:text-white" : "text-black/70 dark:text-white/70"
              )}
            >
              Sell
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Symbol</div>
            <input
              value={symbol}
              onChange={(e) => {
                const next = e.target.value;
                setSymbol(next);
                if (price !== "") return;
                const sym = normalizeSymbol(next);
                const ltp = stocks.find((s) => normalizeSymbol(s.symbol) === sym)?.ltp;
                if (ltp) setPrice(ltp);
              }}
              placeholder="e.g. NABIL"
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
            />
          </label>
          <label className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Quantity</div>
            <input
              type="number"
              value={quantity}
              min={1}
              step={1}
              onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value))))}
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
            />
          </label>
          <label className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Price</div>
            <input
              type="number"
              value={price}
              min={1}
              step={0.01}
              onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-black/70 dark:text-white/70">
            Estimated {side === "BUY" ? "cost" : "proceeds"}: <span className="font-medium tabular-nums">{formatNpr(est)}</span>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={clsx(
              "rounded-xl px-5 py-2.5 text-sm font-medium text-white",
              !canSubmit ? "bg-black/30 dark:bg-white/20" : side === "BUY" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
            )}
          >
            {side === "BUY" ? "Place Buy" : "Place Sell"}
          </button>
        </div>

        {lastError ? (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {lastError}
          </div>
        ) : null}

        {market ? (
          <div className="mt-6 rounded-2xl bg-black/5 p-4 text-sm dark:bg-white/10">
            <div className="font-medium">{market.symbol}</div>
            <div className="mt-1 text-black/70 dark:text-white/70">{market.securityName ?? "NEPSE listed company"}</div>
            <div className="mt-2 tabular-nums text-black/70 dark:text-white/70">
              LTP: <span className="font-medium">{formatNumber(market.ltp)}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-black/30">
        <h2 className="font-semibold">Account</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="text-black/60 dark:text-white/60">Cash</div>
            <div className="font-medium tabular-nums">{formatNpr(portfolio.cash)}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-black/60 dark:text-white/60">Holding ({normalized || "—"})</div>
            <div className="font-medium tabular-nums">{holding ? formatNumber(holding.quantity) : "0"}</div>
          </div>
        </div>

        <h3 className="mt-8 font-semibold">Recent Trades</h3>
        <div className="mt-3 space-y-2">
          {portfolio.trades.length === 0 ? (
            <div className="text-sm text-black/60 dark:text-white/60">No trades yet.</div>
          ) : (
            portfolio.trades.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-black/5 px-3 py-2 text-xs dark:bg-white/10">
                <div className="flex items-center gap-2">
                  <span className={clsx("rounded-full px-2 py-0.5 font-medium", t.side === "BUY" ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-600/15 text-rose-700 dark:text-rose-300")}>
                    {t.side}
                  </span>
                  <span className="font-medium">{t.symbol}</span>
                </div>
                <div className="tabular-nums text-black/70 dark:text-white/70">
                  {t.quantity} @ {formatNumber(t.price)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
