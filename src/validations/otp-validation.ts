import { z } from "../utils/zod-openapi";

export const createOtpSchema = z.object({
  body: z.object({
    email: z.email(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.email(),
    otp: z.string().regex(/^\d+$/, "OTP must be numeric"),
  }),
});
