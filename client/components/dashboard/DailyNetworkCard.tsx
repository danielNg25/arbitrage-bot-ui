import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNetworkVisibility } from "@/context/NetworkVisibilityContext";
import type { TimeAggregationResponse } from "@shared/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

const formatPeriodStart = (startTime: string) => {
  try {
    const start = new Date(startTime);

    // Format as local date and time: MM/DD/YYYY HH:MM:SS
    return start.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting period start:", error);
    return "Invalid time";
  }
};

const formatBalance = (balanceWei: string) => {
  // Convert wei to ETH (1 ETH = 10^18 wei)
  const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);
  return balanceEth.toFixed(4);
};

const getBlockExplorerUrl = (
  address: string,
  networkId: number,
  blockExplorer?: string | null,
) => {
  if (blockExplorer) {
    return `${blockExplorer}/address/${address}`;
  }

  // Fallback to common block explorers based on chain ID
  const explorerMap: { [key: number]: string } = {
    1: "https://etherscan.io",
    137: "https://polygonscan.com",
    56: "https://bscscan.com",
    250: "https://ftmscan.com",
    43114: "https://snowtrace.io",
    42161: "https://arbiscan.io",
    10: "https://optimistic.etherscan.io",
    8453: "https://basescan.org",
  };

  const baseUrl = explorerMap[networkId] || "https://etherscan.io";
  return `${baseUrl}/address/${address}`;
};

export function DailyNetworkCard({
  aggregation,
  executorBalances,
  balancesLoading,
  networkData,
  className,
}: {
  aggregation: TimeAggregationResponse;
  executorBalances?: { address: string; balance: string }[];
  balancesLoading?: boolean;
  networkData?: { chain_id: number; block_explorer: string | null };
  className?: string;
}) {
  const navigate = useNavigate();
  const { showNetworkInfo } = useNetworkVisibility();
  const successCount = aggregation.successful_opportunities;
  const failedCount = aggregation.failed_opportunities;
  const executedCount = aggregation.executed_opportunities;
  const successRate = aggregation.success_rate;

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
            {showNetworkInfo ? aggregation.network_name : "****"}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {showNetworkInfo ? `Chain ID: ${aggregation.network_id} • ` : ""}
            {formatDate(aggregation.timestamp)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Period starts: {formatPeriodStart(aggregation.period_start)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex items-center rounded-sm border border-primary/40 bg-primary/20 px-2.5 py-1 text-[11px] font-medium text-primary">
            Executed: {executedCount}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => navigate(`/networks/${aggregation.network_id}`)}
          >
            Details
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-3 p-6 md:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Daily Profit
          </p>
          <p className="mt-1 text-lg md:text-xl font-semibold leading-none font-mono tabular-nums text-emerald-400">
            {currency.format(aggregation.total_profit_usd)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Daily Gas
          </p>
          <p className="mt-1 text-lg md:text-xl font-semibold leading-none font-mono tabular-nums text-rose-400">
            {currency.format(aggregation.total_gas_usd)}
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
            Success Rate
          </p>
          <p className="mt-1 text-lg md:text-xl font-semibold leading-none font-mono tabular-nums text-blue-400">
            {(successRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* {aggregation.top_profit_tokens.length > 0 && (
        <div className="px-6 pb-6 border-t border-border/60 pt-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Top Token
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              {aggregation.top_profit_tokens[0].symbol || "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {currency.format(
                aggregation.top_profit_tokens[0].total_profit_usd,
              )}
            </span>
          </div>
        </div>
      )} */}

      {/* Executor Balances Section */}
      <div className="px-6 pb-6 border-t border-border/60 pt-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
          Executor Balances
        </p>
        <div className="space-y-2">
          {balancesLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></div>
              Loading balances...
            </div>
          ) : executorBalances && executorBalances.length > 0 ? (
            executorBalances.map(({ address, balance }) => (
              <div key={address} className="flex items-center justify-between">
                <a
                  href={getBlockExplorerUrl(
                    address,
                    networkData?.chain_id || aggregation.network_id,
                    networkData?.block_explorer,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-400 hover:text-blue-300 truncate max-w-[120px] underline transition-colors"
                >
                  {address.slice(0, 6)}...{address.slice(-4)}
                </a>
                <span className="text-sm font-mono tabular-nums text-yellow-400">
                  {formatBalance(balance)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">
              No executors found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyNetworkCard;
