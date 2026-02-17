import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to mock NextRequest/NextResponse since they're server-only
vi.mock("next/server", () => {
  return {
    NextRequest: class {
      headers: Map<string, string>;
      nextUrl: { pathname: string };
      constructor(url: string, init?: { headers?: Record<string, string> }) {
        this.headers = new Map(Object.entries(init?.headers || {}));
        this.nextUrl = { pathname: new URL(url).pathname };
      }
    },
    NextResponse: {
      json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
        body,
        status: init?.status || 200,
        headers: init?.headers || {},
      }),
    },
  };
});

// Import after mock
const { rateLimit } = await import("@/lib/rate-limit");
const { NextRequest } = await import("next/server");

function createRequest(path: string, ip = "127.0.0.1") {
  return new NextRequest(`http://localhost${path}`, {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rateLimit", () => {
  beforeEach(() => {
    // Reset the rate limit store between tests by advancing time
    vi.useFakeTimers();
    vi.advanceTimersByTime(120 * 1000); // advance past any window
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const req = createRequest("/api/test", "10.0.0.1");
    const result = rateLimit(req as any, { limit: 5, windowSeconds: 60 });
    expect(result).toBeNull();
  });

  it("blocks requests over the limit", () => {
    const ip = "10.0.0.2";
    const options = { limit: 3, windowSeconds: 60 };

    for (let i = 0; i < 3; i++) {
      const req = createRequest("/api/block-test", ip);
      const result = rateLimit(req as any, options);
      expect(result).toBeNull();
    }

    // 4th request should be blocked
    const req = createRequest("/api/block-test", ip);
    const result = rateLimit(req as any, options);
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(429);
  });

  it("isolates rate limits by IP", () => {
    const options = { limit: 1, windowSeconds: 60 };

    const req1 = createRequest("/api/ip-test", "10.0.0.3");
    expect(rateLimit(req1 as any, options)).toBeNull();

    // Different IP should not be blocked
    const req2 = createRequest("/api/ip-test", "10.0.0.4");
    expect(rateLimit(req2 as any, options)).toBeNull();
  });

  it("isolates rate limits by path", () => {
    const options = { limit: 1, windowSeconds: 60 };
    const ip = "10.0.0.5";

    const req1 = createRequest("/api/path-a", ip);
    expect(rateLimit(req1 as any, options)).toBeNull();

    // Different path should not be blocked
    const req2 = createRequest("/api/path-b", ip);
    expect(rateLimit(req2 as any, options)).toBeNull();
  });
});
