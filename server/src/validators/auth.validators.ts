import { z } from "zod";

// Client's notes: "Set password: Alpha numeric" — interpreted as
// letters-and-digits only (no symbols), containing at least one of each.
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password is too long") // bcrypt's own input limit
  .regex(/^[A-Za-z0-9]+$/, "Password can only contain letters and numbers")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Age is only sanity-checked here (a positive, plausible age). The real
// 5-12 business rule is enforced in the service layer, where it can return
// the client's specific "age too high"/"too young" response rather than a
// generic validation error.
const ageSchema = z.coerce.number().int().min(1).max(120);

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  middleName: z.string().trim().max(100).optional().or(z.literal("")),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  age: ageSchema,
  mobileNumber: z.string().trim().min(4, "Mobile number is required").max(30),
  hobbies: z.string().trim().min(1, "Hobbies are required").max(255),
  favoriteColor: z.string().trim().min(1, "Favourite colour is required").max(50),
  favoriteAnimal: z.string().trim().min(1, "Favourite animal is required").max(50),
  password: passwordSchema,
});

export const loginSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  password: z.string().min(1, "Password is required"),
});
