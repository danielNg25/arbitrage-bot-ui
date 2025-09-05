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
  id?: string; // MongoDB ObjectId for the opportunity (optional until API is updated)
  network_id: number;
  status: string;
  profit_usd: number | null;
  gas_usd: number | null;
  estimate_profit_usd: number | null; // Estimated profit before execution
  created_at: string; // ISO 8601 timestamp
  source_tx: string | null;
  source_block_number: number | null;
  profit_token: string;
  profit_token_name: string | null;
  profit_token_symbol: string | null;
  profit_token_decimals: number | null;
  _new?: boolean; // Flagged when inserted via WebSocket; used for highlight only
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
  router_address: string | null;
  executors: string[];
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

// New types for opportunity details
export interface OpportunityDetails {
  // Base fields
  id?: string;
  network_id: number;
  status: string;
  profit_usd: number | null;
  profit_amount?: string | null;
  gas_usd: number | null;
  created_at: string; // ISO 8601 timestamp
  updated_at?: string | null; // ISO 8601 timestamp

  // Source and execution
  source_tx: string;
  source_block_number: number;
  source_log_index?: number | null;
  source_pool?: string | null;
  execute_block_number: number;
  execute_tx?: string | null;

  // Token and amounts
  profit_token: string;
  profit_token_name: string;
  profit_token_symbol: string;
  profit_token_decimals: number;
  amount?: string | null;
  gas_token_amount?: string | null;

  // Estimates and simulation
  estimate_profit?: string | null; // raw token units
  estimate_profit_usd?: number | null;
  path?: string[];
  received_at?: string | null;
  send_at?: string | null;
  simulation_time?: number | null;
  error?: string | null;
  gas_amount?: number | null;
  gas_price?: number | null;
}

export interface NetworkDetails {
  id?: string;
  chain_id: number;
  name: string;
  rpc: string;
  block_explorer: string | null;
  executed: number | null;
  success: number | null;
  failed: number | null;
  total_profit_usd: number;
  total_gas_usd: number;
  last_proccesed_created_at: number | null; // Unix timestamp or null
  created_at: number; // Unix timestamp
  success_rate: number | null;
}

export interface PathToken {
  id?: string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  price: number | null;
}

export interface PathPool {
  id?: string;
  address: string;
  pool_type: string;
  tokens: string[];
}

export interface OpportunityDetailsResponse {
  opportunity: OpportunityDetails;
  network: NetworkDetails;
  path_tokens: PathToken[];
  path_pools: PathPool[];
}

// Legacy types for backward compatibility with DebugInsights page
export interface OpportunityDetail {
  id: string;
  network_id: number;
  source_pool: string;
  status: string;
  profit_token: string;
  profit_usd: number;
  gas_usd: number;
  created_at: number;
  updated_at: number;
  source_block_number: number;
  source_block_timestamp: number;
  source_tx: string;
  source_log_index: number;
  execute_block_number: number;
  execute_tx: string;
  amount: string;
  profit: string;
  gas_token_amount: string;
}

export interface OpportunityDebug {
  id: string;
  estimate_profit_usd: number;
  estimate_profit_token_amount: string;
  gas_amount: number;
  gas_price: number;
  simulation_time: number;
  path: string[];
  received_at: number;
  send_at: number;
  error: string | null;
}

/**
 * Time Aggregation API interfaces
 */
export interface TokenAggregationResponse {
  address: string;
  name: string | null;
  symbol: string | null;
  total_profit_usd: number;
  total_profit: string; // U256 string
  opportunity_count: number;
  avg_profit_usd: number;
}

export interface TimeAggregationResponse {
  network_id: number;
  network_name: string;
  period: string; // "hourly", "daily", "monthly"
  timestamp: number; // Unix timestamp for period start
  period_start: string; // ISO 8601 formatted period start
  period_end: string; // ISO 8601 formatted period end
  total_opportunities: number;
  executed_opportunities: number;
  successful_opportunities: number;
  failed_opportunities: number;
  total_profit_usd: number;
  total_gas_usd: number;
  avg_profit_usd: number; // Calculated on-the-fly: total_profit_usd / total_opportunities
  avg_gas_usd: number; // Calculated on-the-fly: total_gas_usd / total_opportunities
  success_rate: number; // Calculated on-the-fly: successful_opportunities / executed_opportunities
  top_profit_tokens: TokenAggregationResponse[];
}

/**
 * Summary Aggregation API interfaces
 */
export interface SummaryAggregationResponse {
  period: string; // "hourly", "daily", "monthly"
  timestamp: number; // Unix timestamp for the period start
  period_start: string; // ISO 8601 formatted period start
  period_end: string; // ISO 8601 formatted period end
  total_opportunities: number; // Total across all networks
  executed_opportunities: number; // Total executed across all networks
  successful_opportunities: number; // Total successful across all networks
  failed_opportunities: number; // Total failed across all networks
  total_profit_usd: number; // Total profit across all networks
  total_gas_usd: number; // Total gas costs across all networks
}
