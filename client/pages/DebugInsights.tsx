import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DebugDetails, {
  type OpportunityCombined,
} from "@/components/dashboard/opportunity/DebugDetails";
import type { OpportunityDetailsResponse } from "@shared/api";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";

type ApiResponse = OpportunityDetailsResponse;

function toMillis(s?: string | number | null) {
  if (!s) return null;
  if (typeof s === "number") return s;
  const t = Date.parse(s);
  return isNaN(t) ? null : t;
}

function formatStatus(status: string): string {
  // Convert status to prettier format with proper spacing
  return status
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim(); // Remove leading space
}

async function fetchBlockTimestamp(
  rpcUrl: string,
  blockNumber: number,
): Promise<number | null> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const block = await provider.getBlock(blockNumber);
    return block ? block.timestamp * 1000 : null; // Convert to milliseconds
  } catch (error) {
    console.error(`Error fetching block ${blockNumber}:`, error);
    return null;
  }
}

function dummyCombined(): OpportunityCombined {
  const net = {
    chain_id: 1,
    name: "Ethereum",
    total_profit_usd: 0,
    total_gas_usd: 0,
  };
  const now = Date.now();
  return {
    id: "64f9c7e2a1b2c3d4e5f67890",
    network_id: net.chain_id,
    source_pool: "0xabcDEF1234567890abcDEF12",
    status: "Partially Succeeded",
    profit_token: "0xfeedbeef1234567890abcdef",
    profit_usd: 1234.56,
    gas_usd: 23.45,
    created_at: now - 3600_000,
    updated_at: now,
    source_block_number: 123456789,
    source_block_timestamp: now - 3600_000,
    execute_block_timestamp: now - 3500_000,
    source_tx: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    source_log_index: 42,
    execute_block_number: 123456799,
    execute_tx: "0xfacefacefacefacefacefacefacefacefaceface",
    amount: "123456700000000000000",
    profit: "1234000000000000000",
    gas_token_amount: "12300000000000000",
    estimate_profit_usd: 1500.12,
    estimate_profit_token_amount: "1.567 ETH",
    path: [
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
      "0x3333333333333333333333333333333333333333",
    ],
    simulation_time: 152,
    gas_amount: 210000,
    gas_price: 12_000_000_000,
    error: null,
  };
}

export default function DebugInsights() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<OpportunityCombined | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenMeta, setTokenMeta] = useState<
    Record<string, { name?: string | null; symbol?: string | null }>
  >({});
  const [networkName, setNetworkName] = useState("");
  const [blockExplorer, setBlockExplorer] = useState<string | null>(null);
  const [profitTokenDecimals, setProfitTokenDecimals] = useState<number | null>(
    null,
  );
  const [networkRpc, setNetworkRpc] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/opportunities/${id}`);
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
        const detailMapped: OpportunityCombined = {
          id: o.id ?? null,
          network_id: o.network_id,
          status: formatStatus(String(o.status || "")),
          created_at: createdAt,
          updated_at: updatedAt,
          source_block_timestamp: null,
          source_tx: o.source_tx ?? null,
          source_block_number: o.source_block_number ?? null,
          source_log_index: o.source_log_index ?? null,
          execute_block_number: o.execute_block_number ?? null,
          execute_tx: o.execute_tx ?? null,
          source_pool: o.source_pool ?? null,
          path: Array.isArray(o.path) ? o.path : [],
          profit_token: o.profit_token,
          profit_usd: typeof o.profit_usd === "number" ? o.profit_usd : null,
          gas_usd: typeof o.gas_usd === "number" ? o.gas_usd : null,
          amount: typeof o.amount === "string" ? o.amount : null,
          profit: typeof o.profit_amount === "string" ? o.profit_amount : null,
          gas_token_amount:
            typeof o.gas_token_amount === "string" ? o.gas_token_amount : null,
          estimate_profit_usd:
            typeof o.estimate_profit_usd === "number"
              ? o.estimate_profit_usd
              : null,
          estimate_profit_token_amount: estTokenAmt,
          simulation_time:
            typeof o.simulation_time === "number" ? o.simulation_time : null,
          gas_amount: typeof o.gas_amount === "number" ? o.gas_amount : null,
          gas_price: typeof o.gas_price === "number" ? o.gas_price : null,
          error: o.error ?? null,
        };

        setDetail(detailMapped);
        setNetworkName(data.network?.name || String(o.network_id));

        // Store block explorer for use in links
        setBlockExplorer(data.network?.block_explorer);

        // Store network RPC for block fetching
        setNetworkRpc(data.network?.rpc || null);

        // Fetch block timestamps if RPC is available
        if (data.network?.rpc) {
          const fetchTimestamps = async () => {
            const promises = [];

            // Fetch source block timestamp
            if (o.source_block_number) {
              promises.push(
                fetchBlockTimestamp(
                  data.network.rpc,
                  o.source_block_number,
                ).then((timestamp) => ({ type: "source", timestamp })),
              );
            }

            // Fetch execute block timestamp
            if (o.execute_block_number) {
              promises.push(
                fetchBlockTimestamp(
                  data.network.rpc,
                  o.execute_block_number,
                ).then((timestamp) => ({ type: "execute", timestamp })),
              );
            }

            const results = await Promise.all(promises);

            // Update detail with fetched timestamps
            setDetail((prev) => {
              if (!prev) return prev;
              const updated = { ...prev };

              results.forEach((result) => {
                if (result.timestamp) {
                  if (result.type === "source") {
                    updated.source_block_timestamp = result.timestamp;
                  } else if (result.type === "execute") {
                    updated.execute_block_timestamp = result.timestamp;
                  }
                }
              });

              return updated;
            });
          };

          fetchTimestamps().catch(console.error);
        }
      } catch (e) {
        console.error("Error fetching opportunity details:", e);
        setError("Failed to fetch opportunity details");
        const d = dummyCombined();
        setDetail(d);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
          <Button
            onClick={() =>
              console.log(`Simulate clicked for Opportunity ID: ${id}`)
            }
          >
            Simulate
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-md border-2 border-border/60 bg-card" />
      ) : error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : detail ? (
        <DebugDetails
          detail={detail}
          networkName={networkName}
          tokenMeta={tokenMeta}
          profitTokenDecimals={profitTokenDecimals ?? 18}
          blockExplorer={blockExplorer}
        />
      ) : (
        <div className="text-sm text-muted-foreground">No data</div>
      )}
    </section>
  );
}
