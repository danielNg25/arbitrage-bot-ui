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
 * Status filter type - supports individual statuses plus "Profitable" option
 */
export type StatusFilter = "all" | OpportunityStatus | "Profitable";

/**
 * Map opportunity status to shorter display names
 * Handles both PascalCase (old) and lowercase (new API) status values
 */
export function getStatusDisplayName(status: string): string {
  // Normalize status to handle both formats
  const normalizedStatus = status.toLowerCase().replace(/_/g, "");
  
  const statusMap: Record<string, string> = {
    // Handle both formats
    succeeded: "Success",
    partiallysucceeded: "Partial",
    partially_succeeded: "Partial",
    reverted: "Reverted",
    error: "Error",
    skipped: "Skipped",
    none: "None",
  };
  
  return (
    statusMap[normalizedStatus] || statusMap[status.toLowerCase()] || status
  );
}

/**
 * New opportunities API response structure
 */
export interface OpportunityResponse {
  network_id: number;
  status: string;
  profit_usd: number | null;
  gas_usd: number | null;
  created_at: string; // ISO 8601 timestamp
  source_tx: string | null;
  source_block_number: number | null;
  profit_token: string;
  profit_token_name: string | null;
  profit_token_symbol: string | null;
  profit_token_decimals: number | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedOpportunitiesResponse {
  opportunities: OpportunityResponse[];
  pagination: PaginationInfo;
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
