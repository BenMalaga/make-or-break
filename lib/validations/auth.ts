import { z } from "zod";

/** Username: 3-20 chars, letters/numbers/_/-, must start with a letter or number. */
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, "Use letters, numbers, - or _");

// `email` here is an identifier: it accepts either an email address or a
// username. Resolved in the Credentials authorize() callback.
export const loginSchema = z.object({
  email: z.string().min(1, "Enter your email or username"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, "You must accept the rules of engagement"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
