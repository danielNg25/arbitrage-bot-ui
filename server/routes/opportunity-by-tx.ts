import { RequestHandler } from "express";

export const handleOpportunityByTx: RequestHandler = async (req, res) => {
  try {
    const { tx_hash } = req.params;

    if (!tx_hash) {
      return res.status(400).json({ error: "Transaction hash is required" });
    }

    // Validate transaction hash format (should start with 0x and be 66 characters)
    if (!tx_hash.startsWith("0x") || tx_hash.length !== 66) {
      return res.status(400).json({ error: "Invalid transaction hash format" });
    }

    // Proxy to external API
    const externalApiUrl = `http://localhost:8081/api/v1/opportunities/tx/${tx_hash}`;
    const response = await fetch(externalApiUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return res
          .status(404)
          .json({ error: "Opportunity not found for this transaction hash" });
      }
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    // Return the data in the format expected by DebugInsights
    // The external API returns: { opportunity, network, path_tokens, path_pools }
    res.json(data);
  } catch (error) {
    console.error("Error fetching opportunity by transaction hash:", error);
    res.status(500).json({ error: "Failed to fetch opportunity details" });
  }
};
