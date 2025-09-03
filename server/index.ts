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

  // Debug opportunity endpoint - proxy to real API
  app.post("/api/v1/debug/opportunity", async (req, res) => {
    try {
      const rustApiUrl = process.env.RUST_API_URL || "http://localhost:8081";
      const response = await fetch(`${rustApiUrl}/api/v1/debug/opportunity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Error proxying debug request:", error);
      res.status(500).json({
        success: false,
        error: "Failed to connect to debug service",
        trace: null,
        gas_used: null,
        block_number: null,
        transaction_data: null,
      });
    }
  });

  return app;
}
