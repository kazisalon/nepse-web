export type NepseStock = {
  symbol: string;
  securityName?: string;
  ltp?: number;
  change?: number;
  percentChange?: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  volume?: number;
  turnover?: number;
};

export type NepseApiResponse = {
  ok: boolean;
  source?: string;
  method?: string;
  cached?: boolean;
  fetchedAt?: string;
  ttlSeconds?: number;
  count?: number;
  items?: NepseStock[];
  data?: unknown;
  error?: {
    message: string;
    type?: string;
  };
};

export type TradeSide = "BUY" | "SELL";

export type Trade = {
  id: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
  createdAt: string;
};

export type Holding = {
  symbol: string;
  quantity: number;
  avgPrice: number;
};

export type Portfolio = {
  cash: number;
  holdings: Record<string, Holding>;
  trades: Trade[];
};

export type PortfolioSummary = {
  cash: number;
  holdingsValue: number;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
};
