import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

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

  const networks = [
    { chain_id: 1, name: "Ethereum", total_profit_usd: 0, total_gas_usd: 0 },
    { chain_id: 137, name: "Polygon", total_profit_usd: 0, total_gas_usd: 0 },
    { chain_id: 56, name: "BSC", total_profit_usd: 0, total_gas_usd: 0 },
  ];

  app.get("/networks", (_req, res) => {
    res.status(200).json(networks);
  });

  app.get("/opportunities/:id", (req, res) => {
    const now = Date.now();
    const id = String(req.params.id);
    const net = networks[0];
    res.status(200).json({
      id,
      network_id: net.chain_id,
      source_pool: "0xabcDEF1234567890abcDEF12",
      status: "executed",
      profit_token: "0xfeedbeef1234567890abcdef",
      profit_usd: 1234.56,
      gas_usd: 23.45,
      created_at: now - 3600_000,
      updated_at: now,
      source_block_number: 123456789,
      source_block_timestamp: now - 3600_000,
      source_tx: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      source_log_index: 42,
      execute_block_number: 123456799,
      execute_tx: "0xfacefacefacefacefacefacefacefacefaceface",
      amount: "123.4567",
      profit: "1.234 ETH",
      gas_token_amount: "0.0123 ETH",
    });
  });

  app.get("/opportunity_debug/:id", (req, res) => {
    const now = Date.now();
    res.status(200).json({
      id: String(req.params.id),
      estimate_profit_usd: 1500.12,
      estimate_profit_token_amount: "1.567 ETH",
      gas_amount: 210000,
      gas_price: 12_000_000_000,
      simulation_time: 152,
      path: [
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222",
        "0x3333333333333333333333333333333333333333",
      ],
      received_at: now - 2000,
      send_at: now - 1000,
      error: null,
    });
  });

  app.get("/tokens", (_req, res) => {
    res.status(200).json([
      { address: "0x1111111111111111111111111111111111111111", name: "Token A", symbol: "TKA" },
      { address: "0x3333333333333333333333333333333333333333", name: "Token B", symbol: "TKB" },
      { address: "0xfeedbeef1234567890abcdef", name: "Profit Token", symbol: "PRFT" },
    ]);
  });

  return app;
}
