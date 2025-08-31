import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DebugDetails, { type OpportunityDetail, type OpportunityDebug } from "@/components/dashboard/opportunity/DebugDetails";
import { Button } from "@/components/ui/button";
import type { Network } from "@/components/dashboard/NetworkCard";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function dummy(networks: Network[]): { opp: OpportunityDetail; dbg: OpportunityDebug } {
  const net = networks[0] || { chain_id: 1, name: "Ethereum", total_profit_usd: 0, total_gas_usd: 0 };
  const now = Date.now();
  return {
    opp: {
      id: "64f9c7e2a1b2c3d4e5f67890",
      network_id: net.chain_id,
      source_pool: "0xabcDEF1234567890abcDEF12",
      status: "executed",
      profit_token: "0xfeedbeef1234567890abcdef",
      profit_usd: 1234.56,
      gas_usd: 23.45,
      created_at: now - 3600_000,
      updated_at: now,
      source_block_number: 123456789,
      source_block_timestamp: now - 3600_000,
      source_tx: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      source_log_index: 42,
      execute_block_number: 123456799,
      execute_tx: "0xfacefacefacefacefacefacefacefacefaceface",
      amount: "123.4567",
      profit: "1.234 ETH",
      gas_token_amount: "0.0123 ETH",
    },
    dbg: {
      id: "64f9c7e2a1b2c3d4e5f67890",
      estimate_profit_usd: 1500.12,
      estimate_profit_token_amount: "1.567 ETH",
      gas_amount: 210000,
      gas_price: 12_000_000_000,
      simulation_time: 152,
      path: [
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222",
        "0x3333333333333333333333333333333333333333",
      ],
      received_at: now - 2000,
      send_at: now - 1000,
      error: null,
    },
  };
}

export default function DebugInsights() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [opp, setOpp] = useState<OpportunityDetail | null>(null);
  const [dbg, setDbg] = useState<OpportunityDebug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenMeta, setTokenMeta] = useState<Record<string, { name?: string | null; symbol?: string | null }>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/networks");
        if (!res.ok) throw new Error("networks");
        const data = (await res.json()) as Network[];
        setNetworks(data);
      } catch {
        setNetworks([{ chain_id: 1, name: "Ethereum", total_profit_usd: 0, total_gas_usd: 0 }]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/tokens");
        if (!res.ok) throw new Error("tokens");
        const rows = (await res.json()) as Array<{ address: string; name?: string | null; symbol?: string | null; network_id?: number }>;
        const map: Record<string, { name?: string | null; symbol?: string | null }> = {};
        rows.forEach((r) => {
          if (r.address) map[r.address.toLowerCase()] = { name: r.name ?? null, symbol: r.symbol ?? null };
        });
        setTokenMeta(map);
      } catch {
        setTokenMeta({});
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [oppRes, dbgRes] = await Promise.all([
          fetch(`/opportunities/${id}`),
          fetch(`/opportunity_debug/${id}`),
        ]);
        if (!oppRes.ok || !dbgRes.ok) throw new Error("api");
        const oppData = (await oppRes.json()) as OpportunityDetail;
        const dbgData = (await dbgRes.json()) as OpportunityDebug;
        setOpp(oppData);
        setDbg(dbgData);
      } catch (e) {
        const d = dummy(networks);
        setOpp(d.opp);
        setDbg(d.dbg);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, networks]);

  const networkName = useMemo(() => {
    const map = Object.fromEntries(networks.map((n) => [n.chain_id, n.name]));
    return map[(opp?.network_id as number) ?? -1] || String(opp?.network_id ?? "");
  }, [networks, opp?.network_id]);

  return (
    <section aria-label="Debug Insights" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Opportunity Debug Insights</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/opportunities")}>Back to Opportunities</Button>
          <Button onClick={() => console.log(`Simulate clicked for Opportunity ID: ${id}`)}>Simulate</Button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-md border-2 border-border/60 bg-card" />
      ) : error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      ) : opp ? (
        <DebugDetails opp={opp} dbg={dbg} networkName={networkName} tokenMeta={tokenMeta} />
      ) : (
        <div className="text-sm text-muted-foreground">No data</div>
      )}
    </section>
  );
}
