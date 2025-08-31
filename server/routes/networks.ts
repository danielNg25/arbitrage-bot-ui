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
    console.error("Error fetching networks from external API:", error);

    // Return proper error response instead of fallback data
    res.status(503).json({
      error: "Service Unavailable",
      message: "Unable to fetch networks from external API",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
