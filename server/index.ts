import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleNetworks } from "./routes/networks";
import { handleOpportunities } from "./routes/opportunities";
import { handleOpportunityDetails } from "./routes/opportunity-details";
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

  // Remove the old /networks endpoint since we now have /api/v1/networks
  // app.get("/networks", ...) - removed

  // This route serves the React app for opportunity details pages
  app.get("/opportunities/:id", (req, res) => {
    // Serve the React app - the actual data will be fetched via API
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });

  // Catch-all route for SPA - must be last
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });

  app.get("/tokens", (_req, res) => {
    res.status(200).json([
      {
        address: "0x1111111111111111111111111111111111111111",
        name: "Token A",
        symbol: "TKA",
      },
      {
        address: "0x3333333333333333333333333333333333333333",
        name: "Token B",
        symbol: "TKB",
      },
      {
        address: "0xfeedbeef1234567890abcdef",
        name: "Profit Token",
        symbol: "PRFT",
      },
    ]);
  });

  app.get("/opportunities", (req, res) => {
    const count = 50;
    const statuses = [
      "Succeeded",
      "PartiallySucceeded",
      "Reverted",
      "Error",
      "Skipped",
    ] as const;
    const now = Date.now();
    const rows = Array.from({ length: count }).map((_, i) => {
      const nid = [1, 137, 56][Math.floor(Math.random() * 3)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const profit =
        Math.random() > 0.15
          ? Number((Math.random() * 2000 - 200).toFixed(2))
          : null;
      const gas =
        Math.random() > 0.1
          ? Number((Math.random() * 50 + 1).toFixed(2))
          : null;
      const created =
        now -
        Math.floor(Math.random() * 30) * 86400000 -
        Math.floor(Math.random() * 86400000);
      const updated = created + Math.floor(Math.random() * 6) * 3600000;
      const token =
        "0x" +
        Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("");
      const id = Array.from({ length: 24 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");
      return {
        id,
        network_id: nid,
        status,
        profit_token: token,
        profit_usd: profit,
        gas_usd: gas,
        created_at: created,
        updated_at: updated,
      };
    });

    const q = req.query as Record<string, string | undefined>;
    const networkId = q.network_id ? Number(q.network_id) : null;
    const statusQ = q.status ?? null;
    const profitMin = q.profit_min ? Number(q.profit_min) : null;
    const profitMax = q.profit_max ? Number(q.profit_max) : null;
    const gasMin = q.gas_min ? Number(q.gas_min) : null;
    const gasMax = q.gas_max ? Number(q.gas_max) : null;

    const filtered = rows.filter((r) => {
      if (networkId != null && r.network_id !== networkId) return false;
      if (statusQ && r.status !== statusQ) return false;
      const p = r.profit_usd;
      if (profitMin != null && (p == null || p < profitMin)) return false;
      if (profitMax != null && (p == null || p > profitMax)) return false;
      const g = r.gas_usd;
      if (gasMin != null && (g == null || g < gasMin)) return false;
      if (gasMax != null && (g == null || g > gasMax)) return false;
      return true;
    });

    res.status(200).json(filtered);
  });

  return app;
}
