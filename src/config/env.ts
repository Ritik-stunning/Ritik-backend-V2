import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const base64Key32 = z.string().refine((v) => {
  try {
    return Buffer.from(v, "base64").length === 32;
  } catch {
    return false;
  }
}, "must be a base64-encoded 32-byte key");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default("/api/v1"),
  LOG_LEVEL: z.string().default("info"),

  // Default timeout for outbound HTTP calls (see src/lib/http).
  HTTP_TIMEOUT_MS: z.coerce.number().default(10000),

  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),

  REDIS_URL: z.string().default("redis://localhost:6379"),

  JWT_ACCESS_SECRET: z.string().min(1),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),

  DATA_ENCRYPTION_KEY: base64Key32,
  BLIND_INDEX_KEY: base64Key32,
  ENC_KEY_VERSION: z.coerce.number().int().positive().default(1),
  DEFAULT_COUNTRY: z.string().default("IN"),

  OTP_LENGTH: z.coerce.number().default(6),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN: z.coerce.number().default(60),

  EMAIL_PROVIDER: z.enum(["console", "google"]).default("console"),
  GOOGLE_SMTP_HOST: z.string().default("smtp.gmail.com"),
  GOOGLE_SMTP_PORT: z.coerce.number().default(587),
  GOOGLE_WORKSPACE_USER: z.string().default(""),
  GOOGLE_WORKSPACE_APP_PASSWORD: z.string().default(""),
  EMAIL_FROM: z.string().default("no-reply@stunningdentistry.in"),
  EMAIL_FROM_NAME: z.string().default("Stunning Dentistry"),
  TEST_EMAIL_DEV: z.string().default("harshit@stunningdentistry.in"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    JSON.stringify(parsed.error.issues, null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
