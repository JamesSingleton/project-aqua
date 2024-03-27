import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IndividualEventPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">
            Casteel & Desert Sunrise
          </h1>
          <p className="text-sm text-gray-500">September 28, 2023</p>
          <p className="text-sm text-gray-500">Copper Sky Aquatic Center</p>
        </div>
        {/* TODO: Figure out registering for a particular event */}
        <Button>Register</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Meet Information</CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Date:</strong> September 28, 2023
            </p>
            <p>
              <strong>Location:</strong> Copper Sky Aquatic Center
            </p>
            <p>
              <strong>Registration Fee:</strong> $50
            </p>
            <p>
              <strong>Spectator Fee:</strong> $10
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Time Standards</CardTitle>
            <CardDescription>
              View the time standards for this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Time standards for this event will be available soon.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
