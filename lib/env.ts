/**
 * Environment variable helpers with lazy validation.
 * Values are read from process.env on each access so they work correctly
 * both at build time (where secrets aren't set) and at runtime.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Lazily validated env object — throws only when a property is accessed at runtime */
export const env = {
  // Database
  get POSTGRES_PRISMA_URL() { return requireEnv("POSTGRES_PRISMA_URL"); },

  // Auth
  get NEXTAUTH_SECRET() { return requireEnv("NEXTAUTH_SECRET"); },
  get NEXTAUTH_URL() { return process.env.NEXTAUTH_URL || "http://localhost:3000"; },
  get APP_BASE_URL() { return process.env.APP_BASE_URL || "http://localhost:3000"; },

  // Payment (Lenco)
  get LENCO_SECRET_KEY() { return requireEnv("LENCO_SECRET_KEY"); },
  get LENCO_WEBHOOK_SECRET() { return requireEnv("LENCO_WEBHOOK_SECRET"); },
  get LENCO_BASE_URL() { return process.env.LENCO_BASE_URL || "https://api.lenco.co/access/v2"; },

  // Email
  get RESEND_API_KEY() { return requireEnv("RESEND_API_KEY"); },
  get RESEND_FROM_EMAIL() { return process.env.RESEND_FROM_EMAIL || "noreply@localfarmersmarket.zm"; },

  // Storage
  get BLOB_READ_WRITE_TOKEN() { return process.env.BLOB_READ_WRITE_TOKEN || ""; },

  // Cron
  get CRON_SECRET() { return process.env.CRON_SECRET || ""; },
};
