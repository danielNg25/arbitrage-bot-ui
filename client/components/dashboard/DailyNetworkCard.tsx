import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

export function DailyNetworkCard({
  aggregation,
  className,
}: {
  aggregation: TimeAggregationResponse;
  className?: string;
}) {
  const navigate = useNavigate();
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
            {aggregation.network_name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chain ID: {aggregation.network_id} •{" "}
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
    </div>
  );
}

export default DailyNetworkCard;
