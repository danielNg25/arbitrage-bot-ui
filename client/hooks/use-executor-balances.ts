import { useState, useEffect } from "react";
import { Network } from "@shared/api";

interface ExecutorBalance {
  address: string;
  balance: string; // Balance in wei
}

interface NetworkWithBalances extends Network {
  executorBalances: ExecutorBalance[];
}

export function useExecutorBalances(networks: Network[]) {
  const [networksWithBalances, setNetworksWithBalances] = useState<
    NetworkWithBalances[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExecutorBalances = async (
    network: Network,
  ): Promise<ExecutorBalance[]> => {
    if (!network.executors || network.executors.length === 0) {
      return [];
    }

    try {
      const balancePromises = network.executors.map(async (executorAddress) => {
        try {
          const response = await fetch(network.rpc, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_getBalance",
              params: [executorAddress, "latest"],
              id: 1,
            }),
          });

          if (!response.ok) {
            throw new Error(`RPC request failed: ${response.status}`);
          }

          const data = await response.json();

          if (data.error) {
            throw new Error(`RPC error: ${data.error.message}`);
          }

          return {
            address: executorAddress,
            balance: data.result || "0x0",
          };
        } catch (error) {
          console.error(
            `Failed to fetch balance for ${executorAddress} on ${network.name}:`,
            error,
          );
          return {
            address: executorAddress,
            balance: "0x0", // Return zero balance on error
          };
        }
      });

      return await Promise.all(balancePromises);
    } catch (error) {
      console.error(
        `Error fetching executor balances for network ${network.name}:`,
        error,
      );
      return [];
    }
  };

  useEffect(() => {
    if (networks.length === 0) {
      setNetworksWithBalances([]);
      return;
    }

    const fetchAllBalances = async () => {
      setLoading(true);
      setError(null);

      try {
        const networksWithBalancesPromises = networks.map(async (network) => {
          const executorBalances = await fetchExecutorBalances(network);
          return {
            ...network,
            executorBalances,
          };
        });

        const results = await Promise.all(networksWithBalancesPromises);
        setNetworksWithBalances(results);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch executor balances";
        setError(errorMessage);
        console.error("Error fetching executor balances:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBalances();
  }, [networks]);

  return { networksWithBalances, loading, error };
}
