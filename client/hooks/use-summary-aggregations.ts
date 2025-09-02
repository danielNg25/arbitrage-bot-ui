import { useState, useEffect, useCallback } from "react";
import { SummaryAggregationResponse } from "@shared/api";

interface UseSummaryAggregationsOptions {
  period?: "hourly" | "daily" | "monthly";
  limit?: number;
}

export function useSummaryAggregations({
  period = "daily",
  limit,
}: UseSummaryAggregationsOptions = {}) {
  const [data, setData] = useState<SummaryAggregationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("period", period);

      // Set appropriate limits based on period
      let actualLimit = limit;
      if (period === "hourly") {
        actualLimit = 24; // Last 24 hours
      } else if (period === "daily") {
        actualLimit = 30; // Last 30 days
      } else if (period === "monthly") {
        actualLimit = 12; // Last 12 months
      }

      if (actualLimit !== undefined) {
        params.append("limit", actualLimit.toString());
      }

      // Calculate time range based on period
      const endDate = new Date();
      let startDate = new Date();

      if (period === "hourly") {
        startDate.setHours(endDate.getHours() - 24);
      } else if (period === "daily") {
        startDate.setDate(endDate.getDate() - 30);
      } else if (period === "monthly") {
        startDate.setMonth(endDate.getMonth() - 12);
      }

      // Convert to Unix timestamps (seconds since epoch)
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);

      params.append("start_time", startTimestamp.toString());
      params.append("end_time", endTimestamp.toString());

      console.log("Summary aggregations chart data:", {
        period,
        actualLimit,
        startTimestamp,
        endTimestamp,
        startISO: startDate.toISOString(),
        endISO: endDate.toISOString(),
        timeRange:
          period === "hourly"
            ? "Last 24 hours"
            : period === "daily"
              ? "Last 30 days"
              : "Last 12 months",
      });

      const response = await fetch(`/api/v1/summary-aggregations?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching summary aggregations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [period, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
