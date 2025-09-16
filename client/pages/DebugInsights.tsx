import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNetworkVisibility } from "@/context/NetworkVisibilityContext";
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

function formatTokenAmount(amount: string, decimals: number): string {
  if (!amount) return "0";

  // Convert the raw amount to a decimal value based on the token's decimals
  const value = BigInt(amount);
  const divisor = BigInt(10) ** BigInt(decimals);

  // Calculate the integer and fractional parts
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  // Format the fractional part to have leading zeros if needed
  let fractionalString = fractionalPart.toString();
  while (fractionalString.length < decimals) {
    fractionalString = "0" + fractionalString;
  }

  // Trim trailing zeros
  fractionalString = fractionalString.replace(/0+$/, "");

  // Return the formatted amount
  return fractionalString
    ? `${integerPart}.${fractionalString}`
    : `${integerPart}`;
}

function formatStatus(status: string): string {
  return status
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

async function fetchBlockTimestamp(
  rpcUrl: string,
  blockNumber: number,
): Promise<number | null> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const block = await provider.getBlock(blockNumber);
    return block ? block.timestamp * 1000 : null;
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
  const { showNetworkInfo } = useNetworkVisibility();
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
  const [termOpen, setTermOpen] = useState(false);
  const [termLines, setTermLines] = useState<string[]>([]);
  const [simRunning, setSimRunning] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const termRef = useRef<HTMLDivElement | null>(null);

  function renderColoredTrace(traceText: string): string {
    const lines = traceText.split("\n");
    const coloredLines: string[] = [];

    // Track call outcomes for coloring
    const callOutcomes = new Map<string, "success" | "failed">();

    // First pass: identify call outcomes
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.includes("← [Return]")) {
        for (let i = coloredLines.length - 1; i >= 0; i--) {
          const prevLine = coloredLines[i];
          if (prevLine.includes("::") && prevLine.includes("[")) {
            callOutcomes.set(prevLine, "success");
            break;
          }
        }
      } else if (
        trimmed.includes("← [Revert]") ||
        trimmed.includes("custom error")
      ) {
        for (let i = coloredLines.length - 1; i >= 0; i--) {
          const prevLine = coloredLines[i];
          if (prevLine.includes("::") && prevLine.includes("[")) {
            callOutcomes.set(prevLine, "failed");
            break;
          }
        }
      }
    });

    // Second pass: color the lines
    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.includes("::") && trimmed.includes("[")) {
        const outcome = callOutcomes.get(line);
        let colorClass = "text-gray-300";
        let fontWeight = "font-normal";

        if (outcome === "success") {
          colorClass = "text-green-400";
          fontWeight = "font-bold";
        } else if (outcome === "failed") {
          colorClass = "text-red-400";
          fontWeight = "font-bold";
        }

        let processedLine = line.replace(
          /(0x[a-fA-F0-9]+)::([a-zA-Z0-9_]+)/g,
          '<span class="text-white font-black">$1::$2</span>',
        );

        processedLine = processedLine.replace(
          /\[(\d+)\]/g,
          '<span class="text-gray-400">[$1]</span>',
        );

        processedLine = processedLine.replace(
          /[├└│]/g,
          '<span class="text-gray-500">$&</span>',
        );

        const contentStart = processedLine.search(/[^├└│\s]/);
        if (contentStart !== -1) {
          const beforeContent = processedLine.substring(0, contentStart);
          const content = processedLine.substring(contentStart);
          coloredLines.push(
            `${beforeContent}<span class="${colorClass}">${content}</span>`,
          );
        } else {
          coloredLines.push(processedLine);
        }
      } else if (trimmed.includes("← [Return]")) {
        let processedLine = line.replace(
          /(0x[a-fA-F0-9]+)::([a-zA-Z0-9_]+)/g,
          '<span class="text-white font-black">$1::$2</span>',
        );

        processedLine = processedLine.replace(
          /[├└│]/g,
          '<span class="text-gray-500">$&</span>',
        );

        const contentStart = processedLine.search(/[^├└│\s]/);
        if (contentStart !== -1) {
          const beforeContent = processedLine.substring(0, contentStart);
          const content = processedLine.substring(contentStart);
          coloredLines.push(
            `${beforeContent}<span class="text-emerald-400">${content}</span>`,
          );
        } else {
          coloredLines.push(processedLine);
        }
      } else if (trimmed.includes("← [Stop]")) {
        let processedLine = line.replace(
          /(0x[a-fA-F0-9]+)::([a-zA-Z0-9_]+)/g,
          '<span class="text-white font-black">$1::$2</span>',
        );

        processedLine = processedLine.replace(
          /[├└│]/g,
          '<span class="text-gray-500">$&</span>',
        );

        const contentStart = processedLine.search(/[^├└│\s]/);
        if (contentStart !== -1) {
          const beforeContent = processedLine.substring(0, contentStart);
          const content = processedLine.substring(contentStart);
          coloredLines.push(
            `${beforeContent}<span class="text-emerald-400">${content}</span>`,
          );
        } else {
          coloredLines.push(processedLine);
        }
      } else if (
        trimmed.includes("← [Revert]") ||
        trimmed.includes("custom error")
      ) {
        let processedLine = line.replace(
          /(0x[a-fA-F0-9]+)::([a-zA-Z0-9_]+)/g,
          '<span class="text-white font-black">$1::$2</span>',
        );

        processedLine = processedLine.replace(
          /[├└│]/g,
          '<span class="text-gray-500">$&</span>',
        );

        const contentStart = processedLine.search(/[^├└│\s]/);
        if (contentStart !== -1) {
          const beforeContent = processedLine.substring(0, contentStart);
          const content = processedLine.substring(contentStart);
          coloredLines.push(
            `${beforeContent}<span class="text-red-300">${content}</span>`,
          );
        } else {
          coloredLines.push(processedLine);
        }
      } else if (trimmed.includes("emit ")) {
        let processedLine = line.replace(
          /(0x[a-fA-F0-9]+)::([a-zA-Z0-9_]+)/g,
          '<span class="text-white font-black">$1::$2</span>',
        );

        processedLine = processedLine.replace(
          /[├└│]/g,
          '<span class="text-gray-500">$&</span>',
        );

        const contentStart = processedLine.search(/[^├└│\s]/);
        if (contentStart !== -1) {
          const beforeContent = processedLine.substring(0, contentStart);
          const content = processedLine.substring(contentStart);
          coloredLines.push(
            `${beforeContent}<span class="text-blue-400">${content}</span>`,
          );
        } else {
          coloredLines.push(processedLine);
        }
      } else if (trimmed.includes("Gas used:") || trimmed.includes("Block:")) {
        let processedLine = line.replace(
          /(0x[a-fA-F0-9]+)::([a-zA-Z0-9_]+)/g,
          '<span class="text-white font-black">$1::$2</span>',
        );

        processedLine = processedLine.replace(
          /[├└│]/g,
          '<span class="text-gray-500">$&</span>',
        );

        const contentStart = processedLine.search(/[^├└│\s]/);
        if (contentStart !== -1) {
          const beforeContent = processedLine.substring(0, contentStart);
          const content = processedLine.substring(contentStart);
          coloredLines.push(
            `${beforeContent}<span class="text-cyan-400 font-semibold">${content}</span>`,
          );
        } else {
          coloredLines.push(processedLine);
        }
      } else if (trimmed.includes("Error:")) {
        let processedLine = line.replace(
          /(0x[a-fA-F0-9]+)::([a-zA-Z0-9_]+)/g,
          '<span class="text-white font-black">$1::$2</span>',
        );

        processedLine = processedLine.replace(
          /[├└│]/g,
          '<span class="text-gray-500">$&</span>',
        );

        const contentStart = processedLine.search(/[^├└│\s]/);
        if (contentStart !== -1) {
          const beforeContent = processedLine.substring(0, contentStart);
          const content = processedLine.substring(contentStart);
          coloredLines.push(
            `${beforeContent}<span class="text-red-400 font-bold">${content}</span>`,
          );
        } else {
          coloredLines.push(processedLine);
        }
      } else if (trimmed.includes("Transaction successfully executed.")) {
        let processedLine = line.replace(
          /(0x[a-fA-F0-9]+)::([a-zA-Z0-9_]+)/g,
          '<span class="text-white font-black">$1::$2</span>',
        );

        processedLine = processedLine.replace(
          /[├└│]/g,
          '<span class="text-gray-500">$&</span>',
        );

        const contentStart = processedLine.search(/[^├└│\s]/);
        if (contentStart !== -1) {
          const beforeContent = processedLine.substring(0, contentStart);
          const content = processedLine.substring(contentStart);
          coloredLines.push(
            `${beforeContent}<span class="text-emerald-400 font-bold">${content}</span>`,
          );
        } else {
          coloredLines.push(processedLine);
        }
      } else {
        let processedLine = line.replace(
          /(0x[a-fA-F0-9]+)::([a-zA-Z0-9_]+)/g,
          '<span class="text-white font-black">$1::$2</span>',
        );

        processedLine = processedLine.replace(
          /[├└│]/g,
          '<span class="text-gray-500">$&</span>',
        );

        coloredLines.push(processedLine);
      }
    });

    return coloredLines.join("\n");
  }

  async function fetchTransactionDetails(
    txHash: string,
  ): Promise<{ from: string; to: string | null }> {
    if (!networkRpc) {
      return {
        from:
          import.meta.env.VITE_DEFAULT_SENDER_ADDRESS ||
          "0x0000000000000000000000000000000000000000",
        to: null,
      };
    }

    try {
      const provider = new ethers.JsonRpcProvider(networkRpc);
      const tx = await provider.getTransaction(txHash);

      if (!tx) {
        throw new Error("Transaction not found");
      }

      return {
        from: tx.from,
        to: tx.to,
      };
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      return {
        from:
          import.meta.env.VITE_DEFAULT_SENDER_ADDRESS ||
          "0x0000000000000000000000000000000000000000",
        to: null,
      };
    }
  }

  async function onSimulate() {
    if (!detail) return;
    setTermOpen(true);
    setSimRunning(true);
    setSimError(null);
    setTermLines((l) => [...l, `$ simulate ${detail.id ?? "<no-id>"}`]);

    try {
      let fromAddress =
        import.meta.env.VITE_DEFAULT_SENDER_ADDRESS ||
        "0x0000000000000000000000000000000000000000";
      let toAddress: string | null = null;

      if (detail.execute_tx) {
        const txDetails = await fetchTransactionDetails(detail.execute_tx);
        fromAddress = txDetails.from;
        toAddress = txDetails.to;
      }

      // Set timestamps to null for the debug server since they're not required
      const opportunityForDebug = {
        ...detail,
        received_at: null,
        send_at: null,
      };

      const requestBody = {
        opportunity: opportunityForDebug,
        block_number: detail.source_block_number?.toString() || "latest",
        from_address: fromAddress,
        to: toAddress,
      };

      const res = await fetch("/api/v1/debug/opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const text = await res.text();
      let lines: string[] = [];
      let revenue: string | null = null;
      // Use a default receiver address if the env variable is not set
      const receiverAddress = (
        import.meta.env.VITE_RECEIVER_ADDRESS ||
        "0xF90E54B26866edBffedAaAC63587163c0305fff7"
      ).toLowerCase();

      try {
        const json = JSON.parse(text);
        if (json && typeof json.trace === "string") {
          const coloredTrace = renderColoredTrace(json.trace);
          const meta: string[] = [];
          if (json.block_number) meta.push(`Block: ${json.block_number}`);
          if (json.error) meta.push(`Error: ${json.error}`);

          // Check for Transfer event with matching receiver address
          const traceLines = json.trace.split("\n");
          for (const line of traceLines) {
            const trimmed = line.trim();
            if (trimmed.includes("emit Transfer")) {
              // Updated regex to handle optional spaces and scientific notation
              const match = trimmed.match(
                /emit\s+Transfer\s*\(\s*param0:\s*(0x[a-fA-F0-9]{40})\s*,\s*param1:\s*(0x[a-fA-F0-9]{40})\s*,\s*param2:\s*(\d+)(?:\s*\[[\d.e-]+\])?\s*\)/,
              );
              if (match) {
                if (
                  match[2] &&
                  receiverAddress &&
                  match[2].toLowerCase() === receiverAddress
                ) {
                  revenue = match[3]; // Extract the amount as revenue
                  break;
                }
              }
            }
          }

          // Append revenue or "Invalid opportunity"
          if (revenue) {
            // Apply token decimals (default to 18 if not available)
            const decimals = profitTokenDecimals ?? 18;
            const formattedRevenue = formatTokenAmount(revenue, decimals);

            // Get token symbol if available
            const profitToken = detail?.profit_token?.toLowerCase() || "";
            const tokenSymbol =
              (profitToken && tokenMeta[profitToken]?.symbol) || "tokens";

            meta.push(
              `Revenue: ${formattedRevenue} ${tokenSymbol} (${revenue} raw)`,
            );
          } else {
            meta.push("Invalid opportunity");
          }

          const coloredMeta = meta
            .map((line) => {
              if (line.includes("Gas used:"))
                return `<span class="text-cyan-400 font-semibold">${line}</span>`;
              if (line.includes("Block:"))
                return `<span class="text-cyan-400 font-semibold">${line}</span>`;
              if (line.includes("Error:"))
                return `<span class="text-red-400 font-bold">${line}</span>`;
              if (line.includes("Success:"))
                return `<span class="text-green-400 font-bold">${line}</span>`;
              if (line.includes("Revenue:"))
                return `<span class="text-green-400 font-bold">${line}</span>`;
              if (line.includes("Invalid opportunity"))
                return `<span class="text-red-400 font-bold">${line}</span>`;
              return `<span class="text-gray-400">${line}</span>`;
            })
            .join("\n");

          setTermLines((prev) => [...prev, coloredTrace, coloredMeta]);
        } else {
          lines = text.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes("emit Transfer")) {
              const match = trimmed.match(
                /emit\s+Transfer\s*\(\s*param0:\s*(0x[a-fA-F0-9]{40})\s*,\s*param1:\s*(0x[a-fA-F0-9]{40})\s*,\s*param2:\s*(\d+)(?:\s*\[[\d.e-]+\])?\s*\)/,
              );
              if (match) {
                if (
                  match[2] &&
                  receiverAddress &&
                  match[2].toLowerCase() === receiverAddress
                ) {
                  revenue = match[3];
                  break;
                }
              }
            }
          }
          if (revenue) {
            // Apply token decimals (default to 18 if not available)
            const decimals = profitTokenDecimals ?? 18;
            const formattedRevenue = formatTokenAmount(revenue, decimals);

            // Get token symbol if available
            const profitToken = detail?.profit_token?.toLowerCase() || "";
            const tokenSymbol =
              (profitToken && tokenMeta[profitToken]?.symbol) || "tokens";

            lines.push(
              `Revenue: ${formattedRevenue} ${tokenSymbol} (${revenue} raw)`,
            );
          } else {
            lines.push("Invalid opportunity");
          }
          setTermLines((prev) => [...prev, ...lines]);
        }
      } catch {
        lines = text.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.includes("emit Transfer")) {
            const match = trimmed.match(
              /emit\s+Transfer\s*\(\s*param0:\s*(0x[a-fA-F0-9]{40})\s*,\s*param1:\s*(0x[a-fA-F0-9]{40})\s*,\s*param2:\s*(\d+)(?:\s*\[[\d.e-]+\])?\s*\)/,
            );
            if (match) {
              if (
                match[2] &&
                receiverAddress &&
                match[2].toLowerCase() === receiverAddress
              ) {
                revenue = match[3];
                break;
              }
            }
          }
        }
        if (revenue) {
          // Apply token decimals (default to 18 if not available)
          const decimals = profitTokenDecimals ?? 18;
          const formattedRevenue = formatTokenAmount(revenue, decimals);

          // Get token symbol if available
          const profitToken = detail?.profit_token?.toLowerCase() || "";
          const tokenSymbol =
            (profitToken && tokenMeta[profitToken]?.symbol) || "tokens";

          lines.push(
            `Revenue: ${formattedRevenue} ${tokenSymbol} (${revenue} raw)`,
          );
        } else {
          lines.push("Invalid opportunity");
        }
        setTermLines((prev) => [...prev, ...lines]);
      }
    } catch (e: any) {
      setSimError("Simulation request failed");
      setTermLines((prev) => [
        ...prev,
        `Error: ${e.message || "Simulation failed"}`,
      ]);
    } finally {
      setSimRunning(false);
      setTimeout(() => {
        if (termRef.current)
          termRef.current.scrollTop = termRef.current.scrollHeight;
      }, 0);
    }
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const isTxHash = id.startsWith("0x") && id.length === 66;
        const apiUrl = isTxHash
          ? `/api/v1/opportunities/tx/${id}`
          : `/api/v1/opportunities/${id}`;

        const res = await fetch(apiUrl);
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
          received_at: o.received_at ?? null,
          send_at: o.send_at ?? null,
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
          estimate_profit: estRaw,
          simulation_time:
            typeof o.simulation_time === "number" ? o.simulation_time : null,
          gas_amount: typeof o.gas_amount === "number" ? o.gas_amount : null,
          gas_price: typeof o.gas_price === "number" ? o.gas_price : null,
          error: o.error ?? null,
        };

        setDetail(detailMapped);
        setNetworkName(data.network?.name || String(o.network_id));
        setBlockExplorer(data.network?.block_explorer);
        setNetworkRpc(data.network?.rpc || null);

        if (data.network?.rpc) {
          const fetchTimestamps = async () => {
            const promises = [];

            if (o.source_block_number) {
              promises.push(
                fetchBlockTimestamp(
                  data.network.rpc,
                  o.source_block_number,
                ).then((timestamp) => ({ type: "source", timestamp })),
              );
            }

            if (o.execute_block_number) {
              promises.push(
                fetchBlockTimestamp(
                  data.network.rpc,
                  o.execute_block_number,
                ).then((timestamp) => ({ type: "execute", timestamp })),
              );
            }

            const results = await Promise.all(promises);

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
          {showNetworkInfo
            ? `Opportunity Debug Insights${networkName ? ` - ${networkName}` : ""}`
            : "Opportunity Debug Insights"}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/opportunities")}>
            Back to Opportunities
          </Button>
          <Button onClick={onSimulate} disabled={simRunning || !detail}>
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
      ) : detail ? (
        <>
          {(termLines.length > 0 || simRunning || simError) && (
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
                  className="rounded-md border-2 border-border/60 bg-muted text-foreground font-mono text-xs p-3 h-96 overflow-auto whitespace-pre-wrap break-words break-all"
                >
                  {simRunning ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
                      <span>Running simulation...</span>
                    </div>
                  ) : termLines.length === 0 ? (
                    <div className="text-muted-foreground">
                      No output yet. Click Simulate to run.
                    </div>
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: termLines.join(""),
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <DebugDetails
            detail={detail}
            networkName={showNetworkInfo ? networkName : "****"}
            tokenMeta={showNetworkInfo ? tokenMeta : {}}
            profitTokenDecimals={profitTokenDecimals ?? 18}
            blockExplorer={showNetworkInfo ? blockExplorer : null}
          />
        </>
      ) : (
        <div className="text-sm text-muted-foreground">No data</div>
      )}
    </section>
  );
}
