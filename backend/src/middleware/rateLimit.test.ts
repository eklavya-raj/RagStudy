import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { rateLimit, cleanupRateLimitStore, getRateLimitStore } from "./rateLimit";

vi.mock("@clerk/express", () => ({
  getAuth: (_req: Request) => ({ userId: (_req as Request & { _userId?: string })._userId ?? null }),
}));

function makeReq(userId: string | null = null, ip = "127.0.0.1") {
  return { _userId: userId, ip } as unknown as Request & { _userId: string | null };
}

function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    _status: 200,
    _body: null as unknown,
    headers,
    set: (k: string, v: string) => { headers[k] = v; },
    status: function (code: number) { this._status = code; return this; },
    json: function (body: unknown) { this._body = body; return this; },
  };
  return res as unknown as Response & { _status: number; _body: unknown; headers: Record<string, string> };
}

const next: NextFunction = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  getRateLimitStore().clear();
});

afterEach(() => {
  getRateLimitStore().clear();
});

describe("rateLimit middleware", () => {
  it("calls next() on first request", () => {
    const mw = rateLimit({ windowMs: 60_000, maxRequests: 5 });
    mw(makeReq("user1"), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("sets X-RateLimit headers", () => {
    const mw = rateLimit({ windowMs: 60_000, maxRequests: 10 });
    const res = makeRes();
    mw(makeReq("user1"), res, next);
    expect(res.headers["X-RateLimit-Limit"]).toBe("10");
    expect(res.headers["X-RateLimit-Remaining"]).toBe("9");
  });

  it("returns 429 when limit is exceeded", () => {
    const mw = rateLimit({ windowMs: 60_000, maxRequests: 3 });
    const req = makeReq("user2");
    for (let i = 0; i < 3; i++) mw(req, makeRes(), next);
    const res = makeRes();
    mw(req, res, next);
    expect(res._status).toBe(429);
    expect((res._body as Record<string, unknown>).error).toBe("Too many requests");
  });

  it("does not call next() on 429 response", () => {
    const mw = rateLimit({ windowMs: 60_000, maxRequests: 1 });
    const req = makeReq("user3");
    mw(req, makeRes(), next);
    vi.clearAllMocks();
    mw(req, makeRes(), next);
    expect(next).not.toHaveBeenCalled();
  });

  it("uses IP as key when no userId", () => {
    const mw = rateLimit({ windowMs: 60_000, maxRequests: 2 });
    const req = makeReq(null, "10.0.0.1");
    mw(req, makeRes(), next);
    mw(req, makeRes(), next);
    const res = makeRes();
    mw(req, res, next);
    expect(res._status).toBe(429);
  });

  it("tracks different users independently", () => {
    const mw = rateLimit({ windowMs: 60_000, maxRequests: 1 });
    mw(makeReq("userA"), makeRes(), next);
    const resB = makeRes();
    mw(makeReq("userB"), resB, next);
    expect(resB._status).toBe(200);
  });

  it("uses custom keyGenerator when provided", () => {
    const mw = rateLimit({
      windowMs: 60_000,
      maxRequests: 1,
      keyGenerator: () => "fixed-key",
    });
    mw(makeReq("userX"), makeRes(), next);
    const res = makeRes();
    mw(makeReq("userY"), res, next);
    expect(res._status).toBe(429);
  });

  it("sets Retry-After header on 429", () => {
    const mw = rateLimit({ windowMs: 60_000, maxRequests: 1 });
    const req = makeReq("user4");
    mw(req, makeRes(), next);
    const res = makeRes();
    mw(req, res, next);
    expect(res.headers["Retry-After"]).toBeDefined();
  });
});

describe("cleanupRateLimitStore", () => {
  it("removes expired records", () => {
    const store = getRateLimitStore();
    store.set("old", { count: 1, resetTime: Date.now() - 1000 });
    store.set("fresh", { count: 1, resetTime: Date.now() + 60_000 });
    cleanupRateLimitStore();
    expect(store.has("old")).toBe(false);
    expect(store.has("fresh")).toBe(true);
  });

  it("does nothing on empty store", () => {
    expect(() => cleanupRateLimitStore()).not.toThrow();
  });
});
