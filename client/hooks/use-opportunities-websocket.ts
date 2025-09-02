import { useEffect, useRef, useCallback } from "react";

export interface OpportunityWebSocketData {
  id: string;
  network_id: number;
  status: string;
  profit_usd: number | null;
  estimate_profit_usd: number | null;
  estimate_profit: string;
  profit_amount: string;
  gas_usd: number | null;
  created_at: string;
  source_tx: string;
  source_block_number: number;
  execute_block_number: number | null;
  profit_token: string;
  profit_token_name: string | null;
  profit_token_symbol: string | null;
  profit_token_decimals: number;
  simulation_time: number;
  error: string | null;
}

interface UseOpportunitiesWebSocketProps {
  enabled: boolean;
  filters: {
    networkId: number | "all";
    status: string;
    profitMin: number | "";
    profitMax: number | "";
    estimateProfitMin: number | "";
    estimateProfitMax: number | "";
    timestampFrom: string;
    timestampTo: string;
  };
  onNewOpportunity: (opportunity: OpportunityWebSocketData) => void;
  onError?: (error: Event) => void;
}

export function useOpportunitiesWebSocket({
  enabled,
  filters,
  onNewOpportunity,
  onError,
}: UseOpportunitiesWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const filtersRef = useRef(filters);

  // Keep filters ref updated
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Don't connect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket: Already connected, skipping connection attempt");
      return;
    }

    try {
      // Build WebSocket URL with current filters from ref
      const currentFilters = filtersRef.current;
      const params = new URLSearchParams();

      if (currentFilters.networkId !== "all") {
        params.set("network_id", String(currentFilters.networkId));
      }

      if (currentFilters.status !== "all") {
        if (currentFilters.status === "Profitable") {
          params.set("min_profit_usd", "0.001");
        } else {
          // Convert status to lowercase to match API spec
          const apiStatus = currentFilters.status
            .toLowerCase()
            .replace(/([A-Z])/g, "_$1")
            .toLowerCase();
          params.set("status", apiStatus);
        }
      }

      if (currentFilters.profitMin !== "") {
        params.set("min_profit_usd", String(currentFilters.profitMin));
      }

      if (currentFilters.profitMax !== "") {
        params.set("max_profit_usd", String(currentFilters.profitMax));
      }

      if (currentFilters.estimateProfitMin !== "") {
        params.set(
          "min_estimate_profit_usd",
          String(currentFilters.estimateProfitMin),
        );
      }

      if (currentFilters.estimateProfitMax !== "") {
        params.set(
          "max_estimate_profit_usd",
          String(currentFilters.estimateProfitMax),
        );
      }

      // Note: WebSocket doesn't support time filters as per spec
      // Only newly inserted opportunities are streamed

      const wsUrl = `ws://localhost:8081/api/v1/ws/opportunities?${params.toString()}`;
      console.log("Connecting to WebSocket:", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = undefined;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as OpportunityWebSocketData;
          console.log("WebSocket: New opportunity received", data);
          onNewOpportunity(data);
        } catch (error) {
          console.error(
            "WebSocket: Failed to parse message",
            error,
            event.data,
          );
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed", event.code, event.reason);
        wsRef.current = null;

        // Auto-reconnect after 3 seconds if still enabled
        if (enabled && !event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("WebSocket: Attempting to reconnect...");
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError?.(error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [enabled, onNewOpportunity, onError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log("WebSocket: Disconnecting...");
      // Only close if not already closing or closed
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close(1000, "Client disconnect");
      }
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
  }, []);

  const reconnect = useCallback(() => {
    console.log("WebSocket: Manual reconnect requested");
    disconnect();
    // Small delay to ensure disconnect is complete
    setTimeout(() => {
      if (enabled) {
        connect();
      }
    }, 500);
  }, [enabled, connect, disconnect]);

  const reconnectWithNewFilters = useCallback(() => {
    console.log("WebSocket: Reconnecting with new filters");
    disconnect();
    // Small delay to ensure disconnect is complete
    setTimeout(() => {
      if (enabled) {
        connect();
      }
    }, 500);
  }, [enabled, connect, disconnect]);

  // Connect/disconnect based on enabled state
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Only connect when enabled state changes, not when filters change
  // This prevents unnecessary reconnections
  useEffect(() => {
    if (enabled && !wsRef.current) {
      console.log("WebSocket: Enabled, connecting...");
      connect();
    }
  }, [enabled, connect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    connect,
    disconnect,
    reconnect,
    reconnectWithNewFilters,
    readyState: wsRef.current?.readyState,
  };
}
