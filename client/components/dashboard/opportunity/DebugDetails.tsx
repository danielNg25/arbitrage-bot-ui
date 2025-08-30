import React from "react";

export type OpportunityDetail = {
  id?: string | null;
  network_id: number;
  source_pool?: string | null;
  status: string;
  profit_token: string;
  profit_usd?: number | null;
  gas_usd?: number | null;
  created_at: number;
  updated_at: number;
  source_block_number?: number | null;
  source_block_timestamp?: number | null;
  source_tx?: string | null;
  source_log_index?: number | null;
  execute_block_number?: number | null;
  execute_tx?: string | null;
  amount: string;
  profit?: string | null;
  gas_token_amount?: string | null;
};

export type OpportunityDebug = {
  id?: string | null;
  estimate_profit_usd?: number | null;
  estimate_profit_token_amount?: string | null;
  path?: string[] | null;
  received_at?: number | null;
  send_at?: number | null;
  simulation_time?: number | null;
  error?: string | null;
  gas_amount?: number | null;
  gas_price?: number | null;
};

function shorten(addr?: string | null) {
  if (!addr) return "N/A";
  return addr.length <= 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const fmtUSD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

function iso(v?: number | null) {
  if (!v && v !== 0) return "N/A";
  try {
    return new Date(v!).toISOString().replace("T", " ").split(".")[0];
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

function LinkAddr({ addr, base, kind = "address", labelClass = "" }: { addr?: string | null; base: string; kind?: "address" | "tx"; labelClass?: string }) {
  if (!addr) return <span>N/A</span>;
  const href = `${base}/${kind}/${addr}`;
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border-2 border-border/60 bg-card text-card-foreground p-4 shadow-md">
      <div className="mb-3 text-sm font-semibold text-muted-foreground">{title}</div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

export default function DebugDetails({
  opp,
  dbg,
  networkName,
  tokenMeta = {},
}: {
  opp: OpportunityDetail;
  dbg: OpportunityDebug | null;
  networkName: string;
  tokenMeta?: Record<string, { name?: string | null; symbol?: string | null }>;
}) {
  const base = explorerBase(opp.network_id);
  const statusColor =
    opp.status === "executed" || opp.status === "succeeded" || opp.status === "partially_succeeded"
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : opp.status === "pending"
        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        : "bg-red-500/20 text-red-400 border-red-500/30";

  const profitColor = (v?: number | null) => (v != null && v >= 0 ? "text-green-400" : v != null ? "text-red-400" : "");

  const showProfitUsd = opp.status === "executed" || opp.status === "succeeded" || opp.status === "partially_succeeded";

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

  return (
    <div className="flex flex-col gap-4">
      {/* Overview */}
      <Section title="Overview">
        {kv("ID", opp.id ?? "N/A")}
        {kv("Network", `${networkName} (${opp.network_id})`)}
        {kv(
          "Status",
          <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium ${statusColor}`}>{opp.status}</span>,
        )}
        {showProfitUsd &&
          kv(
            "Profit (USD)",
            opp.profit_usd == null ? "N/A" : <span className={profitColor(opp.profit_usd)}>{fmtUSD.format(opp.profit_usd)}</span>,
          )}
        {kv(
          "Profit Token",
          <span>
            {tokenLabel(opp.profit_token)} (
            <LinkAddr addr={opp.profit_token} base={base} kind="address" />
            )
          </span>,
        )}
        {kv(
          "Source Pool",
          dbg?.path && dbg.path.length >= 3 ? (
            <span>
              {tokenLabel(dbg.path[0])} - {tokenLabel(dbg.path[2])} (
              <LinkAddr addr={opp.source_pool ?? dbg.path[1] ?? null} base={base} kind="address" />
              )
            </span>
          ) : (
            <span>
              <LinkAddr addr={opp.source_pool ?? null} base={base} kind="address" />
            </span>
          ),
        )}
        {kv(
          "Path",
          dbg?.path && dbg.path.length ? (
            <div className="flex w-full flex-wrap items-center gap-2">
              {dbg.path.map((p, i) => (
                <React.Fragment key={i}>
                  <a
                    href={`${base}/address/${p}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={badgeClasses(i % 2 === 0 ? "token" : "pool")}
                  >
                    {i % 2 === 0 ? tokenLabel(p) : shorten(p)}
                  </a>
                  {i < dbg.path!.length - 1 && (
                    <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
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
          opp.status === "failed" || opp.status === "reverted" || dbg?.error ? (
            <span className="text-red-400">{dbg?.error || opp.status}</span>
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
            dbg && (dbg.estimate_profit_token_amount || dbg.estimate_profit_usd != null) ? (
              <span>
                {dbg.estimate_profit_token_amount ? <span className="mr-1">{dbg.estimate_profit_token_amount}</span> : null}
                {dbg.estimate_profit_usd != null ? (
                  <span className={profitColor(dbg.estimate_profit_usd)}>({fmtUSD.format(dbg.estimate_profit_usd)})</span>
                ) : null}
              </span>
            ) : (
              "N/A"
            ),
          )}
          {kv("Source Tx", <LinkAddr addr={opp.source_tx ?? null} base={base} kind="tx" />)}
          {kv("Source Tx Block", opp.source_block_number ?? "N/A")}
          {kv("Source Tx Block Time", iso(opp.source_block_timestamp ?? null))}
          {kv("Source Log Index", opp.source_log_index ?? "N/A")}
          {kv("Simulation Time (ms)", dbg?.simulation_time == null ? "N/A" : dbg.simulation_time)}
          {kv("Volume", opp.amount)}
        </Section>

        <Section title="Execution">
          {kv(
            "Revenue",
            opp.profit || opp.profit_usd != null ? (
              <span>
                {opp.profit ? <span className="mr-1">{opp.profit}</span> : null}
                {opp.profit_usd != null ? <span className={profitColor(opp.profit_usd)}>({fmtUSD.format(opp.profit_usd)})</span> : null}
              </span>
            ) : (
              "N/A"
            ),
          )}
          {kv("Executed Tx", <LinkAddr addr={opp.execute_tx ?? null} base={base} kind="tx" />)}
          {kv("Execute Tx Block", opp.execute_block_number ?? "N/A")}
          {kv("Execute Tx Block Time", "N/A")}
          {kv(
            "Gas",
            opp.gas_token_amount || opp.gas_usd != null ? (
              <span>
                {opp.gas_token_amount ? <span className="mr-1">{opp.gas_token_amount}</span> : null}
                {opp.gas_usd != null ? <span>({fmtUSD.format(opp.gas_usd)})</span> : null}
              </span>
            ) : (
              "N/A"
            ),
          )}
          {kv("Gas Price (wei)", dbg?.gas_price == null ? "N/A" : dbg.gas_price)}
          {kv("Gas Usage", dbg?.gas_amount == null ? "N/A" : dbg.gas_amount)}
        </Section>
      </div>
    </div>
  );
}
