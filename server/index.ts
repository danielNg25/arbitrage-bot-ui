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

  return app;
}
