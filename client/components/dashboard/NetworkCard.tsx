import React from "react";
import { cn } from "@/lib/utils";
import { Network } from "@shared/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

export function NetworkCard({
  network,
  className,
}: {
  network: Network;
  className?: string;
}) {
  const successCount = network.success ?? 0;
  const failedCount = network.failed ?? 0;
  const executedCount = network.executed ?? 0;
  const successRate = network.success_rate ?? 0;

  return (
    <div
      className={cn(
        "group rounded-md border-2 border-border/60 bg-card text-card-foreground shadow-md transition-all hover:border-primary/50 hover:shadow-lg",
        className,
      )}
    >
      <div className="flex items-start justify-between p-6 border-b border-border/60">
        <div>
          <h3 className="text-lg font-semibold tracking-tight capitalize">
            {network.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chain ID: {network.chain_id}
          </p>
        </div>
        <div className="inline-flex items-center rounded-sm border border-primary/40 bg-primary/20 px-2.5 py-1 text-[11px] font-medium text-primary">
          Executed: {executedCount}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-3 p-6 md:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Total Profit
          </p>
          <p className="mt-1 text-lg md:text-xl font-semibold leading-none font-mono tabular-nums text-emerald-400">
            {currency.format(network.total_profit_usd)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Total Gas
          </p>
          <p className="mt-1 text-lg md:text-xl font-semibold leading-none font-mono tabular-nums text-rose-400">
            {currency.format(network.total_gas_usd)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Success Tx
          </p>
          <p className="mt-1 text-lg md:text-xl font-semibold leading-none font-mono tabular-nums text-emerald-400">
            {successCount}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Failed Tx
          </p>
          <p className="mt-1 text-lg md:text-xl font-semibold leading-none font-mono tabular-nums text-rose-400">
            {failedCount}
          </p>
        </div>
        {successRate > 0 && (
          <div className="md:col-span-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Success Rate
            </p>
            <p className="mt-1 text-lg font-semibold leading-none font-mono tabular-nums text-blue-400">
              {(successRate * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {network.block_explorer && (
        <div className="px-6 pb-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Block Explorer
          </p>
          <a
            href={network.block_explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-xs font-mono text-primary hover:text-primary/80 break-all transition-colors"
          >
            {network.block_explorer}
          </a>
        </div>
      )}
    </div>
  );
}

export default NetworkCard;
