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
      id: id, // Add MongoDB ObjectId
      network_id: nid,
      status,
      profit_usd: profit,
      gas_usd: gas,
      estimate_profit_usd: profit ? profit * (0.8 + Math.random() * 0.4) : null, // Estimated profit with some variance
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
  const [status, setStatus] = useState<StatusFilter>("Profitable");
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
  const [estimateProfitMin, setEstimateProfitMin] = useState<number | "">("");
  const [estimateProfitMax, setEstimateProfitMax] = useState<number | "">("");
  const [timestampFrom, setTimestampFrom] = useState<string>("");
  const [timestampTo, setTimestampTo] = useState<string>("");

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
      if (status !== "all") {
        if (status === "Profitable") {
          // For profitable filter, set min_profit_usd to 0.001 (anything above 0)
          params.set("min_profit_usd", "0.001");
        } else {
          // Convert status to lowercase to match API spec
          const apiStatus = status
            .toLowerCase()
            .replace(/([A-Z])/g, "_$1")
            .toLowerCase();
          params.set("status", apiStatus);
        }
      }
      // Note: profit_usd field is actually revenue, so we filter by revenue
      // The actual net profit (revenue - gas) is calculated in the UI
      if (profitMin !== "") params.set("min_profit_usd", String(profitMin));
      if (profitMax !== "") params.set("max_profit_usd", String(profitMax));

      // Add estimated profit filters
      if (estimateProfitMin !== "")
        params.set("min_estimate_profit_usd", String(estimateProfitMin));
      if (estimateProfitMax !== "")
        params.set("max_estimate_profit_usd", String(estimateProfitMax));

      // Add timestamp filters - Unix timestamps
      if (timestampFrom !== "") {
        params.set("min_created_at", timestampFrom);
      }
      if (timestampTo !== "") {
        params.set("max_created_at", timestampTo);
      }

      const res = await fetch(`/api/v1/opportunities?${params.toString()}`);

      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("Opportunities API service unavailable");
        }
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      console.log(`API Response - Page ${page}, Limit ${pageSize}:`, {
        opportunitiesCount: data.opportunities?.length || 0,
        pagination: data.pagination,
        url: `/api/v1/opportunities?${params.toString()}`,
      });

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
  }, [
    page,
    pageSize,
    networkId,
    status,
    profitMin,
    profitMax,
    estimateProfitMin,
    estimateProfitMax,
    timestampFrom,
    timestampTo,
    networks,
  ]);

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

  // Convert OpportunityResponse to OpportunityRow for the table and apply sorting
  const tableRows: OpportunityRow[] = useMemo(() => {
    let rows = opportunities.map((opp) => {
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
        id: opp.id || opp.source_tx || opp.profit_token,
        network_id: opp.network_id,
        network_name: networkName, // Add network name for display
        status: opp.status,
        profit_token: opp.profit_token,
        profit_token_symbol: opp.profit_token_symbol, // Add profit token symbol
        profit_usd: opp.profit_usd,
        gas_usd: opp.gas_usd,
        estimate_profit_usd: opp.estimate_profit_usd, // Add estimated profit
        created_at: Math.floor(new Date(opp.created_at).getTime() / 1000),
        source_block_number: opp.source_block_number, // Add source block number
      };
    });

    // Apply sorting
    rows.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortKey) {
        case "profit_usd":
          aValue = a.profit_usd ?? 0;
          bValue = b.profit_usd ?? 0;
          break;
        case "created_at":
          aValue = a.created_at;
          bValue = b.created_at;
          break;
        default:
          return 0;
      }

      if (sortDir === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return rows;
  }, [opportunities, networks, sortKey, sortDir]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [networkId, status, profitMin, profitMax, timestampFrom, timestampTo]);

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
    // Convert from 0-based to 1-based for API
    setPage(newPage + 1);
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
          estimateProfitMin={estimateProfitMin}
          estimateProfitMax={estimateProfitMax}
          timestampFrom={timestampFrom}
          timestampTo={timestampTo}
          onChange={(v) => {
            if (v.status) setStatus(v.status);
            if (typeof v.networkId !== "undefined") setNetworkId(v.networkId);
            if (typeof v.profitMin !== "undefined") setProfitMin(v.profitMin);
            if (typeof v.profitMax !== "undefined") setProfitMax(v.profitMax);
            if (typeof v.estimateProfitMin !== "undefined")
              setEstimateProfitMin(v.estimateProfitMin);
            if (typeof v.estimateProfitMax !== "undefined")
              setEstimateProfitMax(v.estimateProfitMax);
            if (typeof v.timestampFrom !== "undefined")
              setTimestampFrom(v.timestampFrom);
            if (typeof v.timestampTo !== "undefined")
              setTimestampTo(v.timestampTo);

            setPage(1);
          }}
          onClear={() => {
            setStatus("Profitable");
            setNetworkId("all");
            setProfitMin("");
            setProfitMax("");
            setEstimateProfitMin("");
            setEstimateProfitMax("");
            setTimestampFrom("");
            setTimestampTo("");

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
              onRowClick={(r, openInNewTab) => {
                const rid = r.id || String(r.created_at);
                console.log("Row clicked:", { rid, openInNewTab });
                if (openInNewTab) {
                  // Open in new tab
                  console.log("Opening in new tab:", `/opportunities/${rid}`);
                  window.open(
                    `/opportunities/${rid}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                } else {
                  // Navigate in current tab
                  console.log(
                    "Navigating in current tab:",
                    `/opportunities/${rid}`,
                  );
                  navigate(`/opportunities/${rid}`);
                }
              }}
            />
          )}
          {pagination && (
            <div className="pt-3">
              <Pagination
                page={pagination.page - 1} // Use API pagination data
                pageSize={pagination.limit}
                total={pagination.total}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                currentPage={page}
                totalPages={pagination.total_pages || 1}
                onDirectPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
