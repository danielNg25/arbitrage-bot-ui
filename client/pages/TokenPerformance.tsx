import React, { useCallback, useEffect, useMemo, useState } from "react";
import TokenTable, { type TokenRow } from "@/components/dashboard/token/TokenTable";
import TokenProfitChart, { type TokenDatum } from "@/components/dashboard/token/TokenProfitChart";
import Pagination from "@/components/dashboard/opportunity/Pagination";
import type { Network } from "@/components/dashboard/NetworkCard";

function dummyNetworks(): Network[] {
  return [
    { chain_id: 1, name: "Ethereum", total_profit_usd: 0, total_gas_usd: 0 },
    { chain_id: 137, name: "Polygon", total_profit_usd: 0, total_gas_usd: 0 },
    { chain_id: 56, name: "BSC", total_profit_usd: 0, total_gas_usd: 0 },
  ];
}

function buildDummyTokens(nets: Network[], count = 20): TokenRow[] {
  const networks = nets.length ? nets : dummyNetworks();
  return Array.from({ length: count }).map((_, i) => {
    const net = networks[i % networks.length];
    const sym = ["ETH", "USDC", "DAI", "WBTC", "MATIC", "BNB"][i % 6] || null;
    const name = sym ? `${sym} Token` : null;
    const price = Math.random() > 0.2 ? Number((Math.random() * 4000 + 0.1).toFixed(2)) : null;
    const total_profit_usd = Number((Math.random() * 100000).toFixed(2));
    const address = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    return { name, symbol: sym, total_profit_usd, price, address, network_id: net.chain_id };
  });
}

export default function TokenPerformance() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/networks");
        if (!res.ok) throw new Error("no api");
        const data = (await res.json()) as Network[];
        setNetworks(data);
      } catch {
        setNetworks(dummyNetworks());
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("/tokens", { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("API unavailable");
      const data = (await res.json()) as TokenRow[];
      setTokens(data);
    } catch (e) {
      setTokens(buildDummyTokens(networks, 20));
    } finally {
      setLoading(false);
    }
  }, [networks]);

  useEffect(() => { load(); }, [load]);

  const networkNames = useMemo(() => Object.fromEntries(networks.map(n => [n.chain_id, n.name])), [networks]);
  const [chainFilter, setChainFilter] = useState<number | "all">("all");

  const filtered = useMemo(() => {
    return tokens.filter(t => chainFilter === "all" || t.network_id === chainFilter);
  }, [tokens, chainFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => b.total_profit_usd - a.total_profit_usd);
  }, [filtered]);

  const paged = useMemo(() => {
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  const chartData: TokenDatum[] = useMemo(() => {
    return sorted.map((t) => ({ label: t.symbol ?? `${t.address.slice(0, 6)}…${t.address.slice(-4)}`, value: t.total_profit_usd }));
  }, [sorted]);

  return (
    <section aria-label="Token Performance" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Token Performance</h2>

      <div className="rounded-md border-2 border-border/60 bg-card p-4 shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-muted-foreground">Chain</label>
            <select
              className="h-10 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
              value={chainFilter}
              onChange={(e) => { const v = e.target.value === "all" ? "all" : Number(e.target.value); setChainFilter(v); setPage(0); }}
            >
              <option value="all">All Chains</option>
              {networks.map((n) => (
                <option key={n.chain_id} value={n.chain_id}>{n.name} ({n.chain_id})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-md border-2 border-border/60 bg-card" />
      ) : error ? (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">{error}</div>
      ) : (
        <>
          <TokenProfitChart title="Profit Contribution by Token" data={chartData} />
          <TokenTable rows={paged} networkNames={networkNames} />
          <div className="pt-3">
            <Pagination page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} />
          </div>
        </>
      )}
    </section>
  );
}
