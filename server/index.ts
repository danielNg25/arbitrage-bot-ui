import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleNetworks } from "./routes/networks";
import { handleOpportunities } from "./routes/opportunities";
import { handleOpportunityDetails } from "./routes/opportunity-details";
import { handleTokenPerformance } from "./routes/token-performance";
import { handleTimeAggregations } from "./routes/time-aggregations";
import { handleSummaryAggregations } from "./routes/summary-aggregations";
import path from "path";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/v1/networks", handleNetworks);
  app.get("/api/v1/opportunities", handleOpportunities);
  app.get("/api/v1/opportunities/:id", handleOpportunityDetails);
  app.get("/api/v1/tokens/performance", handleTokenPerformance);
  app.get("/api/v1/time-aggregations", handleTimeAggregations);
  app.get("/api/v1/summary-aggregations", handleSummaryAggregations);

  // Simulation endpoint
  app.post("/api/simulate", (req, res) => {
    const example = {
      success: false,
      error: "EvmError: Revert (K)",
      trace:
        "Traces:\n  [429277] 0x33cF94337D00b8ed71324b629b61b7adfD8303E5::swap(66806473255265185 [6.68e16], 0xfc0000000000000000000000000000000000000692ec63ce8d748c819233e233ee5ed751e631db11fc00000000000000000000000000000000000002d335c616c8aa60cab2345052f9d7d62eb722f320fc00000000000000000000000000000000000001b4da8da10fff1f6127ab71395053aa1d499b503f)\n    ├─ [20616] 0x92Ec63Ce8d748C819233e233Ee5Ed751e631db11::token1() [staticcall]\n    │   ├─ [9806] 0xAAA16c016BF556fcD620328f0759252E29b1AB57::implementation() [staticcall]\n    │   │   ├─ [2554] 0xA54419918081E5b7638884Acab0415c5964B8C0f::implementation() [delegatecall]\n    │   │   │   └─ ← [Return] 0x000000000000000000000000f5d139c3f51967505c532c42898ba47b15da4b9f\n    │   │   └─ ← [Return] 0x000000000000000000000000f5d139c3f51967505c532c42898ba47b15da4b9f\n    ├─ [3056] 0x92Ec63Ce8d748C819233e233Ee5Ed751e631db11::factory() [staticcall]\n    │   ├─ [1306] 0xAAA16c016BF556fcD620328f0759252E29b1AB57::implementation() [staticcall]\n    │   │   ├─ [554] 0xA54419918081E5b7638884Acab0415c5964B8C0f::implementation() [delegatecall]\n    │   │   │   └─ ← [Return] 0x000000000000000000000000f5d139c3f51967505c532c42898ba47b15da4b9f\n    │   │   └─ ← [Return] 0x000000000000000000000000f5d139c3f51967505c532c42898ba47b15da4b9f\n    ├─ [356551] 0x92Ec63Ce8d748C819233e233Ee5Ed751e631db11::swap(...)\n    │   └─ ← [Revert] K\n\n\nGas used: 452137\n",
      gas_used: "452137",
      block_number: "24951063",
      transaction_data:
        "0xbd0625ab00000000000000000000000000000000000000000000000000ed58222b13a3a100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000078fc0000000000000000000000000000000000000692ec63ce8d748c819233e233ee5ed751e631db11fc00000000000000000000000000000000000002d335c616c8aa60cab2345052f9d7d62eb722f320fc00000000000000000000000000000000000001b4da8da10fff1f6127ab71395053aa1d499b503f0000000000000000",
    };
    res.status(200).json(example);
  });

  return app;
}
