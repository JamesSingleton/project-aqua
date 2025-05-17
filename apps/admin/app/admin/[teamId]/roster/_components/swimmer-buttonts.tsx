import { IconMailPlus, IconUserPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function SwimmerButtons() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" className="space-x-1">
        <span>Invite</span> <IconMailPlus size={18} />
      </Button>
      <Button className="space-x-1">
        <span>Add</span> <IconUserPlus size={18} />
      </Button>
    </div>
  );
}
