import { describe, expect, test } from "bun:test";

import { makeElysiaApp } from "test/util/server";

describe("GET /health", () => {
  test("responds 200 with status, timestamp, and service", async () => {
    const app = makeElysiaApp();

    const res = await app.handle(new Request("http://test/health"));

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.storage).toBe("connected");
    expect(body.service).toBe("Manifold");
    expect(typeof body.timestamp).toBe("number");
  });
});
