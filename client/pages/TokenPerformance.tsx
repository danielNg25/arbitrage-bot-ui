import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNetworkVisibility } from "@/context/NetworkVisibilityContext";
import TokenTable, {
  type TokenRow,
} from "@/components/dashboard/token/TokenTable";
import Pagination from "@/components/dashboard/opportunity/Pagination";
import type { Network } from "@shared/api";

function dummyNetworks(): Network[] {
  return [
    {
      chain_id: 1,
      name: "Ethereum",
      rpc: "https://eth-mainnet.g.alchemy.com/v2/demo",
      block_explorer: "https://etherscan.io",
      executed: 0,
      success: 0,
      failed: 0,
      total_profit_usd: 0,
      total_gas_usd: 0,
      last_proccesed_created_at: null,
      created_at: Math.floor(Date.now() / 1000),
      executed_opportunities: 0,
      success_rate: null,
      router_address: null,
      executors: [],
    },
    {
      chain_id: 137,
      name: "Polygon",
      rpc: "https://polygon-rpc.com",
      block_explorer: "https://polygonscan.com",
      executed: 0,
      success: 0,
      failed: 0,
      total_profit_usd: 0,
      total_gas_usd: 0,
      last_proccesed_created_at: null,
      created_at: Math.floor(Date.now() / 1000),
      executed_opportunities: 0,
      success_rate: null,
      router_address: null,
      executors: [],
    },
    {
      chain_id: 56,
      name: "BSC",
      rpc: "https://bsc-dataseed.binance.org",
      block_explorer: "https://bscscan.com",
      executed: 0,
      success: 0,
      failed: 0,
      total_profit_usd: 0,
      total_gas_usd: 0,
      last_proccesed_created_at: null,
      created_at: Math.floor(Date.now() / 1000),
      executed_opportunities: 0,
      success_rate: null,
      router_address: null,
      executors: [],
    },
  ];
}

function buildDummyTokens(nets: Network[], count = 20): TokenRow[] {
  const networks = nets.length ? nets : dummyNetworks();
  return Array.from({ length: count }).map((_, i) => {
    const net = networks[i % networks.length];
    const sym = ["ETH", "USDC", "DAI", "WBTC", "MATIC", "BNB"][i % 6] || null;
    const name = sym ? `${sym} Token` : null;
    const price =
      Math.random() > 0.2
        ? Number((Math.random() * 4000 + 0.1).toFixed(2))
        : null;
    const total_profit_usd = Number((Math.random() * 100000).toFixed(2));
    const total_profit = (Math.random() * 1000).toFixed(6); // Dummy token amount
    const address =
      "0x" +
      Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");
    return {
      name,
      symbol: sym,
      total_profit_usd,
      total_profit,
      price,
      address,
      network_id: net.chain_id,
      network_name: net.name,
      block_explorer: net.block_explorer,
    };
  });
}

export default function TokenPerformance() {
  const { showNetworkInfo } = useNetworkVisibility();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/networks");
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
      const res = await fetch("/api/v1/tokens/performance", {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("API unavailable");
      const data = (await res.json()) as TokenRow[];

      // Map block_explorer from networks data
      const tokensWithExplorer = data.map((token) => {
        const network = networks.find((n) => n.chain_id === token.network_id);
        return {
          ...token,
          block_explorer: network?.block_explorer || null,
        };
      });

      setTokens(tokensWithExplorer);
    } catch (e) {
      setTokens(buildDummyTokens(networks, 20));
    } finally {
      setLoading(false);
    }
  }, [networks]);

  useEffect(() => {
    load();
  }, [load]);

  const [chainFilter, setChainFilter] = useState<number | "all">("all");

  const filtered = useMemo(() => {
    return tokens.filter(
      (t) => chainFilter === "all" || t.network_id === chainFilter,
    );
  }, [tokens, chainFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort(
      (a, b) => b.total_profit_usd - a.total_profit_usd,
    );
  }, [filtered]);

  const paged = useMemo(() => {
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  return (
    <section aria-label="Token Performance" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        Token Performance
      </h2>

      <div className="rounded-md border-2 border-border/60 bg-card p-4 shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-muted-foreground">Chain</label>
            <select
              className="h-10 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
              value={chainFilter}
              onChange={(e) => {
                const v =
                  e.target.value === "all" ? "all" : Number(e.target.value);
                setChainFilter(v);
                setPage(0);
              }}
            >
              <option value="all">All Chains</option>
              {networks.map((n) => (
                <option key={n.chain_id} value={n.chain_id}>
                  {showNetworkInfo
                    ? `${n.name} (${n.chain_id})`
                    : `Chain ID: ****`}
                </option>
              ))}
            </select>
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
          <TokenTable rows={paged} />
          <div className="pt-3">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={sorted.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}
    </section>
  );
}
