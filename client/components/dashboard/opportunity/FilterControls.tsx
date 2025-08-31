import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OpportunityStatus, getStatusDisplayName } from "@shared/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusFilter = "all" | OpportunityStatus[];

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

  const handleStatusChange = (
    selectedStatus: OpportunityStatus,
    checked: boolean,
  ) => {
    if (status === "all") {
      // If currently "all", start with empty array and add the selected status
      onChange({ status: checked ? [selectedStatus] : [] });
    } else if (Array.isArray(status)) {
      if (checked) {
        // Add status to existing array
        onChange({ status: [...status, selectedStatus] });
      } else {
        // Remove status from existing array
        const newStatuses = status.filter((s) => s !== selectedStatus);
        onChange({ status: newStatuses.length > 0 ? newStatuses : "all" });
      }
    }
  };

  const isStatusSelected = (selectedStatus: OpportunityStatus): boolean => {
    if (status === "all") return false;
    if (Array.isArray(status)) return status.includes(selectedStatus);
    return false;
  };

  const getSelectedCount = (): number => {
    if (status === "all") return 0;
    if (Array.isArray(status)) return status.length;
    return 0;
  };

  const getStatusDisplayText = (): string => {
    if (status === "all") return "All Statuses";
    if (Array.isArray(status) && status.length > 0) {
      if (status.length === 1) {
        return getStatusDisplayName(status[0]);
      }
      return `${status.length} statuses selected`;
    }
    return "All Statuses";
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-muted-foreground">Status</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-48 justify-between",
                getSelectedCount() > 0 && "border-primary bg-primary/5",
              )}
            >
              <span className="truncate">{getStatusDisplayText()}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="start">
            <div className="p-2">
              <div className="flex items-center justify-between p-2">
                <span className="text-sm font-medium">Select Statuses</span>
                {getSelectedCount() > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({ status: "all" })}
                    className="h-6 px-2 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {allStatuses.map((statusOption) => (
                  <div
                    key={statusOption}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
                  >
                    <Checkbox
                      id={statusOption}
                      checked={isStatusSelected(statusOption)}
                      onCheckedChange={(checked) =>
                        handleStatusChange(statusOption, checked as boolean)
                      }
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor={statusOption}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {getStatusDisplayName(statusOption)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
