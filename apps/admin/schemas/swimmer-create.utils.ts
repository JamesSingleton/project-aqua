import type { CreateSwimmerFormValues } from "@/schemas";

function emptyToUndefined(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined;
}

function hasValues(record: Record<string, string | undefined> | undefined) {
  if (!record) return false;
  return Object.values(record).some((value) => value?.trim());
}

export function normalizeCreateSwimmerFormValues(
  values: CreateSwimmerFormValues,
): CreateSwimmerFormValues {
  const contacts = values.contacts
    ? {
        parentName: emptyToUndefined(values.contacts.parentName),
        parentEmail: emptyToUndefined(values.contacts.parentEmail),
        parentPhone: emptyToUndefined(values.contacts.parentPhone),
        emergencyName: emptyToUndefined(values.contacts.emergencyName),
        emergencyPhone: emptyToUndefined(values.contacts.emergencyPhone),
      }
    : undefined;

  const medical = values.medical
    ? {
        allergies: emptyToUndefined(values.medical.allergies),
        medications: emptyToUndefined(values.medical.medications),
        conditions: emptyToUndefined(values.medical.conditions),
        notes: emptyToUndefined(values.medical.notes),
      }
    : undefined;

  return {
    ...values,
    middleName: emptyToUndefined(values.middleName),
    preferredName: emptyToUndefined(values.preferredName),
    practiceGroup: emptyToUndefined(values.practiceGroup),
    usaMemberId: emptyToUndefined(values.usaMemberId),
    email: emptyToUndefined(values.email),
    phone: emptyToUndefined(values.phone),
    contacts: hasValues(contacts) ? contacts : undefined,
    medical: hasValues(medical) ? medical : undefined,
    linkExistingSwimmerId: emptyToUndefined(values.linkExistingSwimmerId),
  };
}
