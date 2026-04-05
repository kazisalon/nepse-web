import type { Metadata } from "next";
import { TradePanel } from "@/components/TradePanel";
import { fetchNepseStocks } from "@/lib/api";

export const metadata: Metadata = {
  title: "Simulator (Virtual Buy/Sell)",
  description: "Simulate buy and sell trades with virtual money using live NEPSE stock price data.",
};

export default async function TradePage() {
  const stocks = await fetchNepseStocks();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Simulator</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          One NEPSELab feature: simulate buy/sell with virtual money. Balance and holdings update locally.
        </p>
      </header>
      <TradePanel stocks={stocks} />
    </div>
  );
}
