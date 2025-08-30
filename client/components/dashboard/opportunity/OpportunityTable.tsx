import React from "react";
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";

export type OpportunityRow = {
  id?: string;
  network_id: number;
  status: "pending" | "executed" | "failed" | string;
  profit_token: string;
  profit_usd: number | null;
  gas_usd: number | null;
  created_at: number; // unix ms
  updated_at: number; // unix ms
};

export type SortKey = "profit_usd" | "gas_usd" | "created_at";
export type SortDir = "asc" | "desc";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function shorten(addr: string) {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function StatusBadge({ status }: { status: OpportunityRow["status"] }) {
  const cls =
    status === "executed"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : status === "pending"
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : "bg-rose-500/15 text-rose-400 border-rose-500/30";
  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
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
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-muted/10 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Network ID</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Profit Token</th>
              <th className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={() => onSortChange("profit_usd")}
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                >
                  Profit (USD)
                  <SortIcon active={sortKey === "profit_usd"} dir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={() => onSortChange("gas_usd")}
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                >
                  Gas (USD)
                  <SortIcon active={sortKey === "gas_usd"} dir={sortDir} />
                </button>
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
              <th className="px-4 py-3 text-left font-semibold">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={`${r.network_id}-${r.created_at}-${idx}`}
                className="border-t border-border/60 hover:bg-accent/10 cursor-pointer"
                onClick={() => onRowClick?.(r)}
                role={onRowClick ? "button" : undefined}
              >
                <td className="px-4 py-3 align-top">{r.network_id}</td>
                <td className="px-4 py-3 align-top"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 align-top font-mono">{shorten(r.profit_token)}</td>
                <td className="px-4 py-3 align-top font-mono tabular-nums">
                  {r.profit_usd == null ? "N/A" : currency.format(r.profit_usd)}
                </td>
                <td className="px-4 py-3 align-top font-mono tabular-nums">
                  {r.gas_usd == null ? "N/A" : currency.format(r.gas_usd)}
                </td>
                <td className="px-4 py-3 align-top">
                  {new Date(r.created_at).toISOString().replace("T", " ").split(".")[0]}
                </td>
                <td className="px-4 py-3 align-top">
                  {new Date(r.updated_at).toISOString().replace("T", " ").split(".")[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
