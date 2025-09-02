---

### GET /api/v1/time-aggregations

- Description: Returns time-based aggregations (hourly, daily, monthly) of arbitrage performance
- Request body: none

Query parameters:

- `network_id` (u64, optional) - Filter by specific network/chain
- `period` (string, optional) - Time period: "hourly", "daily", "monthly"
- `start_time` (string, optional) - Start time filter (ISO 8601 or Unix timestamp)
- `end_time` (string, optional) - End time filter (ISO 8601 or Unix timestamp)
- `limit` (u64, optional) - Number of results to return (default 100, max 1000)
- `offset` (u64, optional) - Number of results to skip (default 0)

Response 200 (array of `TimeAggregationResponse`):

```typescript
interface TimeAggregationResponse {
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

interface TokenAggregationResponse {
  address: string;
  name: string | null;
  symbol: string | null;
  total_profit_usd: number;
  total_profit: string; // U256 string
  opportunity_count: number;
  avg_profit_usd: number;
}
```

Example request:

```bash
curl -X GET "http://localhost:8081/api/v1/time-aggregations?period=daily&network_id=1&limit=7"
```

Example response:

```json
[
  {
    "network_id": 1,
    "network_name": "Ethereum",
    "period": "daily",
    "timestamp": 1735689600,
    "period_start": "2025-01-01T00:00:00Z",
    "period_end": "2025-01-02T00:00:00Z",
    "total_opportunities": 1250,
    "executed_opportunities": 850,
    "successful_opportunities": 720,
    "failed_opportunities": 130,
    "total_profit_usd": 12500.75,
    "total_gas_usd": 850.25,
    "avg_profit_usd": 10.0,
    "avg_gas_usd": 0.68,
    "success_rate": 0.847,
    "top_profit_tokens": [
      {
        "address": "0x0000000000000000000000000000000000000000",
        "name": "Ethereum",
        "symbol": "ETH",
        "total_profit_usd": 5000.25,
        "total_profit": "2000000000000000000",
        "opportunity_count": 250,
        "avg_profit_usd": 20.0
      }
    ]
  }
]
```
---

### GET /api/v1/summary-aggregations

- Description: Returns cross-network summary aggregations (hourly, daily, monthly) of arbitrage performance
- Request body: none

Query parameters:

- `period` (string, optional) - Time period: "hourly", "daily", "monthly"
- `start_time` (string, optional) - Start time filter (ISO 8601 or Unix timestamp)
- `end_time` (string, optional) - End time filter (ISO 8601 or Unix timestamp)
- `limit` (u64, optional) - Number of results to return (default 100, max 1000)
- `offset` (u64, optional) - Number of results to skip (default 0)

Response 200 (array of `SummaryAggregationResponse`):

```typescript
interface SummaryAggregationResponse {
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
```

Example request:

```bash
curl -X GET "http://localhost:8081/api/v1/summary-aggregations?period=daily&limit=10"
```

Example response:

```json
[
  {
    "period": "daily",
    "timestamp": 1704067200,
    "period_start": "2024-01-01T00:00:00Z",
    "period_end": "2024-01-02T00:00:00Z",
    "total_opportunities": 1250,
    "executed_opportunities": 1050,
    "successful_opportunities": 890,
    "failed_opportunities": 160,
    "total_profit_usd": 12500.75,
    "total_gas_usd": 850.25
  }
]
```
