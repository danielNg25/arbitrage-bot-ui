import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfitChart, SeriesPoint } from "@/components/dashboard/ProfitChart";
import { NetworkCard, type Network } from "@/components/dashboard/NetworkCard";

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

function formatDateLabel(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function startOfDay(d: Date) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

function lastNDays(n: number) {
  const days: Date[] = [];
  const today = startOfDay(new Date());
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

function buildDummyData(): { networks: Network[]; opportunities: Opportunity[] } {
  const networks: Network[] = [
    { chain_id: 1, name: "Ethereum", total_profit_usd: 158423.23, total_gas_usd: 48231.55 },
    { chain_id: 137, name: "Polygon", total_profit_usd: 40213.87, total_gas_usd: 7221.04 },
    { chain_id: 56, name: "BSC", total_profit_usd: 65891.09, total_gas_usd: 12891.66 },
    { chain_id: 42161, name: "Arbitrum", total_profit_usd: 31231.12, total_gas_usd: 5123.44 },
    { chain_id: 10, name: "Optimism", total_profit_usd: 28344.77, total_gas_usd: 4011.32 },
    { chain_id: 8453, name: "Base", total_profit_usd: 22111.95, total_gas_usd: 2987.41 },
    { chain_id: 43114, name: "Avalanche", total_profit_usd: 20111.5, total_gas_usd: 2500.12 },
  ];
  const now = Date.now();
  const opportunities: Opportunity[] = Array.from({ length: 50 }).map((_, i) => {
    const dayOffset = Math.floor(Math.random() * 30);
    const created = new Date(now - dayOffset * 24 * 60 * 60 * 1000 - Math.random() * 86400000);
    const status = Math.random() > 0.2 ? "executed" : "skipped";
    const profit = status === "executed" ? Number((Math.random() * 2000 - 300).toFixed(2)) : 0;
    const nets = [1, 137, 56, 42161, 10, 8453];
    return { network_id: nets[i % nets.length], status, profit_usd: profit, created_at: created.getTime() };
  });
  return { networks, opportunities };
}

export default function Index() {
  const [networksState, setNetworks] = useState<LoadState<Network[]>>({ data: null, loading: true, error: null });
  const [oppsState, setOpps] = useState<LoadState<Opportunity[]>>({ data: null, loading: true, error: null });
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = useCallback(async () => {
    setNetworks((s) => ({ ...s, loading: true, error: null }));
    setOpps((s) => ({ ...s, loading: true, error: null }));
    try {
      const [netsRes, oppsRes] = await Promise.all([
        fetch("/networks"),
        fetch("/opportunities"),
      ]);
      if (!netsRes.ok || !oppsRes.ok) throw new Error("API unavailable");
      const [nets, opps] = await Promise.all([netsRes.json(), oppsRes.json()]);
      setNetworks({ data: nets as Network[], loading: false, error: null });
      setOpps({ data: opps as Opportunity[], loading: false, error: null });
      setLastUpdated(Date.now());
    } catch (e) {
      const { networks, opportunities } = buildDummyData();
      setNetworks({ data: networks, loading: false, error: null });
      setOpps({ data: opportunities, loading: false, error: null });
      setLastUpdated(Date.now());
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const successByNetwork = useMemo(() => {
    const map = new Map<number, number>();
    const opps = oppsState.data || [];
    for (const o of opps) if (o.status === "executed") map.set(o.network_id, (map.get(o.network_id) || 0) + 1);
    return map;
  }, [oppsState.data]);

  const failedByNetwork = useMemo(() => {
    const map = new Map<number, number>();
    const opps = oppsState.data || [];
    for (const o of opps) if (o.status === "failed") map.set(o.network_id, (map.get(o.network_id) || 0) + 1);
    return map;
  }, [oppsState.data]);

  const chartSeries: SeriesPoint[] = useMemo(() => {
    const opps = (oppsState.data || []).filter((o) => o.status === "executed" && typeof o.profit_usd === "number");
    const buckets = new Map<string, number>();
    for (const d of lastNDays(30)) buckets.set(d.toISOString().slice(0, 10), 0);
    for (const o of opps) {
      const day = new Date(o.created_at);
      const key = startOfDay(day).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + (o.profit_usd || 0));
    }
    return Array.from(buckets.entries()).map(([day, val]) => ({ label: formatDateLabel(new Date(day)), value: Number(val.toFixed(2)) }));
  }, [oppsState.data]);

  const loading = networksState.loading || oppsState.loading;
  const error = networksState.error || oppsState.error;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">Updated {new Date(lastUpdated).toLocaleTimeString()}</p>
          )}
          <Button onClick={load} className="shadow-sm">Refresh</Button>
        </div>
      </div>

      <section aria-label="Network Metrics" className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">Network Metrics</h3>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-md border-2 border-border/60 bg-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 max-h-[420px] overflow-y-auto pr-1">
            {(networksState.data || []).map((net) => {
              const success = successByNetwork.get(net.chain_id) || 0;
              const failed = failedByNetwork.get(net.chain_id) || 0;
              return (
                <NetworkCard
                  key={net.chain_id}
                  network={net}
                  executedCount={success + failed}
                  successCount={success}
                  failedCount={failed}
                />
              );
            })}
          </div>
        )}
      </section>

      <section aria-label="Profit Over Time" className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">Profit Over Time (30d)</h3>
        <ProfitChart title="Total Profit (USD)" series={chartSeries} />
      </section>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">{error}</div>
      )}
    </div>
  );
}
