import React from "react";

// Merged detail type used by the UI (combines old OpportunityDetail + OpportunityDebug)
export type OpportunityCombined = {
  id?: string | null;
  network_id: number;
  status: string;
  // Timestamps (ms)
  created_at: number;
  updated_at: number;
  source_block_timestamp?: number | null;
  execute_block_timestamp?: number | null; // New field for execute block time
  received_at?: number | null; // Timestamp in ms
  send_at?: number | null; // Timestamp in ms
  // Tx/blocks
  source_tx?: string | null;
  source_block_number?: number | null;
  source_log_index?: number | null;
  execute_tx?: string | null;
  execute_block_number?: number | null;
  // Pool/Path
  source_pool?: string | null;
  path?: string[] | null;
  // Token & amounts
  profit_token: string;
  profit_usd?: number | null;
  gas_usd?: number | null;
  amount?: string | null;
  profit?: string | null; // token profit amount (formatted)
  gas_token_amount?: string | null;
  // Estimates
  estimate_profit_usd?: number | null;
  estimate_profit_token_amount?: string | null; // formatted with symbol
  estimate_profit?: string | null; // raw token units
  simulation_time?: number | null;
  // Gas & errors
  gas_amount?: number | null;
  gas_price?: number | null;
  error?: string | null;
};

function shorten(addr?: string | null) {
  if (!addr) return "N/A";
  return addr.length <= 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function iso(v?: number | null) {
  if (!v && v !== 0) return "N/A";
  try {
    return new Date(v!).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "N/A";
  }
}

function formatISODate(timestamp?: number | null) {
  if (!timestamp && timestamp !== 0) return "N/A";
  try {
    const date = new Date(timestamp!);
    const formatted = date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Add milliseconds
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${formatted}.${ms}`;
  } catch {
    return "N/A";
  }
}

function kv(label: string, value: React.ReactNode) {
  return (
    <div className="flex items-center justify-between gap-6 py-2">
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function explorerBase(networkId: number): string {
  switch (networkId) {
    case 1:
      return "https://etherscan.io";
    case 137:
      return "https://polygonscan.com";
    case 56:
      return "https://bscscan.com";
    case 42161:
      return "https://arbiscan.io";
    case 10:
      return "https://optimistic.etherscan.io";
    case 8453:
      return "https://basescan.org";
    default:
      return "https://etherscan.io";
  }
}

function LinkAddr({
  addr,
  base,
  kind = "address",
  labelClass = "",
}: {
  addr?: string | null;
  base: string;
  kind?: "address" | "tx" | "token";
  labelClass?: string;
}) {
  if (!addr) return <span>N/A</span>;
  // Map token kind to address for block explorer compatibility
  const explorerKind = kind === "token" ? "address" : kind;
  const href = `${base}/${explorerKind}/${addr}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline decoration-dotted hover:text-primary ${labelClass}`}
    >
      {addr.length <= 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`}
    </a>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border-2 border-border/60 bg-card text-card-foreground p-4 shadow-md">
      <div className="mb-3 text-sm font-semibold text-muted-foreground">
        {title}
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

export default function DebugDetails({
  detail,
  networkName,
  tokenMeta = {},
  profitTokenDecimals = 18,
  blockExplorer,
}: {
  detail: OpportunityCombined;
  networkName: string;
  tokenMeta?: Record<string, { name?: string | null; symbol?: string | null }>;
  profitTokenDecimals?: number | null;
  blockExplorer?: string | null;
}) {
  const base = (blockExplorer || explorerBase(detail.network_id))?.replace(
    /\/$/,
    "",
  );
  const s = String(detail.status || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const statusColor =
    s === "executed" || s.includes("succeed")
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : s === "pending"
        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        : "bg-red-500/20 text-red-400 border-red-500/30";

  const profitColor = (v?: number | null) =>
    v != null && v >= 0 ? "text-green-400" : v != null ? "text-red-400" : "";

  const showProfitUsd =
    detail.status?.toLowerCase().includes("executed") ||
    detail.status?.toLowerCase().includes("succeeded");

  const badgeClasses = (kind: "token" | "pool") =>
    kind === "token"
      ? "inline-flex items-center rounded-md border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-300"
      : "inline-flex items-center rounded-md border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-xs font-medium text-purple-300";

  const tokenLabel = (addr?: string | null) => {
    if (!addr) return "N/A";
    const meta = tokenMeta[addr.toLowerCase?.() ?? addr];
    const label = meta?.symbol || meta?.name;
    return label ? `${label}` : shorten(addr);
  };

  function formatUnits(raw?: string | null, decimals = 18): string {
    if (!raw) return "0";
    let s = raw.trim();
    const neg = s.startsWith("-");
    if (neg) s = s.slice(1);
    s = s.replace(/^0+/, "");
    if (s.length === 0) s = "0";
    if (decimals <= 0) return (neg ? "-" : "") + s;
    if (s.length <= decimals) s = "0".repeat(decimals - s.length + 1) + s;
    const intPart = s.slice(0, s.length - decimals) || "0";
    let frac = s.slice(s.length - decimals).replace(/0+$/, "");
    return (neg ? "-" : "") + intPart + (frac ? "." + frac : "");
  }

  function formatTokenAmount(amount: string | null, decimals: number): string {
    if (!amount) return "0";
    const formatted = formatUnits(amount, decimals);
    const dotIndex = formatted.indexOf(".");
    if (dotIndex === -1) return formatted;
    // Keep only 6 decimal places for display
    return formatted.slice(0, Math.min(dotIndex + 7, formatted.length));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Overview */}
      <Section title="Overview">
        {kv("ID", detail.id ?? "N/A")}
        {kv(
          "Network",
          `${networkName ? networkName.charAt(0).toUpperCase() + networkName.slice(1) : ""} (${detail.network_id})`,
        )}
        {kv(
          "Status",
          <span
            className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium ${statusColor}`}
          >
            {detail.status}
          </span>,
        )}
        {showProfitUsd &&
          kv(
            "Net Profit (USD)",
            detail.profit_usd == null || detail.gas_usd == null ? (
              "N/A"
            ) : (
              <span className={profitColor(detail.profit_usd - detail.gas_usd)}>
                {fmtUSD.format(detail.profit_usd - detail.gas_usd)}
              </span>
            ),
          )}
        {kv(
          "Profit Token",
          <span>
            {tokenLabel(detail.profit_token)} (
            <LinkAddr addr={detail.profit_token} base={base} kind="token" />)
          </span>,
        )}
        {kv(
          "Source Pool",
          detail.path && detail.path.length >= 3 ? (
            <span>
              {tokenLabel(detail.path[0])} - {tokenLabel(detail.path[2])} (
              <LinkAddr
                addr={detail.source_pool ?? detail.path[1] ?? null}
                base={base}
                kind="address"
              />
              )
            </span>
          ) : (
            <span>
              <LinkAddr
                addr={detail.source_pool ?? null}
                base={base}
                kind="address"
              />
            </span>
          ),
        )}
        {kv(
          "Path",
          detail.path && detail.path.length ? (
            <div className="flex w-full flex-wrap items-center gap-2">
              {detail.path.map((p, i) => (
                <React.Fragment key={i}>
                  <a
                    href={`${base}/${i % 2 === 0 ? "token" : "address"}/${p}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={badgeClasses(i % 2 === 0 ? "token" : "pool")}
                  >
                    {i % 2 === 0 ? tokenLabel(p) : shorten(p)}
                  </a>
                  {i < detail.path!.length - 1 && (
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M7 5l5 5-5 5" />
                    </svg>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">N/A</span>
          ),
        )}
        {kv(
          "Error",
          detail.status?.toLowerCase().includes("failed") ||
            detail.status?.toLowerCase().includes("reverted") ||
            detail.status?.toLowerCase().includes("error") ||
            detail.error ? (
            <span className="text-red-400">
              {detail.error || detail.status}
            </span>
          ) : (
            "N/A"
          ),
        )}
      </Section>

      {/* Simulation vs Execution */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section title="Simulation">
          {kv(
            "Estimated Revenue",
            detail.estimate_profit_token_amount ||
              detail.estimate_profit_usd != null ? (
              <span>
                {detail.estimate_profit_token_amount ? (
                  <span className="mr-1">
                    {detail.estimate_profit_token_amount}
                  </span>
                ) : null}
                {detail.estimate_profit_usd != null ? (
                  <span className={profitColor(detail.estimate_profit_usd)}>
                    ({fmtUSD.format(detail.estimate_profit_usd)})
                  </span>
                ) : null}
              </span>
            ) : (
              "N/A"
            ),
          )}
          {kv(
            "Source Tx",
            <LinkAddr addr={detail.source_tx ?? null} base={base} kind="tx" />,
          )}
          {kv("Source Tx Block", detail.source_block_number ?? "N/A")}
          {kv(
            "Source Tx Block Time",
            iso(detail.source_block_timestamp ?? null),
          )}
          {kv("Received At", formatISODate(detail.received_at))}
          {kv("Source Log Index", detail.source_log_index ?? "N/A")}
          {kv(
            "Simulation Time (ms)",
            detail.simulation_time == null ? "N/A" : detail.simulation_time,
          )}
          {kv(
            "Volume",
            detail.amount
              ? `${formatTokenAmount(detail.amount, profitTokenDecimals ?? 18)} ${tokenLabel(detail.profit_token)}`
              : "N/A",
          )}
        </Section>

        <Section title="Execution">
          {kv(
            "Revenue",
            detail.profit ||
              (detail.profit_usd != null && detail.gas_usd != null) ? (
              <span>
                {detail.profit ? (
                  <span className="mr-1">{`${formatTokenAmount(detail.profit as string, profitTokenDecimals ?? 18)} ${tokenLabel(detail.profit_token)}`}</span>
                ) : null}
                {detail.profit_usd != null ? (
                  <span className={profitColor(detail.profit_usd)}>
                    ({fmtUSD.format(detail.profit_usd)})
                  </span>
                ) : null}
              </span>
            ) : (
              "N/A"
            ),
          )}
          {kv(
            "Executed Tx",
            <LinkAddr addr={detail.execute_tx ?? null} base={base} kind="tx" />,
          )}
          {kv("Execute Tx Block", detail.execute_block_number ?? "N/A")}
          {kv(
            "Execute Tx Block Time",
            iso(detail.execute_block_timestamp ?? null),
          )}
          {kv("Send At", formatISODate(detail.send_at))}
          {kv(
            "Gas",
            detail.gas_token_amount || detail.gas_usd != null ? (
              <span>
                {detail.gas_token_amount ? (
                  <span className="mr-1">
                    {formatUnits(detail.gas_token_amount as string, 18)}
                  </span>
                ) : null}
                {detail.gas_usd != null ? (
                  <span className="text-red-400">
                    ({fmtUSD.format(detail.gas_usd)})
                  </span>
                ) : null}
              </span>
            ) : (
              "N/A"
            ),
          )}
          {kv(
            "Gas Price (wei)",
            detail.gas_price == null ? "N/A" : detail.gas_price,
          )}
          {kv(
            "Gas Usage",
            detail.gas_amount == null ? "N/A" : detail.gas_amount,
          )}
        </Section>
      </div>
    </div>
  );
}
