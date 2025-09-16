import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NetworkVisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export default function NetworkVisibilityToggle({
  visible,
  onToggle,
}: NetworkVisibilityToggleProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={
        visible ? "Hide network information" : "Show network information"
      }
      onClick={onToggle}
      className="relative"
    >
      <Eye
        className={`h-4 w-4 transition-all ${visible ? "opacity-100" : "opacity-0"}`}
      />
      <EyeOff
        className={`absolute h-4 w-4 transition-all ${visible ? "opacity-0" : "opacity-100"}`}
      />
    </Button>
  );
}
