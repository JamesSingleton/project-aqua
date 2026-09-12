"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { organization } from "@project-aqua/auth/client";
import {
  COACH_ROLES,
  type CoachRole,
  INVITE_ROLES,
} from "@project-aqua/auth/roles";
import { Badge } from "@project-aqua/ui/components/badge";
import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { Separator } from "@project-aqua/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { updateMemberTitleAction } from "./actions";

export type TeamMember = {
  memberId: string;
  userId: string;
  role: string;
  title: string | null;
  name: string;
  email: string;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: string | null;
  expiresAt: Date | string;
};

const ROLE_LABELS = COACH_ROLES;

const inviteMemberFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(["head_coach", "assistant_coach", "admin", "member"]),
});

type InviteMemberFormValues = z.infer<typeof inviteMemberFormSchema>;

const inviteRoleItems = INVITE_ROLES.map((role) => ({
  label: ROLE_LABELS[role].label,
  value: role,
}));

const memberRoleItems = (Object.keys(ROLE_LABELS) as CoachRole[])
  .filter((r) => r !== "owner")
  .map((role) => ({
    label: ROLE_LABELS[role].label,
    value: role,
  }));

function roleLabel(role: string | null | undefined) {
  if (!role) return "Member";
  return ROLE_LABELS[role as CoachRole]?.label ?? role.replaceAll("_", " ");
}

export function MembersPanel({
  teamId,
  members,
  invitations,
  canManage,
  currentUserId,
}: {
  teamId: string;
  members: TeamMember[];
  invitations: PendingInvite[];
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [titles, setTitles] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((m) => [m.memberId, m.title ?? ""])),
  );
  const {
    control,
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberFormSchema),
    defaultValues: {
      email: "",
      role: "admin",
    },
  });

  async function handleInvite(values: InviteMemberFormValues) {
    setError("");
    const result = await organization.inviteMember({
      email: values.email,
      role: values.role,
      organizationId: teamId,
    });
    if (result.error) {
      setError(result.error.message ?? "Failed to send invitation");
      return;
    }
    resetField("email");
    router.refresh();
  }

  async function handleRoleChange(memberId: string, nextRole: string) {
    setError("");
    const result = await organization.updateMemberRole({
      memberId,
      role: nextRole,
      organizationId: teamId,
    });
    if (result.error) {
      setError(result.error.message ?? "Failed to update role");
      return;
    }
    router.refresh();
  }

  async function handleRemove(memberIdOrEmail: string) {
    setError("");
    const result = await organization.removeMember({
      memberIdOrEmail,
      organizationId: teamId,
    });
    if (result.error) {
      setError(result.error.message ?? "Failed to remove member");
      return;
    }
    router.refresh();
  }

  async function handleCancelInvite(invitationId: string) {
    setError("");
    const result = await organization.cancelInvitation({ invitationId });
    if (result.error) {
      setError(result.error.message ?? "Failed to cancel invitation");
      return;
    }
    router.refresh();
  }

  function saveTitle(memberId: string) {
    setError("");
    startTransition(async () => {
      const result = await updateMemberTitleAction(
        teamId,
        memberId,
        titles[memberId] ?? "",
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {canManage ? (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Invite member</h4>
            <p className="text-muted-foreground text-sm">
              Invite coaches, team managers, or other staff by email.
            </p>
          </div>
          <form
            onSubmit={handleSubmit(handleInvite)}
            className="flex flex-col gap-4"
          >
            <FieldGroup className="sm:grid sm:grid-cols-2">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="member-email">Email</FieldLabel>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="name@school.edu"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>
              <Field data-invalid={!!errors.role}>
                <FieldLabel htmlFor="member-role">Role</FieldLabel>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      items={inviteRoleItems}
                      value={field.value}
                      onValueChange={(value) => {
                        if (value != null) field.onChange(value);
                      }}
                    >
                      <SelectTrigger
                        id="member-role"
                        className="w-full"
                        aria-invalid={!!errors.role}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {inviteRoleItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.role]} />
              </Field>
            </FieldGroup>
            <Button type="submit" className="w-fit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send invite"}
            </Button>
            {error ? <FieldError>{error}</FieldError> : null}
          </form>
        </div>
      ) : null}

      <Separator />

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">Team members</h4>
          <p className="text-muted-foreground text-sm">
            {members.length} people with access to this team
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Role</TableHead>
              {canManage ? (
                <TableHead className="w-28">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const isSelf = m.userId === currentUserId;
              const isOwner = m.role === "owner";
              const canEditTitle = canManage || isSelf;
              const titleDirty = (titles[m.memberId] ?? "") !== (m.title ?? "");
              return (
                <TableRow key={m.memberId}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>
                    {canEditTitle ? (
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-8 w-32"
                          value={titles[m.memberId] ?? ""}
                          placeholder="Title"
                          onChange={(e) =>
                            setTitles((prev) => ({
                              ...prev,
                              [m.memberId]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending || !titleDirty}
                          onClick={() => saveTitle(m.memberId)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      (m.title ?? "—")
                    )}
                  </TableCell>
                  <TableCell>
                    {canManage && !isOwner && !isSelf ? (
                      <Select
                        items={memberRoleItems}
                        value={m.role}
                        onValueChange={(v) => {
                          if (v != null) handleRoleChange(m.memberId, v);
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {memberRoleItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{roleLabel(m.role)}</Badge>
                    )}
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      {!isOwner && !isSelf ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(m.memberId)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {invitations.length > 0 ? (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Pending invitations</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  {canManage ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>{roleLabel(inv.role)}</TableCell>
                    <TableCell>
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvite(inv.id)}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}
    </div>
  );
}
