import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  generateOrderNumber,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats a number with K prefix and 2 decimal places", () => {
    expect(formatCurrency(200)).toBe("K200.00");
    expect(formatCurrency(1234.5)).toBe("K1234.50");
    expect(formatCurrency(0)).toBe("K0.00");
  });

  it("handles string input", () => {
    expect(formatCurrency("99.9")).toBe("K99.90");
    expect(formatCurrency("1000")).toBe("K1000.00");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2024-03-15T12:00:00Z"));
    expect(result).toContain("2024");
    expect(result).toContain("15");
  });

  it("formats a date string", () => {
    const result = formatDate("2024-06-01T00:00:00Z");
    expect(result).toContain("2024");
  });
});

describe("formatDateTime", () => {
  it("formats date with time", () => {
    const result = formatDateTime(new Date("2024-03-15T14:30:00Z"));
    expect(result).toContain("2024");
    expect(result).toContain("15");
  });
});

describe("generateOrderNumber", () => {
  it("generates order number with LFM- prefix", () => {
    const orderNum = generateOrderNumber();
    expect(orderNum).toMatch(/^LFM-\d{6}-[A-Z0-9]{4}$/);
  });

  it("generates unique order numbers", () => {
    const numbers = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
    expect(numbers.size).toBe(50);
  });
});

describe("getStatusColor", () => {
  it("returns correct color classes for each status", () => {
    expect(getStatusColor("PENDING_PAYMENT")).toContain("yellow");
    expect(getStatusColor("CONFIRMED")).toContain("blue");
    expect(getStatusColor("SOURCING")).toContain("purple");
    expect(getStatusColor("READY_FOR_PICKUP")).toContain("green");
    expect(getStatusColor("PICKED_UP")).toContain("gray");
    expect(getStatusColor("CANCELLED")).toContain("red");
  });

  it("returns default for unknown status", () => {
    expect(getStatusColor("UNKNOWN")).toContain("gray");
  });
});

describe("getStatusLabel", () => {
  it("returns human-readable labels for each status", () => {
    expect(getStatusLabel("PENDING_PAYMENT")).toBe("Pending Payment");
    expect(getStatusLabel("CONFIRMED")).toBe("Confirmed");
    expect(getStatusLabel("SOURCING")).toBe("Being Sourced");
    expect(getStatusLabel("READY_FOR_PICKUP")).toBe("Ready for Pickup");
    expect(getStatusLabel("PICKED_UP")).toBe("Picked Up");
    expect(getStatusLabel("CANCELLED")).toBe("Cancelled");
  });

  it("returns raw status for unknown status", () => {
    expect(getStatusLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});
