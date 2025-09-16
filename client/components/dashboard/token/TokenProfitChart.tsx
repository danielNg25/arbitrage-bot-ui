import React, { useMemo } from "react";
import { useNetworkVisibility } from "@/context/NetworkVisibilityContext";

export type TokenDatum = { label: string; value: number };

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function TokenProfitChart({
  title,
  data,
}: {
  title: string;
  data: TokenDatum[];
}) {
  const { showNetworkInfo } = useNetworkVisibility();
  const { bars, max, labels } = useMemo(() => {
    const maxVal = Math.max(1, ...data.map((d) => d.value));
    const w = Math.max(600, data.length * 56);
    const h = 480; // Increased from 320 to 480
    const lPad = 56;
    const rPad = 16;
    const tPad = 24;
    const bPad = 48;
    const innerW = w - lPad - rPad;
    const innerH = h - tPad - bPad;

    const barWidth = Math.max(20, innerW / data.length - 8);

    const scaleY = (v: number) => innerH * (v / maxVal);

    const bars = data.map((d, i) => {
      const x = lPad + i * (innerW / data.length);
      const bh = scaleY(d.value);
      const y = tPad + (innerH - bh);
      return {
        x,
        y,
        width: Math.max(16, barWidth),
        height: bh,
        label: d.label,
        value: d.value,
      };
    });

    const labels = data.map((d, i) => ({
      x: lPad + i * (innerW / data.length) + barWidth / 2,
      label: d.label,
    }));

    return { bars, max: maxVal, labels, w, h, lPad, rPad, tPad, bPad } as any;
  }, [data]);

  return (
    <div className="rounded-md border-2 border-border/60 bg-card p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">
          Top 10 tokens by profit
        </span>
      </div>
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(600, data.length * 56)} 480`}
          className="h-80 w-full"
        >
          {/* grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = 24 + (1 - t) * (480 - 24 - 48);
            return (
              <line
                key={i}
                x1={56}
                x2={Math.max(600, data.length * 56) - 16}
                y1={y}
                y2={y}
                stroke="hsl(var(--border))"
              />
            );
          })}
          {bars.map((b, i) => (
            <g key={i}>
              <rect
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                rx={2}
                className="fill-primary/60 hover:fill-primary"
              />
              <title>
                {showNetworkInfo
                  ? `${b.label}: ${currency.format(b.value)}`
                  : `Token: ${currency.format(b.value)}`}
              </title>
            </g>
          ))}
          {/* y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <text
              key={i}
              x={8}
              y={24 + (1 - t) * (480 - 24 - 48) + 4}
              fontSize="20"
              fontWeight="500"
              fill="hsl(var(--muted-foreground))"
            >
              {currency.format(max * t)}
            </text>
          ))}
          {/* x labels */}
          {labels.map((l: any, i: number) => (
            <text
              key={i}
              x={l.x}
              y={468}
              fontSize="20"
              fontWeight="500"
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
            >
              {showNetworkInfo ? l.label : "****"}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
