import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { OpportunityStatus, getStatusDisplayName } from "@shared/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  MoreHorizontal,
  Plus,
  Minus,
} from "lucide-react";

export type StatusFilter = "all" | OpportunityStatus | "Profitable";

export default function FilterControls({
  status,
  networkId,
  networks,
  profitMin,
  profitMax,
  estimateProfitMin,
  estimateProfitMax,
  timestampFrom,
  timestampTo,
  onChange,
  onClear,
  onApply,
}: {
  status: StatusFilter;
  networkId: number | "all";
  networks: { chain_id: number; name: string }[];
  profitMin: number | "";
  profitMax: number | "";
  estimateProfitMin: number | "";
  estimateProfitMax: number | "";
  timestampFrom: string;
  timestampTo: string;
  onChange: (v: {
    status?: StatusFilter;
    networkId?: number | "all";
    profitMin?: number | "";
    profitMax?: number | "";
    estimateProfitMin?: number | "";
    estimateProfitMax?: number | "";
    timestampFrom?: string;
    timestampTo?: string;
  }) => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const [showProfitMax, setShowProfitMax] = useState(false);
  const [showEstimateMax, setShowEstimateMax] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap">
      {/* Basic filters - always visible */}
      <div className="flex flex-col min-w-0">
        <label className="mb-1 text-xs text-muted-foreground">Status</label>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-48">
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
      <div className="flex flex-col min-w-0">
        <label className="mb-1 text-xs text-muted-foreground">Network</label>
        <select
          className="h-10 w-full sm:w-48 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
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

      {/* Advanced filters - hidden on mobile by default */}
      <div
        className={`flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap ${showAdvancedFilters ? "flex" : "hidden sm:flex"}`}
      >
        <div className="flex flex-col min-w-0">
          <label className="mb-1 text-xs text-muted-foreground">
            Net Profit (USD)
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Min"
              className="h-10 w-24 sm:w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
              value={profitMin}
              onChange={(e) =>
                onChange({
                  profitMin:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowProfitMax(!showProfitMax)}
              className="h-10 w-8 p-0 hover:bg-accent flex items-center justify-center"
              aria-label={showProfitMax ? "Hide max field" : "Show max field"}
            >
              {showProfitMax ? (
                <Minus className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
            {showProfitMax && (
              <>
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Max"
                  className="h-10 w-24 sm:w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
                  value={profitMax}
                  onChange={(e) =>
                    onChange({
                      profitMax:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <label className="mb-1 text-xs text-muted-foreground">
            Estimated Profit (USD)
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Min"
              className="h-10 w-24 sm:w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
              value={estimateProfitMin}
              onChange={(e) =>
                onChange({
                  estimateProfitMin:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowEstimateMax(!showEstimateMax)}
              className="h-10 w-8 p-0 hover:bg-accent flex items-center justify-center"
              aria-label={showEstimateMax ? "Hide max field" : "Show max field"}
            >
              {showEstimateMax ? (
                <Minus className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
            {showEstimateMax && (
              <>
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Max"
                  className="h-10 w-24 sm:w-28 rounded-md border-2 border-border/60 bg-background px-3 text-sm"
                  value={estimateProfitMax}
                  onChange={(e) =>
                    onChange({
                      estimateProfitMax:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </>
            )}
          </div>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3 flex items-center gap-2"
            >
              <Calendar size={16} />
              Date Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-6" align="end">
            <div className="space-y-6">
              <h4 className="font-medium text-sm">Date Range Filter</h4>

              {/* Date Range Filter */}
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground font-medium">
                  Select Date Range
                </label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      From
                    </label>
                    <div className="relative">
                      <input
                        id="datetime-from-popup"
                        type="datetime-local"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={convertUnixToDatetimeLocal(timestampFrom)}
                        onChange={(e) => {
                          const unixTimestamp = convertToUnixTimestamp(
                            e.target.value,
                          );
                          onChange({ timestampFrom: unixTimestamp });
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded border border-input bg-background hover:bg-accent flex items-center justify-center"
                        onClick={() => {
                          const input = document.getElementById(
                            "datetime-from-popup",
                          ) as HTMLInputElement;
                          if (input) input.showPicker();
                        }}
                      >
                        <Calendar size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">To</label>
                    <div className="relative">
                      <input
                        id="datetime-to-popup"
                        type="datetime-local"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={convertUnixToDatetimeLocal(timestampTo)}
                        onChange={(e) => {
                          const unixTimestamp = convertToUnixTimestamp(
                            e.target.value,
                          );
                          onChange({ timestampTo: unixTimestamp });
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded border border-input bg-background hover:bg-accent flex items-center justify-center"
                        onClick={() => {
                          const input = document.getElementById(
                            "datetime-to-popup",
                          ) as HTMLInputElement;
                          if (input) input.showPicker();
                        }}
                      >
                        <Calendar size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Action buttons - always visible */}
      <div className="flex gap-2 flex-wrap">
        {/* Mobile: More filters toggle */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="h-10 px-3 flex items-center gap-2 sm:hidden flex-shrink-0"
        >
          {showAdvancedFilters ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {showAdvancedFilters ? "Hide" : "More"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onClear();
            setShowProfitMax(false);
            setShowEstimateMax(false);
            setShowAdvancedFilters(false);
          }}
          className="flex-shrink-0"
        >
          Clear
        </Button>
        <Button type="button" onClick={onApply} className="flex-shrink-0">
          Apply
        </Button>
      </div>
    </div>
  );
}
