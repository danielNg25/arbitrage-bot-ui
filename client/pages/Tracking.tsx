import React, { useCallback, useEffect, useMemo, useState } from "react";
import OpportunityTable, {
  type OpportunityRow,
  type SortDir,
  type SortKey,
} from "@/components/dashboard/opportunity/OpportunityTable";
import FilterControls, {
  type StatusFilter,
} from "@/components/dashboard/opportunity/FilterControls";
import Pagination from "@/components/dashboard/opportunity/Pagination";
import type { Network, OpportunityResponse, PaginationInfo } from "@shared/api";
import { useNavigate } from "react-router-dom";

function buildDummyNetworks(): Network[] {
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
    },
  ];
}

function buildDummyOpps(nets: Network[], count = 50): OpportunityResponse[] {
  const networks = nets.length ? nets : buildDummyNetworks();
  const statuses: string[] = [
    "succeeded",
    "partially_succeeded",
    "reverted",
    "error",
    "skipped",
  ];
  const now = new Date();
  return Array.from({ length: count }).map((_, i) => {
    const nid = networks[Math.floor(Math.random() * networks.length)].chain_id;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const profit =
      Math.random() > 0.15
        ? Number((Math.random() * 2000 - 200).toFixed(2))
        : null;
    const gas =
      Math.random() > 0.1 ? Number((Math.random() * 50 + 1).toFixed(2)) : null;
    const created = new Date(
      now.getTime() -
        Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000 -
        Math.floor(Math.random() * 24 * 60 * 60 * 1000),
    );
    const token =
      "0x" +
      Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");
    const id = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    return {
      network_id: nid,
      status,
      profit_usd: profit,
      gas_usd: gas,
      created_at: created.toISOString(),
      source_tx: `0x${id}`,
      source_block_number: Math.floor(Math.random() * 1000000) + 1000000,
      profit_token: token,
      profit_token_name: "Demo Token",
      profit_token_symbol: "DEMO",
      profit_token_decimals: 18,
    };
  });
}

export default function Tracking() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [networksLoading, setNetworksLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [networkId, setNetworkId] = useState<number | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1); // Changed to 1-based indexing
  const [pageSize, setPageSize] = useState(100); // Changed to match API default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profitMin, setProfitMin] = useState<number | "">("");
  const [profitMax, setProfitMax] = useState<number | "">("");

  useEffect(() => {
    // Fetch real network data from the API
    const fetchNetworks = async () => {
      setNetworksLoading(true);
      try {
        const res = await fetch("/api/v1/networks");
        if (res.ok) {
          const data = await res.json();
          console.log("Networks loaded:", data);
          setNetworks(data);
        } else {
          // Fallback to dummy networks if API fails
          console.log("API failed, using dummy networks");
          setNetworks(buildDummyNetworks());
        }
      } catch (error) {
        console.error("Error fetching networks:", error);
        // Fallback to dummy networks if API fails
        setNetworks(buildDummyNetworks());
      } finally {
        setNetworksLoading(false);
      }
    };

    fetchNetworks();
  }, []);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      // Add pagination parameters
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      // Add filters
      if (networkId !== "all") params.set("network_id", String(networkId));
      if (status !== "all" && Array.isArray(status)) {
        // Handle multiple statuses - add each one as a separate statuses parameter
        status.forEach((s) => {
          // Convert status to lowercase to match API spec
          const apiStatus = s
            .toLowerCase()
            .replace(/([A-Z])/g, "_$1")
            .toLowerCase();
          params.append("statuses", apiStatus);
        });
      }
      // Note: profit_usd field is actually revenue, so we filter by revenue
      // The actual net profit (revenue - gas) is calculated in the UI
      if (profitMin !== "") params.set("min_profit_usd", String(profitMin));
      if (profitMax !== "") params.set("max_profit_usd", String(profitMax));

      const res = await fetch(
        `/api/v1/opportunities${params.toString() ? `?${params.toString()}` : ""}`,
      );

      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("Opportunities API service unavailable");
        }
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setOpportunities(data.opportunities || []);
      setPagination(data.pagination || null);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Error fetching opportunities:", e);
      // Fallback to dummy data
      const dummyData = buildDummyOpps(networks, pageSize);
      setOpportunities(dummyData);
      setPagination({
        page,
        limit: pageSize,
        total: 1000, // Dummy total
        total_pages: Math.ceil(1000 / pageSize),
        has_next: page < Math.ceil(1000 / pageSize),
        has_prev: page > 1,
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, networkId, status, profitMin, profitMax, networks]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const navigate = useNavigate();

  // Convert OpportunityResponse to OpportunityRow for the table
  const tableRows: OpportunityRow[] = useMemo(() => {
    return opportunities.map((opp) => {
      // Find the network name for this opportunity
      const network = networks.find((n) => n.chain_id === opp.network_id);
      const networkName = network?.name || `Network ${opp.network_id}`;

      // Debug logging
      if (!network) {
        console.log(
          `Network not found for ID ${opp.network_id}. Available networks:`,
          networks.map((n) => ({ id: n.chain_id, name: n.name })),
        );
      }

      return {
        id: opp.source_tx || opp.profit_token,
        network_id: opp.network_id,
        network_name: networkName, // Add network name for display
        status: opp.status,
        profit_token: opp.profit_token,
        profit_token_symbol: opp.profit_token_symbol, // Add profit token symbol
        profit_usd: opp.profit_usd,
        gas_usd: opp.gas_usd,
        created_at: new Date(opp.created_at).getTime(),
        source_block_number: opp.source_block_number, // Add source block number
      };
    });
  }, [opportunities, networks]);

  const onSortChange = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const onPageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  const onPageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <section aria-label="Opportunity Tracking" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Opportunity Tracking
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
            <div>Current Time: {currentTime.toLocaleString()}</div>
            {lastUpdated && (
              <div>Last Updated: {lastUpdated.toLocaleString()}</div>
            )}
          </div>
          <button
            onClick={fetchOpportunities}
            className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="rounded-md border-2 border-border/60 bg-card p-4 shadow-md">
        <FilterControls
          status={status}
          networkId={networkId}
          networks={networks.map((n) => ({
            chain_id: n.chain_id,
            name: n.name,
          }))}
          profitMin={profitMin}
          profitMax={profitMax}
          onChange={(v) => {
            if (v.status) setStatus(v.status);
            if (typeof v.networkId !== "undefined") setNetworkId(v.networkId);
            if (typeof v.profitMin !== "undefined") setProfitMin(v.profitMin);
            if (typeof v.profitMax !== "undefined") setProfitMax(v.profitMax);

            setPage(1);
          }}
          onClear={() => {
            setStatus("all");
            setNetworkId("all");
            setProfitMin("");
            setProfitMax("");

            setPage(1);
          }}
        />
      </div>

      {loading || networksLoading ? (
        <div className="h-48 animate-pulse rounded-md border-2 border-border/60 bg-card" />
      ) : error ? (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {error}
        </div>
      ) : (
        <>
          {networks.length > 0 && (
            <OpportunityTable
              rows={tableRows}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={onSortChange}
              onRowClick={(r) => {
                const rid = r.id || String(r.created_at);
                navigate(`/opportunities/${rid}`);
              }}
            />
          )}
          {pagination && (
            <div className="pt-3">
              <Pagination
                page={pagination.page - 1} // Convert to 0-based for component
                pageSize={pagination.limit}
                total={pagination.total}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
