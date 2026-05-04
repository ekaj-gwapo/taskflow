import { z } from "zod";

// Password policy: min 8 chars, at least one uppercase, one lowercase, and one number
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const loginSchema = z.object({
  email: z.string().min(1, "Email or Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  phone: z.string().optional(),
  location: z.string().optional(),
  jobTitle: z.string().optional(),
  role: z.string().optional(),
  orgId: z.string().optional(),
  autoVerify: z.boolean().optional(),
});
