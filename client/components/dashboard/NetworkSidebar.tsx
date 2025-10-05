import React from "react";
import { Network } from "@shared/api";

export default function NetworkSidebar({
  networks,
  selected,
  onSelect,
  statusFilter = "all",
  onStatusFilterChange,
  profitSizeFilter = "all",
  onProfitSizeFilterChange,
}: {
  networks: { chain_id: number; name: string }[];
  selected: number | "all";
  onSelect: (id: number | "all") => void;
  statusFilter?: "all" | "profitable";
  onStatusFilterChange?: (status: "all" | "profitable") => void;
  profitSizeFilter?: "all" | "big";
  onProfitSizeFilterChange?: (size: "all" | "big") => void;
}) {
  return (
    <nav
      aria-label="Networks"
      className="rounded-md border border-border/60 bg-card p-2 shadow-sm flex flex-col h-[calc(100vh-170px)]"
    >
      {/* Status Filter */}
      <div className="mb-2">
        <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status Filter
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => onStatusFilterChange?.("all")}
            className={`rounded-sm px-2 py-1 text-xs transition-colors hover:bg-accent/10 ${statusFilter === "all" ? "bg-accent/20 text-foreground" : "text-foreground"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange?.("profitable")}
            className={`rounded-sm px-2 py-1 text-xs transition-colors hover:bg-accent/10 ${statusFilter === "profitable" ? "bg-accent/20 text-foreground" : "text-foreground"}`}
          >
            Profitable
          </button>
        </div>
      </div>

      {/* Profit Size Filter */}
      <div className="mb-2">
        <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Estimated Profit
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => onProfitSizeFilterChange?.("all")}
            className={`rounded-sm px-2 py-1 text-xs transition-colors hover:bg-accent/10 ${profitSizeFilter === "all" ? "bg-accent/20 text-foreground" : "text-foreground"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onProfitSizeFilterChange?.("big")}
            className={`rounded-sm px-2 py-1 text-xs transition-colors hover:bg-accent/10 ${profitSizeFilter === "big" ? "bg-accent/20 text-foreground" : "text-foreground"}`}
          >
            Est. {">"}$2
          </button>
        </div>
      </div>

      <div className="border-t border-border/60 pt-2 mb-1">
        <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Networks
        </div>
      </div>
      <ul className="space-y-1 overflow-y-auto pr-1 flex-1">
        <li>
          <button
            type="button"
            onClick={() => onSelect("all")}
            className={`w-full rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent/10 ${selected === "all" ? "bg-accent/20 text-foreground" : "text-foreground"}`}
          >
            All Networks
          </button>
        </li>
        {[...networks]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((n) => {
            const active = selected === n.chain_id;
            return (
              <li key={n.chain_id}>
                <button
                  type="button"
                  onClick={() => onSelect(n.chain_id)}
                  className={`w-full rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent/10 ${active ? "bg-accent/20 text-foreground" : "text-foreground"}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{n.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {n.chain_id}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        {networks.length === 0 && (
          <li className="px-2 py-1 text-xs text-muted-foreground">
            No networks
          </li>
        )}
      </ul>
    </nav>
  );
}
