import { RequestHandler } from "express";
import { Network } from "@shared/api";

export const handleNetworks: RequestHandler = async (req, res) => {
  try {
    // Fetch networks from your external API
    const response = await fetch("http://localhost:8081/api/v1/networks");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const networks: Network[] = await response.json();

    res.json(networks);
  } catch (error) {
    console.error("Error fetching networks:", error);
    res.status(500).json({
      error: "Failed to fetch networks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
