import React, { useCallback, useEffect, useMemo, useState } from "react";
import OpportunityTable, { type OpportunityRow, type SortDir, type SortKey } from "@/components/dashboard/opportunity/OpportunityTable";
import FilterControls, { type StatusFilter } from "@/components/dashboard/opportunity/FilterControls";
import Pagination from "@/components/dashboard/opportunity/Pagination";
import type { Network } from "@/components/dashboard/NetworkCard";
import { useNavigate } from "react-router-dom";

function buildDummyNetworks(): Network[] {
  return [
    { chain_id: 1, name: "Ethereum", total_profit_usd: 0, total_gas_usd: 0 },
    { chain_id: 137, name: "Polygon", total_profit_usd: 0, total_gas_usd: 0 },
    { chain_id: 56, name: "BSC", total_profit_usd: 0, total_gas_usd: 0 },
  ];
}

function buildDummyOpps(nets: Network[], count = 50): OpportunityRow[] {
  const networks = nets.length ? nets : buildDummyNetworks();
  const statuses: StatusFilter[] = ["pending", "executed", "failed"];
  const now = Date.now();
  return Array.from({ length: count }).map((_, i) => {
    const nid = networks[Math.floor(Math.random() * networks.length)].chain_id;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const profit = Math.random() > 0.15 ? Number((Math.random() * 2000 - 200).toFixed(2)) : null;
    const gas = Math.random() > 0.1 ? Number((Math.random() * 50 + 1).toFixed(2)) : null;
    const created = now - Math.floor(Math.random() * 30) * 86400000 - Math.floor(Math.random() * 86400000);
    const updated = created + Math.floor(Math.random() * 6) * 3600000;
    const token = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const id = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    return { id, network_id: nid, status, profit_token: token, profit_usd: profit, gas_usd: gas, created_at: created, updated_at: updated };
  });
}

export default function Tracking() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [networkId, setNetworkId] = useState<number | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<OpportunityRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/networks");
        if (!res.ok) throw new Error("no api");
        const data = (await res.json()) as Network[];
        setNetworks(data);
      } catch {
        setNetworks(buildDummyNetworks());
      }
    })();
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (networkId !== "all") params.set("network_id", String(networkId));
      if (status !== "all") params.set("status", status);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`/opportunities${params.toString() ? `?${params.toString()}` : ""}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("API unavailable");
      const data = (await res.json()) as OpportunityRow[];
      setRows(data);
    } catch (e) {
      setRows(buildDummyOpps(networks, 50));
    } finally {
      setLoading(false);
    }
  }, [networkId, status, networks]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const navigate = useNavigate();

  const sorted = useMemo(() => {
    const arr = rows.filter((r) => (networkId === "all" || r.network_id === networkId) && (status === "all" || r.status === status));
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "created_at") return dir * (a.created_at - b.created_at);
      const av = a[sortKey] == null ? -Infinity : (a[sortKey] as number);
      const bv = b[sortKey] == null ? -Infinity : (b[sortKey] as number);
      return dir * (av - bv);
    });
    return arr;
  }, [rows, networkId, status, sortKey, sortDir]);

  const paged = useMemo(() => {
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  const onSortChange = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <section aria-label="Opportunity Tracking" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Opportunity Tracking</h2>
      <div className="rounded-md border-2 border-border/60 bg-card p-4 shadow-md">
        <FilterControls
          status={status}
          networkId={networkId}
          networks={networks.map((n) => ({ chain_id: n.chain_id, name: n.name }))}
          onChange={(v) => {
            if (v.status) setStatus(v.status);
            if (typeof v.networkId !== "undefined") setNetworkId(v.networkId);
            setPage(0);
          }}
          onClear={() => {
            setStatus("all");
            setNetworkId("all");
            setPage(0);
          }}
        />
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-md border-2 border-border/60 bg-card" />
      ) : error ? (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">{error}</div>
      ) : (
        <>
          <OpportunityTable rows={paged} sortKey={sortKey} sortDir={sortDir} onSortChange={onSortChange} onRowClick={(r) => {
            const rid = r.id || String(r.created_at);
            navigate(`/opportunities/${rid}`);
          }} />
          <div className="pt-3">
            <Pagination page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} />
          </div>
        </>
      )}
    </section>
  );
}
