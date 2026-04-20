"use client";

import { useMemo } from "react";

export function Sparkline({
  values,
  width = 120,
  height = 40,
  stroke = "currentColor",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  const d = useMemo(() => {
    if (!values.length) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = values.length === 1 ? 0 : width / (values.length - 1);

    return values
      .map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / span) * height;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [values, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

