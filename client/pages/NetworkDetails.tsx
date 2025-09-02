import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ProfitChart,
  type SeriesPoint,
} from "@/components/dashboard/ProfitChart";

type AggToken = {
  address: string;
  name: string | null;
  symbol: string | null;
  total_profit_usd: number;
  total_profit: string;
  opportunity_count: number;
  avg_profit_usd: number;
};

export type TimeAggregationResponse = {
  network_id: number;
  network_name: string;
  period: string;
  timestamp: number;
  period_start: string;
  period_end: string;
  total_opportunities: number;
  executed_opportunities: number;
  successful_opportunities: number;
  failed_opportunities: number;
  total_profit_usd: number;
  total_gas_usd: number;
  avg_profit_usd: number;
  avg_gas_usd: number;
  success_rate: number;
  top_profit_tokens: AggToken[];
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export default function NetworkDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"hourly" | "daily" | "monthly">(
    "hourly",
  );
  const [limit, setLimit] = useState(24);
  const [aggs, setAggs] = useState<TimeAggregationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/v1/networks/${id}/aggregations?period=${period}&limit=${limit}`,
        );
        if (!res.ok) throw new Error("api");
        const data = (await res.json()) as TimeAggregationResponse[];
        setAggs(data);
      } catch (e) {
        // minimal fallback: empty
        setAggs([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, period, limit]);

  const name = aggs[0]?.network_name
    ? aggs[0].network_name.charAt(0).toUpperCase() +
      aggs[0].network_name.slice(1)
    : id;

  const series: SeriesPoint[] = useMemo(() => {
    const sorted = [...(aggs || [])].sort(
      (a, b) =>
        new Date(a.period_start).getTime() - new Date(b.period_start).getTime(),
    );
    const formatter = new Intl.DateTimeFormat(
      "en-US",
      (period === "hourly"
        ? {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        : period === "daily"
          ? { month: "numeric", day: "numeric", year: "numeric" }
          : { month: "short", year: "numeric" }) as Intl.DateTimeFormatOptions,
    );
    return sorted.map((a) => ({
      label: formatter.format(new Date(a.period_start)),
      value: a.total_profit_usd,
    }));
  }, [aggs, period]);

  const latest = aggs[0];

  return (
    <section aria-label="Network Details" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          {`Network: ${name}`}{" "}
          <span className="text-xs text-muted-foreground">(ID {id})</span>
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back
          </Button>
        </div>
      </div>

      <div className="rounded-md border-2 border-border/60 bg-card p-4 shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-muted-foreground">Period</label>
            <select
              className="h-10 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-muted-foreground">Limit</label>
            <input
              type="number"
              min={1}
              max={1000}
              className="h-10 w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
              value={limit}
              onChange={(e) =>
                setLimit(
                  Math.max(1, Math.min(1000, Number(e.target.value) || 1)),
                )
              }
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-md border-2 border-border/60 bg-card" />
      ) : error ? (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-md border-2 border-border/60 bg-card p-4 shadow-md">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Executed / Success / Failed
              </p>
              <p className="mt-1 font-mono text-xl tabular-nums">
                {latest
                  ? `${latest.executed_opportunities} / ${latest.successful_opportunities} / ${latest.failed_opportunities}`
                  : "-"}
              </p>
            </div>
            <div className="rounded-md border-2 border-border/60 bg-card p-4 shadow-md">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Total Profit / Gas
              </p>
              <p className="mt-1 font-mono text-xl tabular-nums">
                {latest
                  ? `${currency.format(latest.total_profit_usd)} / ${currency.format(latest.total_gas_usd)}`
                  : "-"}
              </p>
            </div>
            <div className="rounded-md border-2 border-border/60 bg-card p-4 shadow-md">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Success Rate
              </p>
              <p className="mt-1 font-mono text-xl tabular-nums">
                {latest
                  ? `${Math.round((latest.success_rate || 0) * 100)}%`
                  : "-"}
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-base font-semibold tracking-tight">
              Profit Over Time
            </h3>
            <ProfitChart title="Total Profit (USD)" series={series} />
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold tracking-tight">
              Top Profit Tokens
            </h3>
            <div className="rounded-md border-2 border-border/60 bg-card shadow-md overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead className="bg-muted/10 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Token</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Opportunities
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Total Profit (USD)
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Avg Profit (USD)
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(aggs[0]?.top_profit_tokens || []).map((t, i) => (
                    <tr
                      key={`${t.address}-${i}`}
                      className="border-t border-border/60 hover:bg-accent/10"
                    >
                      <td className="px-4 py-3">{t.name ?? "Unknown"}</td>
                      <td className="px-4 py-3 font-mono">{t.symbol ?? "-"}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {t.opportunity_count}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {currency.format(t.total_profit_usd)}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {currency.format(t.avg_profit_usd)}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {t.address.length > 12
                          ? `${t.address.slice(0, 6)}…${t.address.slice(-4)}`
                          : t.address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
