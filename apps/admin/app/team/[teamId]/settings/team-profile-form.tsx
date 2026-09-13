"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateTeamProfileAction } from "./actions";

export function TeamProfileForm({
  teamId,
  name,
  teamCode,
  lscCode,
  addressLine1 = "",
  addressLine2 = "",
  city = "",
  region = "",
  postalCode = "",
  country = "",
}: {
  teamId: string;
  name: string;
  teamCode: string;
  lscCode: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [teamName, setTeamName] = useState(name);
  const [abbrev, setAbbrev] = useState(teamCode);
  const [lsc, setLsc] = useState(lscCode);
  const [line1, setLine1] = useState(addressLine1 ?? "");
  const [line2, setLine2] = useState(addressLine2 ?? "");
  const [cityVal, setCityVal] = useState(city ?? "");
  const [regionVal, setRegionVal] = useState(region ?? "");
  const [postal, setPostal] = useState(postalCode ?? "");
  const [countryVal, setCountryVal] = useState(country ?? "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const savedLine1 = addressLine1 ?? "";
  const savedLine2 = addressLine2 ?? "";
  const savedCity = city ?? "";
  const savedRegion = region ?? "";
  const savedPostal = postalCode ?? "";
  const savedCountry = country ?? "";

  const dirty =
    teamName.trim() !== name ||
    abbrev.trim().toUpperCase() !== teamCode ||
    lsc.trim().toUpperCase() !== lscCode ||
    (line1 ?? "").trim() !== savedLine1 ||
    (line2 ?? "").trim() !== savedLine2 ||
    (cityVal ?? "").trim() !== savedCity ||
    (regionVal ?? "").trim().toUpperCase() !== savedRegion ||
    (postal ?? "").trim() !== savedPostal ||
    (countryVal ?? "").trim().toUpperCase() !== savedCountry;

  function save() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await updateTeamProfileAction(teamId, {
        name: teamName,
        teamCode: abbrev,
        lscCode: lsc,
        addressLine1: line1,
        addressLine2: line2,
        city: cityVal,
        region: regionVal,
        postalCode: postal,
        country: countryVal,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Team profile updated");
      router.refresh();
    });
  }

  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel htmlFor="team-name">Team name</FieldLabel>
        <Input
          id="team-name"
          value={teamName}
          onChange={(e) => {
            setTeamName(e.target.value);
            setMessage("");
            setError("");
          }}
          disabled={pending}
          required
        />
      </Field>
      <div className="grid max-w-md grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="team-code">Team abbreviation</FieldLabel>
          <Input
            id="team-code"
            value={abbrev}
            onChange={(e) => {
              setAbbrev(e.target.value.toUpperCase());
              setMessage("");
              setError("");
            }}
            disabled={pending}
            placeholder="MARI"
            maxLength={8}
            autoComplete="off"
            spellCheck={false}
          />
          <FieldDescription>2-5 letters (MARI, DSUN, AZSL).</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="lsc-code">LSC</FieldLabel>
          <Input
            id="lsc-code"
            value={lsc}
            onChange={(e) => {
              setLsc(e.target.value.toUpperCase());
              setMessage("");
              setError("");
            }}
            disabled={pending}
            placeholder="AZ"
            maxLength={2}
            autoComplete="off"
            spellCheck={false}
          />
          <FieldDescription>
            Local Swimming Committee (AZ, GA, PC). Combined as MARI-AZ.
          </FieldDescription>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="address-line1">Street address</FieldLabel>
        <Input
          id="address-line1"
          value={line1}
          onChange={(e) => {
            setLine1(e.target.value);
            setMessage("");
            setError("");
          }}
          disabled={pending}
          autoComplete="address-line1"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="address-line2">Address line 2</FieldLabel>
        <Input
          id="address-line2"
          value={line2}
          onChange={(e) => {
            setLine2(e.target.value);
            setMessage("");
            setError("");
          }}
          disabled={pending}
          autoComplete="address-line2"
        />
      </Field>
      <div className="grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="team-city">City</FieldLabel>
          <Input
            id="team-city"
            value={cityVal}
            onChange={(e) => {
              setCityVal(e.target.value);
              setMessage("");
              setError("");
            }}
            disabled={pending}
            autoComplete="address-level2"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="team-region">State</FieldLabel>
          <Input
            id="team-region"
            value={regionVal}
            onChange={(e) => {
              setRegionVal(e.target.value.toUpperCase());
              setMessage("");
              setError("");
            }}
            disabled={pending}
            placeholder="AZ"
            maxLength={2}
            autoComplete="address-level1"
            spellCheck={false}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="team-postal">ZIP</FieldLabel>
          <Input
            id="team-postal"
            value={postal}
            onChange={(e) => {
              setPostal(e.target.value);
              setMessage("");
              setError("");
            }}
            disabled={pending}
            autoComplete="postal-code"
            maxLength={10}
          />
        </Field>
      </div>
      <Field className="max-w-xs">
        <FieldLabel htmlFor="team-country">Country</FieldLabel>
        <Input
          id="team-country"
          value={countryVal}
          onChange={(e) => {
            setCountryVal(e.target.value.toUpperCase());
            setMessage("");
            setError("");
          }}
          disabled={pending}
          placeholder="USA"
          maxLength={3}
          autoComplete="country"
          spellCheck={false}
        />
      </Field>
      {error ? <FieldError>{error}</FieldError> : null}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={pending || !dirty}
          onClick={save}
        >
          {pending ? "Saving…" : "Save profile"}
        </Button>
        {message ? (
          <p className="text-muted-foreground text-xs">{message}</p>
        ) : null}
      </div>
    </FieldGroup>
  );
}
