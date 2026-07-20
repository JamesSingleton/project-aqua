"use client";

import { organization, useSession } from "@project-aqua/auth/client";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type InvitationInfo = {
  id: string;
  email: string;
  role: string | null;
  organizationId: string;
  organizationName?: string;
  status: string;
};

export function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!invitationId) {
      setError("Missing invitation id");
      setFetching(false);
      return;
    }

    let cancelled = false;
    async function load() {
      const result = await organization.getInvitation({
        query: { id: invitationId! },
      });
      if (cancelled) return;
      if (result.error) {
        setError(result.error.message ?? "Invitation not found");
        setFetching(false);
        return;
      }
      const data = result.data as InvitationInfo & {
        organizationName?: string;
        organization?: { name?: string };
      };
      setInvitation({
        id: data.id,
        email: data.email,
        role: data.role,
        organizationId: data.organizationId,
        organizationName:
          data.organizationName ?? data.organization?.name ?? "a team",
        status: data.status,
      });
      setFetching(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [invitationId]);

  async function handleAccept() {
    if (!invitationId) return;
    setLoading(true);
    setError("");
    const result = await organization.acceptInvitation({
      invitationId,
    });
    if (result.error) {
      setError(result.error.message ?? "Failed to accept invitation");
      setLoading(false);
      return;
    }
    const orgId =
      result.data?.member?.organizationId ?? invitation?.organizationId;
    if (orgId) {
      await organization.setActive({ organizationId: orgId });
      router.push(`/team/${orgId}`);
      router.refresh();
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  if (fetching || sessionPending) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Team invitation</CardTitle>
          <CardDescription>Loading invitation…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!invitationId || (error && !invitation)) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invalid invitation</CardTitle>
          <CardDescription>
            {error || "This invitation link is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/sign-in" />}
          >
            Sign in
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!session?.user) {
    const callback = `/accept-invite?id=${encodeURIComponent(invitationId)}`;
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invitation?.organizationName}</CardTitle>
          <CardDescription>
            Sign in or create an account to accept this invitation
            {invitation?.role
              ? ` as ${invitation.role.replaceAll("_", " ")}`
              : ""}
            .
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-2">
          <Button
            nativeButton={false}
            render={
              <Link
                href={`/sign-in?callbackUrl=${encodeURIComponent(callback)}`}
              />
            }
          >
            Sign in
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={`/sign-up?callbackUrl=${encodeURIComponent(callback)}`}
              />
            }
          >
            Sign up
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join {invitation?.organizationName}</CardTitle>
        <CardDescription>
          You were invited as{" "}
          <span className="capitalize">
            {(invitation?.role ?? "member").replaceAll("_", " ")}
          </span>
          . Accepting will add you to this team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-muted-foreground text-sm">
          Signed in as {session.user.email}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleAccept} disabled={loading}>
          {loading ? "Accepting…" : "Accept invitation"}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/onboarding" />}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
