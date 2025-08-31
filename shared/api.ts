/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Opportunity status matching the Rust enum
 */
export type OpportunityStatus =
  | "Succeeded" // Transaction was successful
  | "PartiallySucceeded" // Transaction was partially successful
  | "Reverted" // Transaction reverted
  | "Error" // Transaction failed with an error
  | "Skipped" // Transaction was skipped (e.g. no profit)
  | "None"; // No status

/**
 * Map opportunity status to shorter display names
 */
export function getStatusDisplayName(status: OpportunityStatus): string {
  const statusMap: Record<OpportunityStatus, string> = {
    Succeeded: "Success",
    PartiallySucceeded: "Partial",
    Reverted: "Reverted",
    Error: "Error",
    Skipped: "Skipped",
    None: "None",
  };
  return statusMap[status];
}

/**
 * Network interface matching the API response
 */
export interface Network {
  chain_id: number;
  name: string;
  rpc: string;
  block_explorer: string | null;
  executed: number | null;
  success: number | null;
  failed: number | null;
  total_profit_usd: number;
  total_gas_usd: number;
  last_proccesed_created_at: string | null;
  created_at: number;
  executed_opportunities: number;
  success_rate: number | null;
}

/**
 * Response type for /api/v1/networks
 */
export interface NetworksResponse {
  networks: Network[];
}
