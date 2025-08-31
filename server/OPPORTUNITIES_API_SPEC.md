# Opportunities API Route - Technical Specification

## Overview

The `/api/v1/opportunities` endpoint provides comprehensive access to arbitrage opportunity data with advanced filtering, pagination, and data limiting capabilities. This API is designed for high-performance dashboard applications and real-time monitoring systems.

## Endpoint Details

**URL:** `GET /api/v1/opportunities`  
**Base URL:** `http://localhost:8081` (development)  
**Content-Type:** `application/json`  
**Response Format:** JSON with pagination metadata

## Query Parameters

### Core Filtering Parameters

| Parameter    | Type     | Required | Default | Description                                    |
| ------------ | -------- | -------- | ------- | ---------------------------------------------- |
| `network_id` | `u64`    | No       | -       | Filter by specific blockchain network chain ID |
| `status`     | `string` | No       | -       | Filter by opportunity execution status         |

### Profit Range Filtering

| Parameter        | Type  | Required | Default | Description                     |
| ---------------- | ----- | -------- | ------- | ------------------------------- |
| `min_profit_usd` | `f64` | No       | -       | Minimum profit threshold in USD |
| `max_profit_usd` | `f64` | No       | -       | Maximum profit threshold in USD |

**Usage Examples:**

-   `min_profit_usd=10.0` - Only opportunities with profit ≥ $10.00
-   `max_profit_usd=100.0` - Only opportunities with profit ≤ $100.00
-   `min_profit_usd=50.0&max_profit_usd=200.0` - Profit range $50.00 - $200.00

### Gas Cost Filtering

| Parameter     | Type  | Required | Default | Description                       |
| ------------- | ----- | -------- | ------- | --------------------------------- |
| `min_gas_usd` | `f64` | No       | -       | Minimum gas cost threshold in USD |
| `max_gas_usd` | `f64` | No       | -       | Maximum gas cost threshold in USD |

**Usage Examples:**

-   `min_gas_usd=0.001` - Only opportunities with gas cost ≥ $0.001
-   `max_gas_usd=5.0` - Only opportunities with gas cost ≤ $5.00
-   `min_gas_usd=0.1&max_gas_usd=2.0` - Gas cost range $0.10 - $2.00

### Pagination Parameters

| Parameter | Type  | Required | Default | Max Value | Description                    |
| --------- | ----- | -------- | ------- | --------- | ------------------------------ |
| `page`    | `u32` | No       | 1       | -         | Page number (1-based indexing) |
| `limit`   | `u32` | No       | 100     | 1000      | Number of items per page       |

**Pagination Rules:**

-   Page numbers start from 1
-   Default page size is 100 items
-   Maximum page size is enforced at 1000 items
-   If limit exceeds 1000, it's automatically capped

## Response Structure

### Main Response Object

```typescript
interface PaginatedOpportunitiesResponse {
    opportunities: OpportunityResponse[];
    pagination: PaginationInfo;
}
```

### Opportunity Data Structure

```typescript
interface OpportunityResponse {
    network_id: number; // Blockchain network chain ID
    status: string; // Execution status (e.g., "succeeded", "reverted")
    profit_usd: number | null; // Profit amount in USD (null if not available)
    gas_usd: number | null; // Gas cost in USD (null if not available)
    created_at: string; // ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ)
    source_tx: string | null; // Source transaction hash (null if not available)
    source_block_number: number | null; // Source block number (null if not available)
    profit_token: string; // Profit token contract address
    profit_token_name: string | null; // Profit token name (null if not available)
    profit_token_symbol: string | null; // Profit token symbol (null if not available)
    profit_token_decimals: number | null; // Profit token decimals (null if not available)
}
```

### Pagination Metadata

```typescript
interface PaginationInfo {
    page: number; // Current page number
    limit: number; // Items per page (actual limit applied)
    total: number; // Total number of opportunities matching filters
    total_pages: number; // Total number of pages available
    has_next: boolean; // Whether next page exists
    has_prev: boolean; // Whether previous page exists
}
```

## Status Values

The `status` field can contain the following values:

-   `"succeeded"` - Transaction executed successfully
-   `"partially_succeeded"` - Transaction partially successful
-   `"reverted"` - Transaction was reverted
-   `"error"` - Transaction failed with an error
-   `"skipped"` - Transaction was skipped
-   `"none"` - No status available

## Complete API Examples

### 1. Basic Request (Default Pagination)

```bash
GET /api/v1/opportunities
```

**Response:** First 100 opportunities with default sorting

### 2. Network-Specific Filtering

```bash
GET /api/v1/opportunities?network_id=14&status=succeeded
```

**Response:** All successful opportunities on network 14 (Polygon)

### 3. Profit Range Filtering

```bash
GET /api/v1/opportunities?min_profit_usd=10.0&max_profit_usd=100.0
```

**Response:** Opportunities with profit between $10.00 and $100.00

### 4. Gas Cost Analysis

```bash
GET /api/v1/opportunities?min_gas_usd=0.001&max_gas_usd=1.0
```

**Response:** Opportunities with gas costs between $0.001 and $1.00

### 5. Pagination Control

```bash
GET /api/v1/opportunities?page=2&limit=50
```

**Response:** Second page with 50 opportunities per page

### 6. Combined Filtering with Pagination

```bash
GET /api/v1/opportunities?network_id=14&min_profit_usd=50.0&page=1&limit=200
```

**Response:** First page of 200 opportunities on network 14 with profit ≥ $50.00

## Response Examples

### Sample Response with Token Information

```json
{
    "opportunities": [
        {
            "network_id": 1,
            "status": "succeeded",
            "profit_usd": 25.5,
            "gas_usd": 3.2,
            "created_at": "2024-01-15T10:30:00Z",
            "source_tx": "0x1234567890abcdef1234567890abcdef12345678",
            "source_block_number": 18456789,
            "profit_token": "0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c",
            "profit_token_name": "USD Coin",
            "profit_token_symbol": "USDC",
            "profit_token_decimals": 6
        },
        {
            "network_id": 14,
            "status": "partially_succeeded",
            "profit_usd": 12.75,
            "gas_usd": 1.8,
            "created_at": "2024-01-15T09:45:00Z",
            "source_tx": "0xabcdef1234567890abcdef1234567890abcdef12",
            "source_block_number": 45678901,
            "profit_token": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
            "profit_token_name": "Uniswap",
            "profit_token_symbol": "UNI",
            "profit_token_decimals": 18
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 100,
        "total": 1250,
        "total_pages": 13,
        "has_next": true,
        "has_prev": false
    }
}
```

## Technical Implementation Details

### MongoDB Aggregation Pipeline (Join Query)

The API uses MongoDB's aggregation pipeline to efficiently join opportunities with token information in a single database query, eliminating the need for multiple API calls.

#### Pipeline Stages:

1. **`$match`** - Apply filters (network_id, status, profit_usd, gas_usd)
2. **`$lookup`** - Join with tokens collection based on network_id and profit_token address
3. **`$addFields`** - Extract token data from joined results
4. **`$sort`** - Sort by created_at (descending)
5. **`$skip`** - Apply pagination offset
6. **`$limit`** - Apply pagination limit

#### Join Logic:

```javascript
{
  "$lookup": {
    "from": "tokens",
    "let": {
      "opp_network_id": "$network_id",
      "opp_profit_token": "$profit_token"
    },
    "pipeline": [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$eq": ["$network_id", "$$opp_network_id"] },
              { "$eq": ["$address", "$$opp_profit_token"] }
            ]
          }
        }
      }
    ],
    "as": "token_info"
  }
}
```

#### Benefits:

-   **Single Query**: No N+1 query problem
-   **Efficient**: MongoDB handles the join optimization
-   **Scalable**: Works with large datasets
-   **Real-time**: Always returns current token information

### Data Enrichment

The API automatically enriches opportunity data with:

-   **Token Metadata**: Name, symbol, decimals from the tokens collection
-   **Transaction Details**: Source transaction hash and block number
-   **Network Context**: Full network information for each opportunity

This specification provides everything needed to build a comprehensive frontend interface for the opportunities API, including filtering, pagination, data visualization components, and enriched token information through efficient database joins.
