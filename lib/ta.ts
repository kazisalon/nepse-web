export function sma(values: number[], period: number) {
  if (period <= 0) return [];
  const out: Array<number | null> = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number) {
  if (period <= 0) return [];
  const out: Array<number | null> = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    if (prev === null) {
      prev = v;
      out[i] = v;
      continue;
    }
    const emaNext: number = v * k + (prev as number) * (1 - k);
    prev = emaNext;
    out[i] = emaNext;
  }
  return out;
}

export function rsi(closes: number[], period = 14) {
  const out: Array<number | null> = new Array(closes.length).fill(null);
  if (period <= 0 || closes.length < period + 1) return out;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum += -diff;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return out;
}

export type PivotLevels = {
  support: number[];
  resistance: number[];
};

export function pivotLevels(highs: number[], lows: number[], lookback = 5, maxLevels = 3): PivotLevels {
  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  for (let i = lookback; i < highs.length - lookback; i++) {
    const h = highs[i];
    const l = lows[i];
    let isHigh = true;
    let isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (highs[i - j] > h || highs[i + j] > h) isHigh = false;
      if (lows[i - j] < l || lows[i + j] < l) isLow = false;
      if (!isHigh && !isLow) break;
    }
    if (isHigh) pivotHighs.push(h);
    if (isLow) pivotLows.push(l);
  }

  const uniq = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const out: number[] = [];
    for (const v of sorted) {
      if (!out.length) out.push(v);
      else if (Math.abs(out[out.length - 1] - v) / (out[out.length - 1] || 1) > 0.002) out.push(v);
    }
    return out;
  };

  const support = uniq(pivotLows).slice(-maxLevels);
  const resistance = uniq(pivotHighs).slice(0, maxLevels);
  return { support, resistance };
}
