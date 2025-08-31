import { RequestHandler } from "express";

export const handleOpportunityDetails: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ error: "Opportunity identifier is required" });
    }

    // The id parameter is the MongoDB ObjectId from the opportunities list
    const externalApiUrl = `http://localhost:8081/api/v1/opportunities/${id}`;
    const response = await fetch(externalApiUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    // Return the data in the format expected by DebugInsights
    // The external API returns: { opportunity, network, path_tokens, path_pools }
    res.json(data);
  } catch (error) {
    console.error("Error fetching opportunity details:", error);
    res.status(500).json({ error: "Failed to fetch opportunity details" });
  }
};
