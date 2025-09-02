import { useCallback, useEffect, useState } from "react";
import type { TimeAggregationResponse } from "@shared/api";

type LoadState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useTimeAggregations(
  period: string = "daily",
  limit?: number,
  selectedDate?: Date,
) {
  const [state, setState] = useState<LoadState<TimeAggregationResponse[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchTimeAggregations = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const params = new URLSearchParams({
        period,
      });

      // Only add limit if it's specified
      if (limit !== undefined) {
        params.set("limit", String(limit));
      }

      // If a specific date is selected, add start_time and end_time filters
      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Convert to Unix timestamps (seconds since epoch)
        const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
        const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

        console.log("Date filtering:", {
          selectedDate: selectedDate.toISOString(),
          startOfDay: startOfDay.toISOString(),
          endOfDay: endOfDay.toISOString(),
          startTimestamp,
          endTimestamp,
        });

        params.set("start_time", String(startTimestamp));
        params.set("end_time", String(endTimestamp));
      }

      const response = await fetch(
        `/api/v1/time-aggregations?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setState({ data, loading: false, error: null });
    } catch (error) {
      console.error("Error fetching time aggregations:", error);
      setState({
        data: null,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch time aggregations",
      });
    }
  }, [period, limit, selectedDate]);

  useEffect(() => {
    fetchTimeAggregations();
  }, [fetchTimeAggregations]);

  return {
    ...state,
    refetch: fetchTimeAggregations,
  };
}
