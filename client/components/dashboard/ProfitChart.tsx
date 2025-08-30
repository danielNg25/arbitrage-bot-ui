import React, { useMemo } from "react";

export type SeriesPoint = { label: string; value: number };

function formatNumber(n: number) {
  const f = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  return f.format(n);
}

export function ProfitChart({
  title,
  series,
}: {
  title: string;
  series: SeriesPoint[];
}) {
  const { path, min, max, ticks, labels } = useMemo(() => {
    const values = series.map((d) => d.value);
    const minVal = Math.min(0, ...values);
    const maxVal = Math.max(0, ...values);
    const pad = (maxVal - minVal || 1) * 0.1;
    const yMin = minVal - pad;
    const yMax = maxVal + pad;
    const w = 800;
    const h = 320;
    const lPad = 48;
    const rPad = 16;
    const tPad = 24;
    const bPad = 28;

    const xScale = (i: number) => {
      if (series.length <= 1) return lPad;
      return lPad + (i * (w - lPad - rPad)) / (series.length - 1);
    };
    const yScale = (v: number) => {
      if (yMax === yMin) return h - bPad;
      return tPad + (h - tPad - bPad) * (1 - (v - yMin) / (yMax - yMin));
    };

    const d = series
      .map((pt, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(pt.value)}`)
      .join(" ");

    const yTicks = 4;
    const ticksArr = Array.from(
      { length: yTicks + 1 },
      (_, i) => yMin + (i * (yMax - yMin)) / yTicks,
    );
    const xLabels = series.map((s, i) => ({ x: xScale(i), label: s.label }));

    return { path: d, min: yMin, max: yMax, ticks: ticksArr, labels: xLabels };
  }, [series]);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="relative w-full overflow-x-auto">
        <svg viewBox="0 0 800 320" className="h-64 w-full min-w-[600px]">
          <defs>
            <linearGradient id="profGrad" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="hsl(var(--primary))"
                stopOpacity="0.28"
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--primary))"
                stopOpacity="0.02"
              />
            </linearGradient>
          </defs>
          <g>
            {ticks.map((t, i) => {
              const y = 24 + (i * (320 - 24 - 28)) / (ticks.length - 1);
              return (
                <g key={i}>
                  <line
                    x1={48}
                    x2={800 - 16}
                    y1={y}
                    y2={y}
                    stroke="hsl(var(--border))"
                  />
                  <text
                    x={8}
                    y={y + 4}
                    fontSize="10"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {formatNumber(min + ((max - min) * i) / (ticks.length - 1))}
                  </text>
                </g>
              );
            })}
          </g>
          <path
            d={path}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />
          <path
            d={`${path} L 784,292 L 48,292 Z`}
            fill="url(#profGrad)"
            opacity={0.8}
          />
          {labels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={310}
              fontSize="10"
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
            >
              {l.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default ProfitChart;
