import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@lane4hq/ui/components/alert";

export function NotPermittedPanel({
  title = "Not permitted",
  description = "You don't have permission to view this page. Ask a team owner or head coach if you need access.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
