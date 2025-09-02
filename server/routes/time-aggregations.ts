import { RequestHandler } from "express";

export const handleTimeAggregations: RequestHandler = async (req, res) => {
  try {
    const { network_id, period, start_time, end_time, limit, offset } =
      req.query;

    // Build query parameters
    const params = new URLSearchParams();
    if (network_id) params.set("network_id", String(network_id));
    if (period) params.set("period", String(period));
    if (start_time) params.set("start_time", String(start_time));
    if (end_time) params.set("end_time", String(end_time));
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));

    const apiUrl = `http://localhost:8081/api/v1/time-aggregations?${params.toString()}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching time aggregations from external API:", error);
    res.status(503).json({
      error: "Service Unavailable",
      message: "Unable to fetch time aggregations from external API",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
