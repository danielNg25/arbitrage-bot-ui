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
        "group rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <div className="flex items-start justify-between p-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            {network.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chain ID: {network.chain_id}
          </p>
        </div>
        <div className="inline-flex items-center rounded-md bg-accent/60 px-2 py-1 text-xs font-medium text-accent-foreground">
          Executed: {executedCount}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t p-5 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Total Profit
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">
            {currency.format(network.total_profit_usd)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Total Gas
          </p>
          <p className="mt-1 text-lg font-semibold text-rose-600">
            {currency.format(network.total_gas_usd)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NetworkCard;
