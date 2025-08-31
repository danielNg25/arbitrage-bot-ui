import { useState, useEffect } from "react";
import { Network } from "@shared/api";

export function useNetworks() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/v1/networks");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: Network[] = await response.json();
        setNetworks(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch networks";
        setError(errorMessage);
        console.error("Error fetching networks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworks();
  }, []);

  const refetch = () => {
    setLoading(true);
    setError(null);
    fetch("/api/v1/networks")
      .then(response => response.json())
      .then(data => {
        setNetworks(data);
        setLoading(false);
      })
      .catch(err => {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch networks";
        setError(errorMessage);
        setLoading(false);
      });
  };

  return { networks, loading, error, refetch };
}
