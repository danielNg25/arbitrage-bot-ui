import { RequestHandler } from "express";

export const handleTokenPerformance: RequestHandler = async (req, res) => {
  try {
    // Fetch token performance data from external API
    const response = await fetch(
      "http://localhost:8081/api/v1/tokens/performance",
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Return the data as-is since it should match our expected format
    res.json(data);
  } catch (error) {
    console.error("Error fetching token performance from external API:", error);

    // Return proper error response
    res.status(503).json({
      error: "Service Unavailable",
      message: "Unable to fetch token performance data from external API",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
