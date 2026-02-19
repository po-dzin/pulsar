import { z } from "zod";

export const adminRoleSchema = z.enum(["admin", "editor"]);

export const adminRoleAssignSchema = z.object({
  role: adminRoleSchema,
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
});

export const adminRoleRemoveSchema = z.object({
  userId: z.string().uuid(),
  role: adminRoleSchema.optional(),
});
