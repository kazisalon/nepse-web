"use client";

import { useMemo, useState } from "react";
import { ema, pivotLevels } from "@/lib/ta";
import { clsx, formatNumber } from "@/lib/utils";

export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function CandlestickChart({
  candles,
  height = 320,
  showVolume = true,
  emaPeriods = [20, 50],
  showCrosshair = true,
  showPivots = true,
}: {
  candles: Candle[];
  height?: number;
  showVolume?: boolean;
  emaPeriods?: number[];
  showCrosshair?: boolean;
  showPivots?: boolean;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const model = useMemo(() => {
    const w = 1000;
    const h = height;
    const padX = 24;
    const padTop = 16;
    const padBottom = 26;
    const plotW = w - padX * 2;
    const volumeH = showVolume ? Math.max(64, Math.floor(h * 0.25)) : 0;
    const gap = showVolume ? 10 : 0;
    const priceH = h - padTop - padBottom - volumeH - gap;

    const safe = candles.filter(
      (c) =>
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close) &&
        c.high >= c.low
    );

    if (!safe.length) {
      return {
        w,
        h,
        viewBox: `0 0 ${w} ${h}`,
        items: [] as Array<{
          key: string;
          x: number;
          bodyW: number;
          wickY1: number;
          wickY2: number;
          bodyY: number;
          bodyH: number;
          up: boolean;
          label: string;
          candle: Candle;
        }>,
        yTicks: [] as Array<{ y: number; label: string }>,
        priceArea: { x1: 0, x2: 0, y1: 0, y2: 0 },
        volumeArea: { x1: 0, x2: 0, y1: 0, y2: 0 },
        emaLines: [] as Array<{ period: number; d: string }>,
        pivotLines: [] as Array<{ kind: "support" | "resistance"; price: number; y: number }>,
        volumeBars: [] as Array<{ key: string; x: number; w: number; y: number; h: number; up: boolean; v: number }>,
      };
    }

    const highs = safe.map((c) => c.high);
    const lows = safe.map((c) => c.low);
    const maxY = Math.max(...highs);
    const minY = Math.min(...lows);
    const span = maxY - minY || 1;

    const toY = (price: number) => {
      const t = (price - minY) / span;
      return padTop + (1 - t) * priceH;
    };

    const step = plotW / safe.length;
    const bodyW = clamp(step * 0.62, 4, 14);

    const items = safe.map((c, i) => {
      const x = padX + i * step + step / 2;
      const yHigh = toY(c.high);
      const yLow = toY(c.low);
      const yOpen = toY(c.open);
      const yClose = toY(c.close);
      const up = c.close >= c.open;
      const y1 = Math.min(yOpen, yClose);
      const y2 = Math.max(yOpen, yClose);
      const bodyH = Math.max(2, y2 - y1);
      const label = `${c.time} O:${formatNumber(c.open)} H:${formatNumber(c.high)} L:${formatNumber(c.low)} C:${formatNumber(c.close)}`;
      return {
        key: `${c.time}-${i}`,
        x,
          bodyW,
        wickY1: yHigh,
        wickY2: yLow,
        bodyY: y1,
        bodyH,
        up,
        label,
        candle: c,
      };
    });

    const tickCount = 5;
    const yTicks = Array.from({ length: tickCount }, (_, i) => {
      const t = i / (tickCount - 1);
      const price = maxY - t * span;
      return { y: toY(price), label: formatNumber(price) };
    });

    const closes = safe.map((c) => c.close);
    const emaLines = emaPeriods
      .filter((p) => Number.isFinite(p) && p > 1)
      .map((period) => {
        const series = ema(closes, period);
        const d = series
          .map((v, i) => {
            if (v === null) return null;
            const x = padX + i * step + step / 2;
            const y = toY(v);
            return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .filter(Boolean)
          .join(" ");
        return { period, d };
      })
      .filter((x) => x.d.length > 0);

    const priceArea = { x1: padX, x2: w - padX, y1: padTop, y2: padTop + priceH };
    const volumeArea = { x1: padX, x2: w - padX, y1: padTop + priceH + gap, y2: padTop + priceH + gap + volumeH };

    const volumeValues = safe.map((c) => (typeof c.volume === "number" && Number.isFinite(c.volume) ? c.volume : 0));
    const maxV = Math.max(...volumeValues, 1);
    const volumeBars = showVolume
      ? safe.map((c, i) => {
          const v = typeof c.volume === "number" && Number.isFinite(c.volume) ? c.volume : 0;
          const up = c.close >= c.open;
          const x = padX + i * step + step / 2;
          const bw = clamp(step * 0.62, 2, 14);
          const barH = (v / maxV) * volumeH;
          const y = volumeArea.y2 - barH;
          return { key: `${c.time}-v-${i}`, x, w: bw, y, h: barH, up, v };
        })
      : [];

    const pivots = showPivots ? pivotLevels(highs, lows, 5, 3) : { support: [], resistance: [] };
    const pivotLines = [
      ...pivots.resistance.map((p) => ({ kind: "resistance" as const, price: p, y: toY(p) })),
      ...pivots.support.map((p) => ({ kind: "support" as const, price: p, y: toY(p) })),
    ].filter((x) => Number.isFinite(x.y));

    return { w, h, viewBox: `0 0 ${w} ${h}`, items, yTicks, priceArea, volumeArea, emaLines, pivotLines, volumeBars };
  }, [candles, height, showVolume, emaPeriods, showPivots]);

  const active = hoverIndex !== null ? model.items[hoverIndex] : null;

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!model.items.length) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * model.w;
    const idx = clamp(
      Math.round(((x - model.priceArea.x1) / (model.priceArea.x2 - model.priceArea.x1)) * (model.items.length - 1)),
      0,
      model.items.length - 1
    );
    setHoverIndex(idx);
  }

  function onLeave() {
    setHoverIndex(null);
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-black/30">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Candlestick</div>
        <div className="flex items-center gap-3 text-xs text-black/60 dark:text-white/60">
          <span>{candles.length ? `${candles.length} bars` : "—"}</span>
          <span className="hidden sm:inline">
            {emaPeriods.length ? `EMA ${emaPeriods.join(", ")}` : ""}
            {showVolume ? `${emaPeriods.length ? " · " : ""}Volume` : ""}
            {showPivots ? " · S/R" : ""}
          </span>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-black/5 bg-white/60 dark:border-white/10 dark:bg-black/20">
        <svg
          viewBox={model.viewBox}
          className="w-full"
          style={{ height }}
          role="img"
          aria-label="Candlestick chart"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          <rect x="0" y="0" width={model.w} height={model.h} fill="transparent" />

          {model.yTicks.map((t) => (
            <g key={t.label}>
              <line x1="24" x2="976" y1={t.y} y2={t.y} className="stroke-black/5 dark:stroke-white/10" strokeWidth="1" />
              <text x="988" y={t.y + 4} textAnchor="end" className="fill-black/50 dark:fill-white/50" fontSize="10">
                {t.label}
              </text>
            </g>
          ))}

          {model.pivotLines.map((l) => (
            <g key={`${l.kind}-${l.price}`}>
              <line
                x1={model.priceArea.x1}
                x2={model.priceArea.x2}
                y1={l.y}
                y2={l.y}
                className={clsx(l.kind === "resistance" ? "stroke-rose-500/25" : "stroke-emerald-500/25")}
                strokeWidth="2"
              />
              <text
                x={model.priceArea.x2}
                y={l.y - 4}
                textAnchor="end"
                className={clsx(l.kind === "resistance" ? "fill-rose-500/70" : "fill-emerald-500/70")}
                fontSize="10"
              >
                {formatNumber(l.price)}
              </text>
            </g>
          ))}

          {model.emaLines.map((l) => (
            <path
              key={`ema-${l.period}`}
              d={l.d}
              fill="none"
              className={clsx(l.period === 20 ? "stroke-cyan-400" : l.period === 50 ? "stroke-amber-400" : "stroke-indigo-400")}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.9"
            />
          ))}

          {model.items.map((it) => (
            <g key={it.key}>
              <title>{it.label}</title>
              <line
                x1={it.x}
                x2={it.x}
                y1={it.wickY1}
                y2={it.wickY2}
                className={clsx(it.up ? "stroke-emerald-500" : "stroke-rose-500")}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x={it.x - it.bodyW / 2}
                width={it.bodyW}
                y={it.bodyY}
                height={it.bodyH}
                className={clsx(it.up ? "fill-emerald-500" : "fill-rose-500")}
                rx="2"
              />
            </g>
          ))}

          {showVolume
            ? model.volumeBars.map((b) => (
                <rect
                  key={b.key}
                  x={b.x - b.w / 2}
                  width={b.w}
                  y={b.y}
                  height={b.h}
                  className={clsx(b.up ? "fill-emerald-500/50" : "fill-rose-500/50")}
                />
              ))
            : null}

          {showCrosshair && active ? (
            <g>
              <line
                x1={active.x}
                x2={active.x}
                y1={model.priceArea.y1}
                y2={showVolume ? model.volumeArea.y2 : model.priceArea.y2}
                className="stroke-black/20 dark:stroke-white/20"
                strokeWidth="1"
              />
              <rect x="24" y="16" width="520" height="48" rx="10" className="fill-white/80 stroke-black/10 dark:fill-black/50 dark:stroke-white/10" />
              <text x="38" y="38" className="fill-black/80 dark:fill-white/80" fontSize="12">
                {active.candle.time} O {formatNumber(active.candle.open)} H {formatNumber(active.candle.high)} L {formatNumber(active.candle.low)} C{" "}
                {formatNumber(active.candle.close)}
              </text>
              <text x="38" y="56" className="fill-black/60 dark:fill-white/60" fontSize="11">
                Vol {formatNumber(typeof active.candle.volume === "number" ? active.candle.volume : undefined)}
              </text>
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
