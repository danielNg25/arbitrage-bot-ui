import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { DailyNetworkCard } from "@/components/dashboard/DailyNetworkCard";
import { useTimeAggregations } from "@/hooks/use-time-aggregations";
import { Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type Opportunity = {
  network_id: number;
  status: string;
  profit_usd: number | null;
  created_at: number; // unix ms
};

type LoadState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

function buildDummyOpportunities(): Opportunity[] {
  const now = Date.now();
  const opportunities: Opportunity[] = Array.from({ length: 50 }).map(
    (_, i) => {
      const dayOffset = Math.floor(Math.random() * 30);
      const created = new Date(
        now - dayOffset * 24 * 60 * 60 * 1000 - Math.random() * 86400000,
      );
      const status = Math.random() > 0.2 ? "Succeeded" : "Skipped";
      const profit =
        status === "Succeeded"
          ? Number((Math.random() * 2000 - 300).toFixed(2))
          : 0;
      const nets = [1, 137, 56, 42161, 10, 8453];
      return {
        network_id: nets[i % nets.length],
        status,
        profit_usd: profit,
        created_at: created.getTime(),
      };
    },
  );
  return opportunities;
}

export default function Index() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Default to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const {
    data: timeAggregations,
    loading: aggregationsLoading,
    error: aggregationsError,
    refetch: refetchAggregations,
  } = useTimeAggregations("daily", undefined, selectedDate); // Get data for all networks for selected date

  // Debug logging
  useEffect(() => {
    console.log("Overview page state:", {
      selectedDate: selectedDate.toISOString(),
      timeAggregations,
      aggregationsLoading,
      aggregationsError,
    });
  }, [selectedDate, timeAggregations, aggregationsLoading, aggregationsError]);

  const [oppsState, setOpps] = useState<LoadState<Opportunity[]>>({
    data: null,
    loading: true,
    error: null,
  });
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const loadOpportunities = useCallback(async () => {
    setOpps((s) => ({ ...s, loading: true, error: null }));
    try {
      const oppsRes = await fetch("/opportunities");
      if (!oppsRes.ok) throw new Error("API unavailable");
      const opps = await oppsRes.json();
      setOpps({ data: opps as Opportunity[], loading: false, error: null });
      setLastUpdated(Date.now());
    } catch (e) {
      const opportunities = buildDummyOpportunities();
      setOpps({ data: opportunities, loading: false, error: null });
      setLastUpdated(Date.now());
    }
  }, []);

  const load = useCallback(async () => {
    await Promise.all([refetchAggregations(), loadOpportunities()]);
  }, [refetchAggregations, loadOpportunities]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const successByNetwork = useMemo(() => {
    const map = new Map<number, number>();
    const opps = oppsState.data || [];
    for (const o of opps)
      if (o.status === "Succeeded" || o.status === "PartiallySucceeded")
        map.set(o.network_id, (map.get(o.network_id) || 0) + 1);
    return map;
  }, [oppsState.data]);

  const failedByNetwork = useMemo(() => {
    const map = new Map<number, number>();
    const opps = oppsState.data || [];
    for (const o of opps)
      if (o.status === "Reverted" || o.status === "Error")
        map.set(o.network_id, (map.get(o.network_id) || 0) + 1);
    return map;
  }, [oppsState.data]);

  const loading = aggregationsLoading || oppsState.loading;
  const error = aggregationsError || oppsState.error;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
          <Button onClick={load} className="shadow-sm">
            Refresh
          </Button>
        </div>
      </div>

      <section aria-label="Daily Network Metrics" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight">
            Daily Network Metrics
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const yesterday = new Date(selectedDate);
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday);
                }}
                disabled={selectedDate <= new Date("2020-01-01")} // Reasonable minimum date
                className="h-8 px-2"
              >
                ←
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 flex items-center gap-2 min-w-[120px] justify-center"
                  >
                    <Calendar size={14} />
                    {selectedDate.toLocaleDateString()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3 space-y-3">
                    <div className="text-center">
                      <p className="text-sm font-medium mb-2">Select Date</p>
                      <input
                        type="date"
                        value={selectedDate.toISOString().split("T")[0]}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value);
                          newDate.setHours(0, 0, 0, 0);
                          setSelectedDate(newDate);
                        }}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-center"
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          setSelectedDate(today);
                        }}
                        className="flex-1"
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          yesterday.setHours(0, 0, 0, 0);
                          setSelectedDate(yesterday);
                        }}
                        className="flex-1"
                      >
                        Yesterday
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const tomorrow = new Date(selectedDate);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow);
                }}
                disabled={selectedDate >= new Date()}
                className="h-8 px-2"
              >
                →
              </Button>
            </div>
            {timeAggregations && timeAggregations.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const timestamps = timeAggregations.map(
                    (agg) => agg.timestamp,
                  );
                  const date = Math.min(...timestamps);
                  const minDate = new Date(date * 1000);
                  return `Data: ${minDate.toLocaleDateString()}`;
                })()}
              </p>
            )}
          </div>
        </div>

        {/* Daily Summary Metrics */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-md border-2 border-border/60 bg-card"
              />
            ))}
          </div>
        ) : timeAggregations && timeAggregations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-md border-2 border-border/60 bg-card p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Total Daily Profit
                  </p>
                  <p className="mt-1 text-xl font-semibold leading-none font-mono tabular-nums text-emerald-400">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 2,
                    }).format(
                      timeAggregations.reduce(
                        (sum, agg) => sum + agg.total_profit_usd,
                        0,
                      ),
                    )}
                  </p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </div>

            <div className="rounded-md border-2 border-border/60 bg-card p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Total Daily Gas
                  </p>
                  <p className="mt-1 text-xl font-semibold leading-none font-mono tabular-nums text-rose-400">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 2,
                    }).format(
                      timeAggregations.reduce(
                        (sum, agg) => sum + agg.total_gas_usd,
                        0,
                      ),
                    )}
                  </p>
                </div>
                <div className="text-2xl">⛽</div>
              </div>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-md border-2 border-border/60 bg-card"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 max-h-[420px] overflow-y-auto pr-1">
            {timeAggregations
              ?.sort((a, b) => b.total_profit_usd - a.total_profit_usd)
              .map((aggregation) => (
                <DailyNetworkCard
                  key={aggregation.network_id}
                  aggregation={aggregation}
                />
              ))}
          </div>
        )}
      </section>

      <section aria-label="Profit Over Time" className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">
          Daily Profit Trend
        </h3>
        <ProfitChart title="Profit Trend" period="hourly" limit={24} />
      </section>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {error}
        </div>
      )}
    </div>
  );
}
