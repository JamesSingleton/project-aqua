import { z } from "zod";

const userStatusSchema = z.union([
  z.literal("active"),
  z.literal("inactive"),
  z.literal("invited"),
  z.literal("suspended"),
]);
export type UserStatus = z.infer<typeof userStatusSchema>;

const userRoleSchema = z.union([
  z.literal("superadmin"),
  z.literal("admin"),
  z.literal("cashier"),
  z.literal("manager"),
]);

const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const userListSchema = z.array(userSchema);

const swimmerSchema = z.object({
  id: z.string().uuid(),
  lastName: z.string(),
  firstName: z.string(),
  gender: z.enum(["Male", "Female"]),
  age: z.number().int().min(10).max(18),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  roster: z.enum(["White", "Red", "Blue", "Rising"]),
  billingGroup: z.enum(["White", "Red", "Blue", "Rising"]),
  billingSubGroup: z.string(),
  competitiveCategory: z.enum(["Male", "Female"]),
  memberType: z.literal("Comp"),
  email: z.string().email(),
  dateJoined: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const swimmerListSchema = z.array(swimmerSchema);
