import React, { useState } from "react";
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { getStatusDisplayName } from "@shared/api";

export type OpportunityRow = {
  id?: string;
  network_id: number;
  network_name: string; // Add network name for display
  status: "pending" | "executed" | "failed" | string;
  profit_token: string;
  profit_token_symbol: string | null; // Add profit token symbol
  profit_usd: number | null;
  gas_usd: number | null;
  estimate_profit_usd: number | null; // Estimated profit before execution
  created_at: number; // Unix timestamp for sorting
  source_block_number: number | null; // Add source block number
};

export type SortKey = "profit_usd" | "created_at";
export type SortDir = "asc" | "desc";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

// Format GMT timestamp to local time for display
function formatLocalTimestamp(gmtTimestamp: string | number): string {
  try {
    const date = new Date(gmtTimestamp);
    // Format as local time: YYYY-MM-DD HH:MM:SS
    return date
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid Date";
  }
}

// Dynamic currency formatter for small amounts
function formatCurrencyWithPrecision(amount: number): string {
  const absAmount = Math.abs(amount);

  if (absAmount >= 0.01) {
    // For amounts >= $0.01, use 2 decimal places
    return currency.format(amount);
  } else if (absAmount >= 0.001) {
    // For amounts >= $0.001, use 3 decimal places
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  } else if (absAmount > 0) {
    // For amounts smaller than $0.001, show "--" to indicate not worth showing
    return "--";
  } else {
    // For zero or negative amounts, use standard formatting
    return currency.format(amount);
  }
}

function shorten(addr: string) {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function StatusBadge({ status }: { status: OpportunityRow["status"] }) {
  const cls =
    status === "Succeeded" || status === "PartiallySucceeded"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : status === "Skipped"
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : status === "Reverted" || status === "Error"
          ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
          : "bg-gray-500/15 text-gray-400 border-gray-500/30";
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {getStatusDisplayName(status as any) || status}
    </span>
  );
}

export default function OpportunityTable({
  rows,
  sortKey,
  sortDir,
  onSortChange,
  onRowClick,
}: {
  rows: OpportunityRow[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSortChange: (key: SortKey) => void;
  onRowClick?: (row: OpportunityRow) => void;
}) {
  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return dir === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  return (
    <div className="rounded-md border-2 border-border/60 bg-card shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-muted/10 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Network</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Token</th>
              <th className="px-4 py-3 text-left font-semibold">
                Estimated Revenue (USD)
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={() => onSortChange("profit_usd")}
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                >
                  Net Profit (USD)
                  <SortIcon active={sortKey === "profit_usd"} dir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                Source Block
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={() => onSortChange("created_at")}
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                >
                  Created At
                  <SortIcon active={sortKey === "created_at"} dir={sortDir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const opportunityUrl = `/opportunities/${r.id || String(r.created_at)}`;
              return (
                <tr
                  key={`${r.network_id}-${r.created_at}-${idx}`}
                  className="border-t border-border/60 hover:bg-accent/10 cursor-pointer group"
                  onClick={() => onRowClick?.(r)}
                >
                  <td className="px-4 py-3 align-top">
                    <a
                      href={opportunityUrl}
                      className="block"
                      aria-label={`View details for opportunity ${r.network_name} ${r.profit_token_symbol || r.profit_token}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onRowClick?.(r);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                        <div>
                          <div className="font-medium">
                            {r.network_name
                              ? r.network_name.charAt(0).toUpperCase() +
                                r.network_name.slice(1)
                              : ""}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {r.network_id}
                          </div>
                        </div>
                      </div>
                    </a>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div>
                      <div className="font-medium">
                        {r.profit_token_symbol || "N/A"}
                      </div>
                      {!r.profit_token_symbol && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {shorten(r.profit_token)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top font-mono tabular-nums">
                    {r.estimate_profit_usd == null
                      ? "N/A"
                      : formatCurrencyWithPrecision(r.estimate_profit_usd)}
                  </td>
                  <td className="px-4 py-3 align-top font-mono tabular-nums">
                    {r.profit_usd == null || r.gas_usd == null
                      ? "N/A"
                      : formatCurrencyWithPrecision(r.profit_usd - r.gas_usd)}
                  </td>
                  <td className="px-4 py-3 align-top font-mono tabular-nums">
                    {r.source_block_number || "N/A"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {formatLocalTimestamp(r.created_at * 1000)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
