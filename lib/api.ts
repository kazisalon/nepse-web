import { mockStocks } from "./mockData";
import type { NepseApiResponse, NepseStock } from "./types";
import { normalizeSymbol } from "./utils";

export type NepseFetchMeta = {
  source: "live" | "mock";
  cached?: boolean;
  fetchedAt?: string;
  ttlSeconds?: number;
  message?: string;
};

async function fetchJsonWithTimeout<T>(input: string, init: RequestInit & { timeoutMs?: number; next?: { revalidate?: number } }) {
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? 8000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`NEPSE API failed (${res.status})`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchNepseMethod<TData = unknown>(options: {
  method: string;
  symbol?: string;
  limit?: number;
  query?: Record<string, string | number | boolean | undefined>;
  next?: { revalidate?: number };
}): Promise<{ items?: NepseStock[]; data?: TData; cached?: boolean }> {
  const params = new URLSearchParams();
  params.set("method", options.method);
  if (options.symbol) params.set("symbol", normalizeSymbol(options.symbol));
  if (options.limit) params.set("limit", String(options.limit));
  for (const [k, v] of Object.entries(options.query ?? {})) {
    if (v === undefined) continue;
    params.set(k, String(v));
  }

  const path = `/api/nepse?${params.toString()}`;
  const json = await fetchJsonWithTimeout<NepseApiResponse>(path, {
    next: { revalidate: options.next?.revalidate ?? 60 },
    timeoutMs: 8000,
  });
  if (!json.ok) throw new Error(json.error?.message ?? "NEPSE API error");
  return { items: json.items, data: json.data as TData | undefined, cached: json.cached };
}

export async function fetchNepseStocksResult(options?: { symbol?: string; limit?: number; allowMockFallback?: boolean }): Promise<{
  items: NepseStock[];
  meta: NepseFetchMeta;
}> {
  const params = new URLSearchParams();
  if (options?.symbol) params.set("symbol", normalizeSymbol(options.symbol));
  if (options?.limit) params.set("limit", String(options.limit));

  try {
    const path = params.size ? `/api/nepse?${params.toString()}` : "/api/nepse";
    const json = await fetchJsonWithTimeout<NepseApiResponse>(path, { next: { revalidate: 60 }, timeoutMs: 8000 });
    if (!json.ok || !json.items) throw new Error(json.error?.message ?? "NEPSE API error");
    return {
      items: json.items,
      meta: { source: "live", cached: json.cached, fetchedAt: json.fetchedAt, ttlSeconds: json.ttlSeconds },
    };
  } catch (err) {
    if (options?.allowMockFallback === false) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Live API unavailable";
    const items = options?.symbol
      ? mockStocks.filter((s) => normalizeSymbol(s.symbol) === normalizeSymbol(options.symbol!))
      : mockStocks.slice(0, options?.limit ?? mockStocks.length);
    return { items, meta: { source: "mock", message } };
  }
}

export async function fetchNepseStocks(options?: { symbol?: string; limit?: number }): Promise<NepseStock[]> {
  const res = await fetchNepseStocksResult({ ...options, allowMockFallback: true });
  return res.items;
}
