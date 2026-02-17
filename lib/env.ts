/**
 * Validate required environment variables at import time.
 * Import this module early (e.g. in lib/prisma.ts or layout.tsx) so
 * the app fails fast if configuration is missing.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

// Database
export const POSTGRES_PRISMA_URL = requireEnv("POSTGRES_PRISMA_URL");

// Auth
export const NEXTAUTH_SECRET = requireEnv("NEXTAUTH_SECRET");
export const NEXTAUTH_URL = optionalEnv("NEXTAUTH_URL", "http://localhost:3000");
export const APP_BASE_URL = optionalEnv("APP_BASE_URL", "http://localhost:3000");

// Payment (Lenco)
export const LENCO_SECRET_KEY = requireEnv("LENCO_SECRET_KEY");
export const LENCO_WEBHOOK_SECRET = requireEnv("LENCO_WEBHOOK_SECRET");
export const LENCO_BASE_URL = optionalEnv("LENCO_BASE_URL", "https://api.lenco.co/access/v2");

// Email
export const RESEND_API_KEY = requireEnv("RESEND_API_KEY");
export const RESEND_FROM_EMAIL = optionalEnv("RESEND_FROM_EMAIL", "noreply@localfarmersmarket.zm");

// Storage
export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";

// Cron
export const CRON_SECRET = process.env.CRON_SECRET || "";
