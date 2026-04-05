"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { Portfolio, Trade } from "@/lib/types";
import { mockPortfolio } from "@/lib/mockData";
import { normalizeSymbol, safeJsonParse, uid } from "@/lib/utils";

const STORAGE_KEY = "nepselab_portfolio_v1";

type TradingState = {
  portfolio: Portfolio;
  lastError: string | null;
};

type Action =
  | { type: "INIT"; portfolio: Portfolio }
  | { type: "ERROR"; message: string | null }
  | { type: "BUY"; symbol: string; quantity: number; price: number }
  | { type: "SELL"; symbol: string; quantity: number; price: number }
  | { type: "RESET" };

function reducer(state: TradingState, action: Action): TradingState {
  switch (action.type) {
    case "INIT":
      return { portfolio: action.portfolio, lastError: null };
    case "ERROR":
      return { ...state, lastError: action.message };
    case "RESET":
      return { portfolio: mockPortfolio, lastError: null };
    case "BUY": {
      const symbol = normalizeSymbol(action.symbol);
      const quantity = Math.floor(action.quantity);
      const price = action.price;
      const cost = quantity * price;
      if (!symbol || quantity <= 0 || price <= 0) return { ...state, lastError: "Enter a valid symbol, quantity, and price." };
      if (cost > state.portfolio.cash) return { ...state, lastError: "Insufficient cash balance." };

      const existing = state.portfolio.holdings[symbol];
      const newQty = (existing?.quantity ?? 0) + quantity;
      const prevCost = (existing?.quantity ?? 0) * (existing?.avgPrice ?? 0);
      const newAvg = (prevCost + cost) / newQty;

      const trade: Trade = {
        id: uid(),
        symbol,
        side: "BUY",
        quantity,
        price,
        createdAt: new Date().toISOString(),
      };

      return {
        portfolio: {
          cash: state.portfolio.cash - cost,
          holdings: {
            ...state.portfolio.holdings,
            [symbol]: { symbol, quantity: newQty, avgPrice: newAvg },
          },
          trades: [trade, ...state.portfolio.trades].slice(0, 50),
        },
        lastError: null,
      };
    }
    case "SELL": {
      const symbol = normalizeSymbol(action.symbol);
      const quantity = Math.floor(action.quantity);
      const price = action.price;
      const proceeds = quantity * price;
      if (!symbol || quantity <= 0 || price <= 0) return { ...state, lastError: "Enter a valid symbol, quantity, and price." };

      const existing = state.portfolio.holdings[symbol];
      if (!existing || existing.quantity < quantity) return { ...state, lastError: "Not enough shares to sell." };

      const trade: Trade = {
        id: uid(),
        symbol,
        side: "SELL",
        quantity,
        price,
        createdAt: new Date().toISOString(),
      };

      const remainingQty = existing.quantity - quantity;
      const nextHoldings = { ...state.portfolio.holdings };
      if (remainingQty <= 0) delete nextHoldings[symbol];
      else nextHoldings[symbol] = { ...existing, quantity: remainingQty };

      return {
        portfolio: {
          cash: state.portfolio.cash + proceeds,
          holdings: nextHoldings,
          trades: [trade, ...state.portfolio.trades].slice(0, 50),
        },
        lastError: null,
      };
    }
  }
}

type TradingContextValue = {
  portfolio: Portfolio;
  lastError: string | null;
  buy: (symbol: string, quantity: number, price: number) => void;
  sell: (symbol: string, quantity: number, price: number) => void;
  reset: () => void;
  clearError: () => void;
};

const TradingContext = createContext<TradingContextValue | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { portfolio: mockPortfolio, lastError: null });

  useEffect(() => {
    const stored = safeJsonParse<Portfolio>(localStorage.getItem(STORAGE_KEY));
    if (stored && typeof stored.cash === "number" && stored.holdings && stored.trades) {
      dispatch({ type: "INIT", portfolio: stored });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.portfolio));
    window.dispatchEvent(new CustomEvent("portfolio:changed"));
  }, [state.portfolio]);

  const value = useMemo<TradingContextValue>(() => {
    return {
      portfolio: state.portfolio,
      lastError: state.lastError,
      buy: (symbol, quantity, price) => dispatch({ type: "BUY", symbol, quantity, price }),
      sell: (symbol, quantity, price) => dispatch({ type: "SELL", symbol, quantity, price }),
      reset: () => dispatch({ type: "RESET" }),
      clearError: () => dispatch({ type: "ERROR", message: null }),
    };
  }, [state.portfolio, state.lastError]);

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error("useTrading must be used within TradingProvider");
  return ctx;
}
