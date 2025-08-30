import React from "react";
import { Button } from "@/components/ui/button";

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number; // zero-based
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs text-muted-foreground">
        Page {page + 1} of {totalPages} • {total} items
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button type="button" variant="outline" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
