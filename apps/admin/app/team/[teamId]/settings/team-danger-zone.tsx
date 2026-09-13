"use client";

import { organization } from "@project-aqua/auth/client";
import {
  COACH_ROLES,
  type CoachRole,
  POST_TRANSFER_ROLES,
} from "@project-aqua/auth/roles";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@project-aqua/ui/components/alert";
import { Button } from "@project-aqua/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@project-aqua/ui/components/dialog";
import { Field, FieldLabel } from "@project-aqua/ui/components/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type TransferCandidate = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
};

const keepAsRoleItems = POST_TRANSFER_ROLES.map((r) => ({
  value: r,
  label: COACH_ROLES[r].label,
}));

function TransferOwnershipDialog({
  teamId,
  currentOwner,
  candidates,
}: {
  teamId: string;
  currentOwner: TransferCandidate;
  candidates: TransferCandidate[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [newOwnerId, setNewOwnerId] = useState(candidates[0]?.memberId ?? "");
  const [keepAs, setKeepAs] = useState<CoachRole>("head_coach");
  const [error, setError] = useState("");

  function transfer() {
    if (!newOwnerId) return;
    setError("");
    startTransition(async () => {
      const promote = await organization.updateMemberRole({
        memberId: newOwnerId,
        role: "owner",
        organizationId: teamId,
      });
      if (promote.error) {
        setError(promote.error.message ?? "Failed to promote new owner");
        return;
      }

      const demote = await organization.updateMemberRole({
        memberId: currentOwner.memberId,
        role: keepAs,
        organizationId: teamId,
      });
      if (demote.error) {
        setError(
          demote.error.message ??
            "New owner was set, but your role could not be updated. Ask them to change it.",
        );
        router.refresh();
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  if (candidates.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Invite another member in Settings → Members first, then you can transfer
        ownership to them.
      </p>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" size="sm" variant="destructive" />}
      >
        Transfer ownership
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer ownership</DialogTitle>
          <DialogDescription>
            The new owner gets full billing and settings control. You will keep
            access under the role you choose below. This cannot be undone
            without their help.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field>
            <FieldLabel htmlFor="new-owner">New owner</FieldLabel>
            <Select
              items={candidates.map((m) => ({
                value: m.memberId,
                label: `${m.name} (${m.email})`,
              }))}
              value={newOwnerId}
              onValueChange={(v) => {
                if (v != null) setNewOwnerId(v);
              }}
            >
              <SelectTrigger id="new-owner" className="w-full">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {candidates.map((m) => (
                    <SelectItem key={m.memberId} value={m.memberId}>
                      {m.name} ({m.email})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="keep-as">Your role after transfer</FieldLabel>
            <Select
              items={keepAsRoleItems}
              value={keepAs}
              onValueChange={(v) => {
                if (v != null) setKeepAs(v as CoachRole);
              }}
            >
              <SelectTrigger id="keep-as" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {keepAsRoleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || !newOwnerId}
            onClick={transfer}
          >
            {pending ? "Transferring…" : "Transfer ownership"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TeamDangerZone({
  teamId,
  currentOwner,
  candidates,
}: {
  teamId: string;
  currentOwner: TransferCandidate;
  candidates: TransferCandidate[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Transfer ownership</AlertTitle>
        <AlertDescription>
          The person who created this team is the owner by default. Transfer
          ownership if someone else should control billing and team settings —
          for example, a club president. You will lose owner privileges
          immediately.
        </AlertDescription>
      </Alert>
      <TransferOwnershipDialog
        teamId={teamId}
        currentOwner={currentOwner}
        candidates={candidates}
      />
    </div>
  );
}
