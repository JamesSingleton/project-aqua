"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@project-aqua/ui/components/badge";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { Checkbox } from "@project-aqua/ui/components/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  assignGroupsBulkAction,
  createGroupAction,
  deleteGroupAction,
} from "./groups-actions";

const createGroupFormSchema = z.object({
  name: z.string().trim().min(1, "Group name is required"),
});

type CreateGroupFormValues = z.infer<typeof createGroupFormSchema>;

type Group = { id: string; name: string };
type MemberRow = {
  membershipId: string;
  name: string;
  groupId: string | null;
};

const FILTER_ALL = "__all__";
const FILTER_UNASSIGNED = "__unassigned__";
const TARGET_UNASSIGNED = "__unassigned__";

export function GroupsPanel({
  teamId,
  groups,
  members,
}: {
  teamId: string;
  groups: Group[];
  members: MemberRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [filterGroupId, setFilterGroupId] = useState(FILTER_ALL);
  const [search, setSearch] = useState("");
  const [targetGroupId, setTargetGroupId] = useState(
    groups[0]?.id ?? TARGET_UNASSIGNED,
  );
  const deferredSearch = useDeferredValue(search);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupFormSchema),
    defaultValues: { name: "" },
  });
  const name = watch("name");

  const groupNameById = useMemo(
    () => new Map(groups.map((group) => [group.id, group.name])),
    [groups],
  );

  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of members) {
      if (!member.groupId) continue;
      counts.set(member.groupId, (counts.get(member.groupId) ?? 0) + 1);
    }
    return counts;
  }, [members]);

  const unassignedCount = useMemo(
    () => members.filter((member) => !member.groupId).length,
    [members],
  );

  const filteredMembers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return members.filter((member) => {
      if (filterGroupId === FILTER_UNASSIGNED && member.groupId) return false;
      if (
        filterGroupId !== FILTER_ALL &&
        filterGroupId !== FILTER_UNASSIGNED &&
        member.groupId !== filterGroupId
      ) {
        return false;
      }
      if (!query) return true;
      return member.name.toLowerCase().includes(query);
    });
  }, [members, filterGroupId, deferredSearch]);

  const filteredIds = useMemo(
    () => filteredMembers.map((member) => member.membershipId),
    [filteredMembers],
  );

  const selectedVisibleCount = useMemo(
    () => filteredIds.filter((id) => selectedIds.has(id)).length,
    [filteredIds, selectedIds],
  );

  const allVisibleSelected =
    filteredIds.length > 0 && selectedVisibleCount === filteredIds.length;
  const someVisibleSelected =
    selectedVisibleCount > 0 && selectedVisibleCount < filteredIds.length;

  const filterItems = [
    { value: FILTER_ALL, label: `All swimmers (${members.length})` },
    {
      value: FILTER_UNASSIGNED,
      label: `Unassigned (${unassignedCount})`,
    },
    ...groups.map((group) => ({
      value: group.id,
      label: `${group.name} (${groupCounts.get(group.id) ?? 0})`,
    })),
  ];

  const targetItems = [
    { value: TARGET_UNASSIGNED, label: "Unassigned" },
    ...groups.map((group) => ({
      value: group.id,
      label: group.name,
    })),
  ];

  function refresh() {
    router.refresh();
  }

  function onCreateGroup(values: CreateGroupFormValues) {
    setError(null);
    startTransition(async () => {
      try {
        const row = await createGroupAction(teamId, values.name);
        reset();
        if (row?.id) setTargetGroupId(row.id);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function toggleSelect(membershipId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(membershipId)) next.delete(membershipId);
      else next.add(membershipId);
      return next;
    });
  }

  function toggleSelectAllVisible(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        for (const id of filteredIds) next.add(id);
      } else {
        for (const id of filteredIds) next.delete(id);
      }
      return next;
    });
  }

  function applyBulkAssign(groupId: string | null) {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      setAssignError("Select at least one swimmer");
      return;
    }
    setAssignError(null);
    startTransition(async () => {
      try {
        await assignGroupsBulkAction(teamId, ids, groupId);
        setSelectedIds(new Set());
        refresh();
      } catch (err) {
        setAssignError(err instanceof Error ? err.message : "Failed to assign");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Training groups</CardTitle>
          <CardDescription>
            Partition the roster (Varsity, JV, Age Group) for workouts and AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={handleSubmit(onCreateGroup)}
          >
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="group-name">New group</FieldLabel>
                <Input
                  id="group-name"
                  placeholder="Varsity"
                  disabled={pending}
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>
            </FieldGroup>
            <Button
              type="submit"
              className="w-fit"
              disabled={pending || !name.trim()}
            >
              Add group
            </Button>
            {error ? <FieldError>{error}</FieldError> : null}
          </form>

          {groups.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">
              No groups yet. Add one to assign swimmers.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {groups.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{g.name}</span>
                    <Badge variant="secondary">
                      {groupCounts.get(g.id) ?? 0}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteGroupAction(teamId, g.id);
                        setSelectedIds(new Set());
                        if (filterGroupId === g.id)
                          setFilterGroupId(FILTER_ALL);
                        if (targetGroupId === g.id) {
                          setTargetGroupId(
                            groups.find((group) => group.id !== g.id)?.id ??
                              TARGET_UNASSIGNED,
                          );
                        }
                        refresh();
                      })
                    }
                  >
                    Delete
                  </Button>
                </li>
              ))}
              <li className="text-muted-foreground px-1 text-sm">
                {unassignedCount} unassigned
              </li>
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign swimmers</CardTitle>
          <CardDescription>
            Select multiple swimmers, choose a group, then apply in one step.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add swimmers on the Swimmers tab first.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Field className="sm:max-w-xs sm:flex-1">
                  <FieldLabel htmlFor="group-search">Search</FieldLabel>
                  <Input
                    id="group-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Find a swimmer"
                    disabled={pending}
                  />
                </Field>
                <Field className="sm:max-w-xs sm:flex-1">
                  <FieldLabel htmlFor="group-filter">Show</FieldLabel>
                  <Select
                    items={filterItems}
                    value={filterGroupId}
                    onValueChange={(value) => {
                      if (value != null) setFilterGroupId(value);
                    }}
                  >
                    <SelectTrigger id="group-filter" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {filterItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {groups.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Create a training group above before assigning swimmers.
                </p>
              ) : (
                <div className="bg-muted/40 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {selectedIds.size === 0
                        ? "No swimmers selected"
                        : `${selectedIds.size} selected`}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {filteredMembers.length} shown
                      {selectedVisibleCount > 0 &&
                      selectedVisibleCount !== selectedIds.size
                        ? ` · ${selectedVisibleCount} in this view`
                        : null}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Field className="sm:w-56">
                      <FieldLabel htmlFor="bulk-target">Assign to</FieldLabel>
                      <Select
                        items={targetItems}
                        value={targetGroupId}
                        onValueChange={(value) => {
                          if (value != null) setTargetGroupId(value);
                        }}
                        disabled={pending || selectedIds.size === 0}
                      >
                        <SelectTrigger id="bulk-target" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {targetItems.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Button
                      disabled={pending || selectedIds.size === 0}
                      onClick={() =>
                        applyBulkAssign(
                          targetGroupId === TARGET_UNASSIGNED
                            ? null
                            : targetGroupId,
                        )
                      }
                    >
                      {pending ? "Applying…" : "Apply to selected"}
                    </Button>
                  </div>
                </div>
              )}

              {assignError ? <FieldError>{assignError}</FieldError> : null}

              {filteredMembers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No swimmers match this filter.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allVisibleSelected}
                          indeterminate={someVisibleSelected}
                          onCheckedChange={(checked) =>
                            toggleSelectAllVisible(checked === true)
                          }
                          disabled={pending || filteredIds.length === 0}
                          aria-label="Select all visible swimmers"
                        />
                      </TableHead>
                      <TableHead>Swimmer</TableHead>
                      <TableHead>Current group</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((m) => {
                      const selected = selectedIds.has(m.membershipId);
                      const currentGroup = m.groupId
                        ? (groupNameById.get(m.groupId) ?? "Unknown group")
                        : null;
                      return (
                        <TableRow
                          key={m.membershipId}
                          data-state={selected ? "selected" : undefined}
                          className="data-[state=selected]:bg-muted/50"
                        >
                          <TableCell>
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() =>
                                toggleSelect(m.membershipId)
                              }
                              disabled={pending}
                              aria-label={`Select ${m.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {m.name}
                          </TableCell>
                          <TableCell>
                            {currentGroup ? (
                              <Badge variant="outline">{currentGroup}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Unassigned
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
