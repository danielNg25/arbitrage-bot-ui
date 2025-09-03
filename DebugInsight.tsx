import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DebugDetails, {
  type OpportunityDetail,
  type OpportunityDebug,
} from "@/components/dashboard/opportunity/DebugDetails";
import { Button } from "@/components/ui/button";

type ApiResponse = {
  opportunity: any;
  network: { chain_id: number; name: string; block_explorer: string | null };
  path_tokens: Array<{
    address: string;
    name?: string | null;
    symbol?: string | null;
    decimals?: number | null;
  }>;
  path_pools: Array<{ address: string }>;
};

function toMillis(s?: string | number | null) {
  if (!s) return null;
  if (typeof s === "number") return s;
  const t = Date.parse(s);
  return isNaN(t) ? null : t;
}

function dummy(): { opp: OpportunityDetail; dbg: OpportunityDebug } {
  const net = {
    chain_id: 1,
    name: "Ethereum",
    total_profit_usd: 0,
    total_gas_usd: 0,
  };
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
  const [opp, setOpp] = useState<OpportunityDetail | null>(null);
  const [dbg, setDbg] = useState<OpportunityDebug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenMeta, setTokenMeta] = useState<
    Record<string, { name?: string | null; symbol?: string | null }>
  >({});
  const [networkName, setNetworkName] = useState("");
  const [profitTokenDecimals, setProfitTokenDecimals] = useState<number | null>(
    null,
  );
  const [termOpen, setTermOpen] = useState(false);
  const [termLines, setTermLines] = useState<string[]>([]);
  const [simRunning, setSimRunning] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const termRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/opportunity_debug/${id}`);
        if (!res.ok) throw new Error("api");
        const data = (await res.json()) as ApiResponse;
        const o: any = data.opportunity || {};
        const tokenMap: Record<
          string,
          { name?: string | null; symbol?: string | null }
        > = {};
        data.path_tokens?.forEach((t) => {
          if (t.address)
            tokenMap[t.address.toLowerCase()] = {
              name: t.name ?? null,
              symbol: t.symbol ?? null,
            };
        });
        if (o.profit_token && (o.profit_token_symbol || o.profit_token_name)) {
          tokenMap[o.profit_token.toLowerCase()] = {
            name: o.profit_token_symbol ?? o.profit_token_name ?? null,
            symbol: o.profit_token_symbol ?? null,
          };
        }
        setTokenMeta(tokenMap);

        const createdAt = toMillis(o.created_at) ?? Date.now();
        const updatedAt = toMillis(o.updated_at) ?? createdAt;
        const oppMapped: OpportunityDetail = {
          id: o.id ?? null,
          network_id: o.network_id,
          source_pool: o.source_pool ?? null,
          status: String(o.status || "").toLowerCase(),
          profit_token: o.profit_token,
          profit_usd: typeof o.profit_usd === "number" ? o.profit_usd : null,
          gas_usd: typeof o.gas_usd === "number" ? o.gas_usd : null,
          created_at: createdAt,
          updated_at: updatedAt,
          source_block_number: o.source_block_number ?? null,
          source_block_timestamp: null,
          source_tx: o.source_tx ?? null,
          source_log_index: o.source_log_index ?? null,
          execute_block_number: o.execute_block_number ?? null,
          execute_tx: o.execute_tx ?? null,
          amount: String(o.amount ?? ""),
          profit: typeof o.profit_amount === "string" ? o.profit_amount : null,
          gas_token_amount: o.gas_token_amount ?? null,
        };

        const decimals =
          typeof o.profit_token_decimals === "number"
            ? o.profit_token_decimals
            : 18;
        setProfitTokenDecimals(decimals);
        const estRaw =
          typeof o.estimate_profit === "string" ? o.estimate_profit : null;
        const estTokenAmt = estRaw
          ? (Number(estRaw) / Math.pow(10, decimals)).toPrecision(4) +
            (o.profit_token_symbol ? ` ${o.profit_token_symbol}` : "")
          : null;
        const dbgMapped: OpportunityDebug = {
          id: o.id,
          estimate_profit_usd:
            typeof o.estimate_profit_usd === "number"
              ? o.estimate_profit_usd
              : null,
          estimate_profit_token_amount: estTokenAmt,
          path: Array.isArray(o.path) ? o.path : [],
          received_at: toMillis(o.received_at),
          send_at: toMillis(o.send_at),
          simulation_time:
            typeof o.simulation_time === "number" ? o.simulation_time : null,
          error: o.error ?? null,
          gas_amount: typeof o.gas_amount === "number" ? o.gas_amount : null,
          gas_price: typeof o.gas_price === "number" ? o.gas_price : null,
        };

        setOpp(oppMapped);
        setDbg(dbgMapped);
        setNetworkName(data.network?.name || String(o.network_id));
      } catch (e) {
        const d = dummy();
        setOpp(d.opp);
        setDbg(d.dbg);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSimulate() {
    if (!opp) return;
    setTermOpen(true);
    setSimRunning(true);
    setSimError(null);
    setTermLines((l) => [...l, `$ simulate ${opp.id ?? "<no-id>"}`]);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity: opp, debug: dbg }),
      });
      const text = await res.text();
      let lines: string[] = [];
      try {
        const json = JSON.parse(text);
        if (json && typeof json.trace === "string") {
          lines = json.trace.split(/\r?\n/);
          const meta: string[] = [];
          if (json.gas_used) meta.push(`Gas used: ${json.gas_used}`);
          if (json.block_number) meta.push(`Block: ${json.block_number}`);
          if (json.success != null) meta.push(`Success: ${json.success}`);
          if (json.error) meta.push(`Error: ${json.error}`);
          if (meta.length) lines = [...lines, "", ...meta];
        } else {
          lines = text.split(/\r?\n/);
        }
      } catch {
        lines = text.split(/\r?\n/);
      }
      setTermLines((prev) => [...prev, ...lines]);
    } catch (e: any) {
      setSimError("Simulation request failed");
    } finally {
      setSimRunning(false);
      setTimeout(() => {
        if (termRef.current)
          termRef.current.scrollTop = termRef.current.scrollHeight;
      }, 0);
    }
  }

  return (
    <section aria-label="Debug Insights" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Opportunity Debug Insights
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/opportunities")}>
            Back to Opportunities
          </Button>
          <Button onClick={onSimulate} disabled={simRunning || !opp}>
            {simRunning ? "Running..." : "Simulate"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-md border-2 border-border/60 bg-card" />
      ) : error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : opp ? (
        <>
          <DebugDetails
            opp={opp}
            dbg={dbg}
            networkName={networkName}
            tokenMeta={tokenMeta}
            profitTokenDecimals={profitTokenDecimals ?? 18}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight">
                Simulation Output
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setTermLines([])}
                  disabled={!termLines.length}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTermOpen((v) => !v)}
                >
                  {termOpen ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
            {simError ? (
              <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-xs text-destructive-foreground">
                {simError}
              </div>
            ) : null}
            {termOpen && (
              <div
                ref={termRef}
                className="rounded-md border-2 border-border/60 bg-black/80 text-green-400 font-mono text-xs p-3 h-96 overflow-auto whitespace-pre-wrap"
              >
                {termLines.length === 0 ? (
                  <div className="text-muted-foreground">
                    No output yet. Click Simulate to run.
                  </div>
                ) : (
                  termLines.map((ln, i) => <div key={i}>{ln}</div>)
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">No data</div>
      )}
    </section>
  );
}
