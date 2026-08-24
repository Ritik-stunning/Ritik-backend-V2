import { z } from "../utils/zod-openapi";

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).optional(),
  }),
});
