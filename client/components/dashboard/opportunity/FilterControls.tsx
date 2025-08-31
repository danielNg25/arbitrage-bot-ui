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
  timestampFrom,
  timestampTo,
  onChange,
  onClear,
}: {
  status: StatusFilter;
  networkId: number | "all";
  networks: { chain_id: number; name: string }[];
  profitMin: number | "";
  profitMax: number | "";
  timestampFrom: string;
  timestampTo: string;
  onChange: (v: {
    status?: StatusFilter;
    networkId?: number | "all";
    profitMin?: number | "";
    profitMax?: number | "";
    timestampFrom?: string;
    timestampTo?: string;
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

  // Helper function to convert datetime-local to Unix timestamp
  const convertToUnixTimestamp = (datetimeLocal: string): string => {
    if (!datetimeLocal) return "";
    try {
      const date = new Date(datetimeLocal);
      return Math.floor(date.getTime() / 1000).toString();
    } catch (error) {
      console.error("Error converting to Unix timestamp:", error);
      return "";
    }
  };

  // Helper function to convert Unix timestamp to datetime-local format
  const convertUnixToDatetimeLocal = (unixTimestamp: string): string => {
    if (!unixTimestamp) return "";
    try {
      const date = new Date(parseInt(unixTimestamp) * 1000);
      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error(
        "Error converting Unix timestamp to datetime-local:",
        error,
      );
      return "";
    }
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
            <SelectItem value="Profitable">
              Profitable (profit &gt; 0)
            </SelectItem>
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
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-muted-foreground">Created At</label>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              id="datetime-from"
              type="datetime-local"
              className="h-10 w-41 rounded-l-md border-2 border-r-0 border-primary/50 bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={convertUnixToDatetimeLocal(timestampFrom)}
              onChange={(e) => {
                const unixTimestamp = convertToUnixTimestamp(e.target.value);
                onChange({ timestampFrom: unixTimestamp });
              }}
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-10 w-10 rounded-r-md border-2 border-l-0 border-primary/50 bg-primary/10 hover:bg-primary/20 flex items-center justify-center"
              onClick={() => {
                const input = document.getElementById(
                  "datetime-from",
                ) as HTMLInputElement;
                if (input) input.showPicker();
              }}
            >
              📅
            </button>
          </div>
          <span className="text-xs text-muted-foreground">to</span>
          <div className="relative">
            <input
              id="datetime-to"
              type="datetime-local"
              className="h-10 w-41 rounded-l-md border-2 border-r-0 border-primary/50 bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={convertUnixToDatetimeLocal(timestampTo)}
              onChange={(e) => {
                const unixTimestamp = convertToUnixTimestamp(e.target.value);
                onChange({ timestampTo: unixTimestamp });
              }}
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-10 w-10 rounded-r-md border-2 border-l-0 border-primary/50 bg-primary/10 hover:bg-primary/20 flex items-center justify-center"
              onClick={() => {
                const input = document.getElementById(
                  "datetime-to",
                ) as HTMLInputElement;
                if (input) input.showPicker();
              }}
            >
              📅
            </button>
          </div>
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
