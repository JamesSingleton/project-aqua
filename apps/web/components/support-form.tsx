"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@project-aqua/ui/components/alert";
import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import { Spinner } from "@project-aqua/ui/components/spinner";
import { Textarea } from "@project-aqua/ui/components/textarea";
import { useActionState } from "react";
import { type SupportState, sendSupportMessage } from "@/app/support/actions";

const initial: SupportState = {};

export function SupportForm() {
  const [state, action, pending] = useActionState(sendSupportMessage, initial);

  if (state.success) {
    return (
      <Alert>
        <AlertTitle>Message received</AlertTitle>
        <AlertDescription>
          We will reply to the email you entered.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not send</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="message">Message</FieldLabel>
          <Textarea id="message" name="message" required minLength={10} />
          <FieldDescription>
            Product questions, billing, or a meet file that would not import.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit" className="press-scale w-fit" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Send message
      </Button>
    </form>
  );
}
