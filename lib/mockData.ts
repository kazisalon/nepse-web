import type { NepseStock, Portfolio } from "./types";

export const mockStocks: NepseStock[] = [
  { symbol: "NABIL", securityName: "Nabil Bank Ltd.", ltp: 520, change: 6, percentChange: 1.17, volume: 120340 },
  { symbol: "NICA", securityName: "NIC Asia Bank Ltd.", ltp: 680, change: -8, percentChange: -1.16, volume: 98320 },
  { symbol: "NRIC", securityName: "Nepal Reinsurance Co. Ltd.", ltp: 910, change: 12, percentChange: 1.34, volume: 45210 },
  { symbol: "HDL", securityName: "Himalayan Distillery Ltd.", ltp: 2150, change: -25, percentChange: -1.15, volume: 10210 },
  { symbol: "NTC", securityName: "Nepal Telecom", ltp: 835, change: 4, percentChange: 0.48, volume: 30220 },
];

export const mockPortfolio: Portfolio = {
  cash: 100_000,
  holdings: {
    NABIL: { symbol: "NABIL", quantity: 10, avgPrice: 500 },
    NTC: { symbol: "NTC", quantity: 5, avgPrice: 820 },
  },
  trades: [
    { id: "t1", symbol: "NABIL", side: "BUY", quantity: 10, price: 500, createdAt: new Date(0).toISOString() },
    { id: "t2", symbol: "NTC", side: "BUY", quantity: 5, price: 820, createdAt: new Date(0).toISOString() },
  ],
};
