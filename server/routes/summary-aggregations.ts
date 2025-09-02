import { RequestHandler } from "express";

export const handleSummaryAggregations: RequestHandler = async (req, res) => {
  try {
    const { period, start_time, end_time, limit, offset } = req.query;

    // Build query parameters
    const params = new URLSearchParams();
    if (period) params.set("period", String(period));
    if (start_time) params.set("start_time", String(start_time));
    if (end_time) params.set("end_time", String(end_time));
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));

    const response = await fetch(
      `http://localhost:8081/api/v1/summary-aggregations?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(
      "Error fetching summary aggregations from external API:",
      error,
    );
    res.status(503).json({
      error: "Service Unavailable",
      message: "Unable to fetch summary aggregations from external API",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
