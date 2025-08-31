import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  currentPage,
  totalPages: propTotalPages,
  onDirectPageChange,
}: {
  page: number; // zero-based
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  currentPage?: number; // 1-based current page
  totalPages?: number; // total pages from API
  onDirectPageChange?: (page: number) => void; // direct page navigation
}) {
  const totalPages = propTotalPages || Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  const pageSizeOptions = [10, 20, 50, 100];

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <div className="text-xs text-muted-foreground">
          Page {page + 1} of {totalPages} • {total} items
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>

        {/* Direct Page Input */}
        {onDirectPageChange && currentPage && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Page</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const newPage = parseInt(e.target.value);
                if (newPage >= 1 && newPage <= totalPages) {
                  onDirectPageChange(newPage);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const newPage = parseInt(e.currentTarget.value);
                  if (newPage >= 1 && newPage <= totalPages) {
                    onDirectPageChange(newPage);
                  }
                }
              }}
              onBlur={(e) => {
                // Validate and correct the value when input loses focus
                const newPage = parseInt(e.target.value);
                if (isNaN(newPage) || newPage < 1) {
                  e.target.value = String(currentPage);
                } else if (newPage > totalPages) {
                  e.target.value = String(totalPages);
                }
              }}
              className="w-12 px-1 py-1 text-center border rounded text-xs text-black focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder={String(currentPage)}
            />
            <span className="text-muted-foreground">of {totalPages}</span>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
