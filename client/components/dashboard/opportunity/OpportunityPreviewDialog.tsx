import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import DebugDetails, { type OpportunityCombined } from "./DebugDetails";
import type { OpportunityRow } from "./OpportunityTable";

interface OpportunityPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOpportunity: OpportunityRow | null;
  allOpportunities: OpportunityRow[];
  onNavigateToOpportunity: (opportunity: OpportunityRow) => void;
  networks: Array<{
    chain_id: number;
    name: string;
    block_explorer: string | null;
  }>;
}

export default function OpportunityPreviewDialog({
  isOpen,
  onClose,
  selectedOpportunity,
  allOpportunities,
  onNavigateToOpportunity,
  networks,
}: OpportunityPreviewDialogProps) {
  const [debugData, setDebugData] = useState<OpportunityCombined | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get network data for the selected opportunity
  const networkData = selectedOpportunity
    ? networks.find((n) => n.chain_id === selectedOpportunity.network_id)
    : null;

  // Get current index and navigation functions
  const currentIndex = selectedOpportunity
    ? allOpportunities.findIndex(
        (opp) =>
          (opp.id &&
            selectedOpportunity.id &&
            opp.id === selectedOpportunity.id) ||
          (!opp.id &&
            !selectedOpportunity.id &&
            opp.created_at === selectedOpportunity.created_at),
      )
    : -1;

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < allOpportunities.length - 1;

  const goToPrevious = () => {
    if (canGoPrevious) {
      onNavigateToOpportunity(allOpportunities[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      onNavigateToOpportunity(allOpportunities[currentIndex + 1]);
    }
  };

  const handleViewDetails = () => {
    if (selectedOpportunity) {
      const opportunityId =
        selectedOpportunity.id || selectedOpportunity.created_at;
      const detailsUrl = `/opportunities/${opportunityId}`;
      window.open(detailsUrl, "_blank");
    }
  };

  // Fetch debug data when selected opportunity changes
  useEffect(() => {
    if (!selectedOpportunity || !isOpen) {
      setDebugData(null);
      setError(null);
      return;
    }

    const fetchDebugData = async () => {
      setLoading(true);
      setError(null);

      try {
        const opportunityId =
          selectedOpportunity.id || selectedOpportunity.created_at;
        console.log("Fetching opportunity details for ID:", opportunityId);
        console.log("Selected opportunity:", selectedOpportunity);
        const response = await fetch(`/api/v1/opportunities/${opportunityId}`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch opportunity details: ${response.status}`,
          );
        }

        const data = await response.json();
        console.log("API Response for opportunity details:", data);

        // Handle different response structures
        let opportunityData = data;

        // If the response has nested structure (e.g., { opportunity: {...} })
        if (data.opportunity) {
          opportunityData = data.opportunity;
        }

        // Convert API response to OpportunityCombined format
        const combinedData: OpportunityCombined = {
          id: opportunityData.id,
          network_id: opportunityData.network_id,
          status: opportunityData.status,
          created_at: opportunityData.created_at
            ? new Date(opportunityData.created_at).getTime()
            : selectedOpportunity.created_at * 1000,
          updated_at: opportunityData.updated_at
            ? new Date(opportunityData.updated_at).getTime()
            : selectedOpportunity.created_at * 1000,
          source_block_timestamp: opportunityData.source_block_timestamp
            ? new Date(opportunityData.source_block_timestamp).getTime()
            : null,
          execute_block_timestamp: opportunityData.execute_block_timestamp
            ? new Date(opportunityData.execute_block_timestamp).getTime()
            : null,
          source_tx: opportunityData.source_tx,
          source_block_number: opportunityData.source_block_number,
          source_log_index: opportunityData.source_log_index,
          execute_tx: opportunityData.execute_tx,
          execute_block_number: opportunityData.execute_block_number,
          source_pool: opportunityData.source_pool,
          path: opportunityData.path,
          profit_token:
            opportunityData.profit_token || selectedOpportunity.profit_token,
          profit_usd: opportunityData.profit_usd,
          gas_usd: opportunityData.gas_usd,
          amount: opportunityData.amount,
          profit: opportunityData.profit,
          gas_token_amount: opportunityData.gas_token_amount,
          estimate_profit_usd:
            opportunityData.estimate_profit_usd ||
            selectedOpportunity.estimate_profit_usd,
          estimate_profit_token_amount:
            opportunityData.estimate_profit_token_amount,
          estimate_profit: opportunityData.estimate_profit,
          simulation_time: opportunityData.simulation_time,
          gas_amount: opportunityData.gas_amount,
          gas_price: opportunityData.gas_price,
          error: opportunityData.error,
        };

        setDebugData(combinedData);
      } catch (err) {
        console.error("Error fetching debug data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch opportunity details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, [selectedOpportunity, isOpen]);

  if (!selectedOpportunity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Opportunity Preview
            </DialogTitle>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {currentIndex + 1} of {allOpportunities.length}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className="h-8 px-3 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={!canGoPrevious}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={!canGoNext}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading opportunity details...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-destructive mb-2">
                  Error loading details
                </div>
                <div className="text-sm text-muted-foreground">{error}</div>
              </div>
            </div>
          ) : debugData ? (
            <DebugDetails
              detail={debugData}
              networkName={selectedOpportunity.network_name}
              profitTokenDecimals={18}
              blockExplorer={networkData?.block_explorer}
            />
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No data available</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
