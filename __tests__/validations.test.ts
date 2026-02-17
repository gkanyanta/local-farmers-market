import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  productSchema,
  categorySchema,
  settingsSchema,
  checkoutSchema,
  deviceTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "pass123" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "pass123" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Test User",
    email: "test@example.com",
    phone: "0971234567",
    password: "Password1",
  };

  it("accepts valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects short name", () => {
    expect(registerSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects weak password (no uppercase)", () => {
    expect(registerSchema.safeParse({ ...valid, password: "password1" }).success).toBe(false);
  });

  it("rejects weak password (no number)", () => {
    expect(registerSchema.safeParse({ ...valid, password: "Passwordd" }).success).toBe(false);
  });

  it("rejects short password", () => {
    expect(registerSchema.safeParse({ ...valid, password: "Pass1" }).success).toBe(false);
  });

  it("rejects short phone", () => {
    expect(registerSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  });
});

describe("productSchema", () => {
  const valid = {
    name: "Tomatoes",
    categoryId: "cat-1",
    unit: "kg",
    price: 25.50,
    isPerishable: true,
    isActive: true,
  };

  it("accepts valid product", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects negative price", () => {
    expect(productSchema.safeParse({ ...valid, price: -5 }).success).toBe(false);
  });

  it("rejects price with too many decimals", () => {
    expect(productSchema.safeParse({ ...valid, price: 10.999 }).success).toBe(false);
  });

  it("rejects price exceeding max", () => {
    expect(productSchema.safeParse({ ...valid, price: 1000000 }).success).toBe(false);
  });

  it("rejects missing category", () => {
    expect(productSchema.safeParse({ ...valid, categoryId: "" }).success).toBe(false);
  });
});

describe("categorySchema", () => {
  it("accepts valid category", () => {
    const result = categorySchema.safeParse({ name: "Vegetables", slug: "vegetables" });
    expect(result.success).toBe(true);
  });

  it("rejects short slug", () => {
    const result = categorySchema.safeParse({ name: "Vegetables", slug: "v" });
    expect(result.success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("accepts valid settings", () => {
    const result = settingsSchema.safeParse({ minOrderValue: 200, cutOffTime: "09:00" });
    expect(result.success).toBe(true);
  });

  it("rejects zero min order", () => {
    const result = settingsSchema.safeParse({ minOrderValue: 0, cutOffTime: "09:00" });
    expect(result.success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const valid = {
    customerName: "John Doe",
    customerPhone: "0971234567",
    pickupOption: "OWN_RIDER" as const,
  };

  it("accepts valid checkout", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid pickup option", () => {
    expect(checkoutSchema.safeParse({ ...valid, pickupOption: "INVALID" }).success).toBe(false);
  });
});

describe("deviceTokenSchema", () => {
  it("accepts valid token", () => {
    expect(deviceTokenSchema.safeParse({ token: "abc123", platform: "web" }).success).toBe(true);
  });

  it("rejects invalid platform", () => {
    expect(deviceTokenSchema.safeParse({ token: "abc123", platform: "windows" }).success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "test@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts valid reset", () => {
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "NewPass1!" }).success).toBe(true);
  });

  it("rejects weak password", () => {
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "weak" }).success).toBe(false);
  });
});
