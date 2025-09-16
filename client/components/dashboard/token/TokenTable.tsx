import React from "react";
import { useNetworkVisibility } from "@/context/NetworkVisibilityContext";

export type TokenRow = {
  name: string | null;
  symbol: string | null;
  total_profit_usd: number;
  total_profit: string; // Total profit in token units (U256 string)
  price: number | null;
  address: string;
  network_id: number;
  network_name: string; // Network name from API
  block_explorer?: string | null; // Block explorer URL
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function shorten(addr: string) {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function getTokenUrl(
  blockExplorer: string | null | undefined,
  address: string,
): string | null {
  if (!blockExplorer || !address) return null;

  // Remove trailing slash if present
  const baseUrl = blockExplorer.replace(/\/$/, "");

  // Try different URL patterns that block explorers commonly use
  // Most block explorers support /token/ for ERC-20 tokens
  return `${baseUrl}/token/${address}`;
}

export default function TokenTable({ rows }: { rows: TokenRow[] }) {
  const { showNetworkInfo } = useNetworkVisibility();
  return (
    <div className="rounded-md border-2 border-border/60 bg-card shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full text-sm">
          <thead className="bg-muted/10 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Chain</th>
              <th className="px-4 py-3 text-left font-semibold">Token</th>
              <th className="px-4 py-3 text-left font-semibold">Symbol</th>
              <th className="px-4 py-3 text-left font-semibold">
                Total Profit (USD)
              </th>
              <th className="px-4 py-3 text-left font-semibold">Price</th>
              <th className="px-4 py-3 text-left font-semibold">Address</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={`${r.address}-${idx}`}
                className="border-t border-border/60 hover:bg-accent/10"
              >
                <td className="px-4 py-3 align-top">
                  {showNetworkInfo
                    ? r.network_name.charAt(0).toUpperCase() +
                      r.network_name.slice(1)
                    : "****"}
                </td>
                <td className="px-4 py-3 align-top">
                  {showNetworkInfo ? (r.name ?? "Unknown") : "****"}
                </td>
                <td className="px-4 py-3 align-top font-mono">
                  {showNetworkInfo ? (r.symbol ?? "N/A") : "****"}
                </td>
                <td className="px-4 py-3 align-top font-mono tabular-nums">
                  {currency.format(r.total_profit_usd)}
                </td>
                <td className="px-4 py-3 align-top font-mono tabular-nums">
                  {r.price == null ? "N/A" : currency.format(r.price)}
                </td>
                <td className="px-4 py-3 align-top font-mono">
                  {showNetworkInfo
                    ? (() => {
                        const tokenUrl = getTokenUrl(
                          r.block_explorer,
                          r.address,
                        );
                        if (tokenUrl) {
                          return (
                            <a
                              href={tokenUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 hover:underline transition-colors"
                            >
                              {shorten(r.address)}
                            </a>
                          );
                        }
                        return shorten(r.address);
                      })()
                    : "****"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
