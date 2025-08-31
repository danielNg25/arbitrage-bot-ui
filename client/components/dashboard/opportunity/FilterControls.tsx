import React from "react";
import { Button } from "@/components/ui/button";

export type StatusFilter = "all" | "pending" | "executed" | "failed";

export default function FilterControls({
  status,
  networkId,
  networks,
  profitMin,
  profitMax,
  gasMin,
  gasMax,
  onChange,
  onClear,
}: {
  status: StatusFilter;
  networkId: number | "all";
  networks: { chain_id: number; name: string }[];
  profitMin: number | "";
  profitMax: number | "";
  gasMin: number | "";
  gasMax: number | "";
  onChange: (v: { status?: StatusFilter; networkId?: number | "all"; profitMin?: number | ""; profitMax?: number | ""; gasMin?: number | ""; gasMax?: number | "" }) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-muted-foreground">Status</label>
        <select
          className="h-10 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
          value={status}
          onChange={(e) => onChange({ status: e.target.value as StatusFilter })}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="executed">Executed</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-muted-foreground">Network</label>
        <select
          className="h-10 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
          value={networkId}
          onChange={(e) =>
            onChange({ networkId: e.target.value === "all" ? "all" : Number(e.target.value) })
          }
        >
          <option value="all">All Networks</option>
          {networks.map((n) => (
            <option key={n.chain_id} value={n.chain_id}>
              {n.name} ({n.chain_id})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-muted-foreground">Profit (USD)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Min"
            className="h-10 w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
            value={profitMin}
            onChange={(e) => onChange({ profitMin: e.target.value === "" ? "" : Number(e.target.value) })}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Max"
            className="h-10 w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
            value={profitMax}
            onChange={(e) => onChange({ profitMax: e.target.value === "" ? "" : Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-muted-foreground">Gas (USD)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Min"
            className="h-10 w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
            value={gasMin}
            onChange={(e) => onChange({ gasMin: e.target.value === "" ? "" : Number(e.target.value) })}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Max"
            className="h-10 w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
            value={gasMax}
            onChange={(e) => onChange({ gasMax: e.target.value === "" ? "" : Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClear}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
