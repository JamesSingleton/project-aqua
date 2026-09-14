import { z } from "zod";

export const firstNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your first name.")
  .max(80, "First name is too long.");

export const lastNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your last name.")
  .max(80, "Last name is too long.");

export const accountProfileFormSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  title: z.string().trim().max(80, "Title is too long."),
});

export type AccountProfileFormValues = z.infer<typeof accountProfileFormSchema>;
