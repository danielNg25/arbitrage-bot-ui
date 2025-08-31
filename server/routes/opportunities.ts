import { RequestHandler } from "express";
import { OpportunityResponse, PaginationInfo } from "@shared/api";

export const handleOpportunities: RequestHandler = async (req, res) => {
  try {
    // Extract query parameters
    const {
      page = "1",
      limit = "100",
      network_id,
      status,
      min_profit_usd,
      max_profit_usd,
      min_source_timestamp,
      max_source_timestamp,
    } = req.query;

    // Parse and validate pagination
    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(1000, Math.max(1, parseInt(String(limit), 10)));

    // Build query parameters for external API
    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    params.set("limit", String(limitNum));

    if (network_id) params.set("network_id", String(network_id));

    // Handle status filtering
    if (status) {
      params.set("status", String(status));
    }

    if (min_profit_usd) params.set("min_profit_usd", String(min_profit_usd));
    if (max_profit_usd) params.set("max_profit_usd", String(max_profit_usd));

    // Add timestamp filters
    if (min_source_timestamp)
      params.set("min_source_timestamp", String(min_source_timestamp));
    if (max_source_timestamp)
      params.set("max_source_timestamp", String(max_source_timestamp));

    // Fetch opportunities from external API
    const response = await fetch(
      `http://localhost:8081/api/v1/opportunities?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Return the data as-is since it already matches our expected format
    res.json(data);
  } catch (error) {
    console.error("Error fetching opportunities from external API:", error);

    // Return proper error response
    res.status(503).json({
      error: "Service Unavailable",
      message: "Unable to fetch opportunities from external API",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
