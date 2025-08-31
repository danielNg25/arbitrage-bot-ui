import React from "react";
import { Button } from "@/components/ui/button";
import { OpportunityStatus, getStatusDisplayName } from "@shared/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StatusFilter = "all" | OpportunityStatus | "Profitable";

export default function FilterControls({
  status,
  networkId,
  networks,
  profitMin,
  profitMax,
  onChange,
  onClear,
}: {
  status: StatusFilter;
  networkId: number | "all";
  networks: { chain_id: number; name: string }[];
  profitMin: number | "";
  profitMax: number | "";
  onChange: (v: {
    status?: StatusFilter;
    networkId?: number | "all";
    profitMin?: number | "";
    profitMax?: number | "";
  }) => void;
  onClear: () => void;
}) {
  const allStatuses: OpportunityStatus[] = [
    "Succeeded",
    "PartiallySucceeded",
    "Reverted",
    "Error",
    "Skipped",
    "None",
  ];

  const handleStatusChange = (value: string) => {
    onChange({ status: value as StatusFilter });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-muted-foreground">Status</label>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Profitable">Profitable (profit &gt; 0)</SelectItem>
            {allStatuses.map((statusOption) => (
              <SelectItem key={statusOption} value={statusOption}>
                {getStatusDisplayName(statusOption)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-muted-foreground">Network</label>
        <select
          className="h-10 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
          value={networkId}
          onChange={(e) =>
            onChange({
              networkId:
                e.target.value === "all" ? "all" : Number(e.target.value),
            })
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
        <label className="mb-1 text-xs text-muted-foreground">
          Net Profit (USD)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Min"
            className="h-10 w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
            value={profitMin}
            onChange={(e) =>
              onChange({
                profitMin: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Max"
            className="h-10 w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
            value={profitMax}
            onChange={(e) =>
              onChange({
                profitMax: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
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
