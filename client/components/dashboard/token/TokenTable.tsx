import React from "react";

export type TokenRow = {
  name: string | null;
  symbol: string | null;
  total_profit_usd: number;
  price: number | null;
  address: string;
  network_id: number;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

function shorten(addr: string) {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function TokenTable({ rows, networkNames = {} }: { rows: TokenRow[]; networkNames?: Record<number, string> }) {
  return (
    <div className="rounded-md border-2 border-border/60 bg-card shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full text-sm">
          <thead className="bg-muted/10 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Token</th>
              <th className="px-4 py-3 text-left font-semibold">Symbol</th>
              <th className="px-4 py-3 text-left font-semibold">Chain</th>
              <th className="px-4 py-3 text-left font-semibold">Total Profit (USD)</th>
              <th className="px-4 py-3 text-left font-semibold">Price</th>
              <th className="px-4 py-3 text-left font-semibold">Address</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.address}-${idx}`} className="border-t border-border/60 hover:bg-accent/10">
                <td className="px-4 py-3 align-top">{r.name ?? "Unknown"}</td>
                <td className="px-4 py-3 align-top font-mono">{r.symbol ?? "N/A"}</td>
                <td className="px-4 py-3 align-top">{networkNames[r.network_id] ?? r.network_id}</td>
                <td className="px-4 py-3 align-top font-mono tabular-nums">{currency.format(r.total_profit_usd)}</td>
                <td className="px-4 py-3 align-top font-mono tabular-nums">{r.price == null ? "N/A" : currency.format(r.price)}</td>
                <td className="px-4 py-3 align-top font-mono">{shorten(r.address)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
