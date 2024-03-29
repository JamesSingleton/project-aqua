import { Button } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/checkbox";
import { Input } from "@repo/ui/input";
import { Select, SelectTrigger, SelectValue } from "@repo/ui/select";
import MeetSetup from "@/components/forms/MeetSetup";

export default function CreateEventPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Create Event</h1>
      </div>
      <div>
        <MeetSetup />
      </div>
    </>
  );
}
