import React from "react";
import { SummaryAggregationResponse } from "@shared/api";
import { useSummaryAggregations } from "@/hooks/use-summary-aggregations";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SeriesPoint = { label: string; value: number };

function formatNumber(n: number) {
  const f = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  return f.format(n);
}

// Convert summary aggregations to chart series
function convertToChartSeries(
  data: SummaryAggregationResponse[],
  period: "hourly" | "daily" | "monthly" = "daily",
): SeriesPoint[] {
  // Sort data by timestamp (oldest first, newest last)
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  return sortedData.map((item) => {
    const date = new Date(item.period_start);
    let label: string;

    if (period === "hourly") {
      // Format as hour:minute (e.g., "14:00", "15:00")
      label = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (period === "daily") {
      // Format as month day (e.g., "Jan 01", "Jan 02")
      label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      });
    } else {
      // Format as month year (e.g., "Jan 2024", "Feb 2024")
      label = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }

    return {
      label,
      value: item.total_profit_usd,
    };
  });
}

export function ProfitChart({
  title,
  series: propSeries,
  period: initialPeriod = "hourly",
  limit: initialLimit = 24,
}: {
  title: string;
  series?: SeriesPoint[];
  period?: "hourly" | "daily" | "monthly";
  limit?: number;
}) {
  // Local state for period and limit selection
  const [period, setPeriod] = React.useState<"hourly" | "daily" | "monthly">(
    initialPeriod,
  );
  const [limit, setLimit] = React.useState(initialLimit);

  // Use the hook to fetch summary aggregations data
  const {
    data: summaryData,
    loading,
    error,
  } = useSummaryAggregations({
    period,
    limit,
  });

  // Use provided series or convert from summary data
  const series = propSeries || convertToChartSeries(summaryData, period);

  // Update limit when period changes
  React.useEffect(() => {
    if (period === "hourly") {
      setLimit(24);
    } else if (period === "daily") {
      setLimit(30);
    } else if (period === "monthly") {
      setLimit(12);
    }
  }, [period]);

  // Debug logging for chart data ordering
  React.useEffect(() => {
    if (summaryData && summaryData.length > 0) {
      console.log("Chart data ordering:", {
        original: summaryData.map((d) => ({
          timestamp: d.timestamp,
          period_start: d.period_start,
          profit: d.total_profit_usd,
        })),
        converted: series.map((s) => ({ label: s.label, value: s.value })),
      });
    }
  }, [summaryData, series]);

  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const { path, min, max, ticks, labels, points, dims } = React.useMemo(() => {
    const values = series.map((d) => d.value);
    let maxVal = Math.max(0, ...values);
    if (!(maxVal > 0)) maxVal = 1;
    const yMin = 0;
    const pad = maxVal * 0.1;
    const yMax = maxVal + pad;
    const w = 1000;
    const h = 380;
    const lPad = 56;
    const rPad = 24;
    const tPad = 24;
    const bPad = 36;

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

    const points = series.map((pt, i) => ({
      x: xScale(i),
      y: yScale(pt.value),
      label: pt.label,
      value: pt.value,
    }));

    const yTicks = 5;
    const ticksArr = Array.from(
      { length: yTicks + 1 },
      (_, i) => yMin + (i * (yMax - yMin)) / yTicks,
    );

    const labelStep = Math.max(1, Math.ceil(series.length / 6));
    const xLabels = series
      .map((s, i) => ({ x: xScale(i), label: s.label, full: s.label, i }))
      .filter(({ i }) => i % labelStep === 0 || i === series.length - 1)
      .map(({ x, label, full }) => ({ x, label, full }));

    return {
      path: d,
      min: yMin,
      max: yMax,
      ticks: ticksArr,
      labels: xLabels,
      points,
      dims: { w, h, lPad, rPad, tPad, bPad },
    };
  }, [series]);

  // Show loading state
  if (loading) {
    return (
      <div className="rounded-md border-2 border-border/60 bg-card p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="h-80 animate-pulse rounded-md bg-muted/20" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="rounded-md border-2 border-border/60 bg-card p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="flex h-80 items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Failed to load chart data</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!series || series.length === 0) {
    return (
      <div className="rounded-md border-2 border-border/60 bg-card p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="flex h-80 items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No data available</p>
            <p className="text-xs">Try selecting a different date or period</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border-2 border-border/60 bg-card p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {period === "hourly"
            ? "Hourly Profit (24h)"
            : period === "daily"
              ? "Daily Profit (30d)"
              : "Monthly Profit (12m)"}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          <Select
            value={period}
            onValueChange={(value) =>
              setPeriod(value as "hourly" | "daily" | "monthly")
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">24 Hours</SelectItem>
              <SelectItem value="daily">30 Days</SelectItem>
              <SelectItem value="monthly">12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          className="h-80 w-full min-w-[800px]"
          onMouseMove={(e) => {
            const svg = e.currentTarget as SVGSVGElement;
            const ctm = svg.getScreenCTM() as any;
            if (!ctm) return;
            const pt = (svg as any).createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const cursor = pt.matrixTransform(ctm.inverse());
            const x = cursor.x as number;
            let nearest = 0;
            let best = Infinity;
            for (let i = 0; i < points.length; i++) {
              const d = Math.abs(points[i].x - x);
              if (d < best) {
                best = d;
                nearest = i;
              }
            }
            setHoverIndex(nearest);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
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
              const y =
                dims.tPad +
                (i * (dims.h - dims.tPad - dims.bPad)) / (ticks.length - 1);
              return (
                <g key={i}>
                  <line
                    x1={dims.lPad}
                    x2={dims.w - dims.rPad}
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
                    {formatNumber(max - ((max - min) * i) / (ticks.length - 1))}
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
            d={`${path} L ${dims.w - dims.rPad},${dims.h - dims.bPad} L ${dims.lPad},${dims.h - dims.bPad} Z`}
            fill="url(#profGrad)"
            opacity={0.8}
          />
          {labels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={dims.h - 8}
              fontSize="10"
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
            >
              {l.label}
              <title>{l.full}</title>
            </text>
          ))}
          {hoverIndex != null && points[hoverIndex] && (
            <g>
              <line
                x1={points[hoverIndex].x}
                x2={points[hoverIndex].x}
                y1={dims.tPad}
                y2={dims.h - dims.bPad}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
              />
              <circle
                cx={points[hoverIndex].x}
                cy={points[hoverIndex].y}
                r={3}
                fill="hsl(var(--primary))"
              />
              <g
                transform={`translate(${Math.min(dims.w - 40, Math.max(60, points[hoverIndex].x + 8))},${Math.max(40, points[hoverIndex].y - 24)})`}
              >
                <rect
                  x={-50}
                  y={-20}
                  width={120}
                  height={32}
                  rx={4}
                  fill="hsl(var(--popover))"
                  stroke="hsl(var(--border))"
                />
                <text
                  x={10}
                  y={-6}
                  fontSize="10"
                  fill="hsl(var(--muted-foreground))"
                >
                  {points[hoverIndex].label}
                </text>
                <text x={10} y={10} fontSize="12" fill="hsl(var(--foreground))">
                  {formatNumber(points[hoverIndex].value)}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

export default ProfitChart;
