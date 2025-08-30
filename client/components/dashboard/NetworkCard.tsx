import React from "react";
import { cn } from "@/lib/utils";

export type Network = {
  chain_id: number;
  name: string;
  total_profit_usd: number;
  total_gas_usd: number;
  created_at?: number;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function NetworkCard({
  network,
  executedCount,
  className,
}: {
  network: Network;
  executedCount: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group rounded-md border-2 border-border/60 bg-card text-card-foreground shadow-md transition-all hover:border-primary/50 hover:shadow-lg",
        className,
      )}
    >
      <div className="flex items-start justify-between p-6 border-b border-border/60">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            {network.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chain ID: {network.chain_id}
          </p>
        </div>
        <div className="inline-flex items-center rounded-sm bg-primary/15 px-2 py-1 text-xs font-medium text-primary-foreground">
          Executed: {executedCount}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Total Profit
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">
            {currency.format(network.total_profit_usd)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Total Gas
          </p>
          <p className="mt-1 text-xl font-semibold text-rose-400">
            {currency.format(network.total_gas_usd)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NetworkCard;
