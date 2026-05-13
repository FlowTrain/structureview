/**
 * Backend app smoke + /health route.
 *
 * createApp() returns a Fastify instance; tests use fastify.inject()
 * — no real port binding required. Test-First per Practice 6.
 */
const { createApp } = require("../src/app");

describe("createApp", () => {
  test("returns a Fastify instance", () => {
    const app = createApp();
    expect(typeof app.inject).toBe("function");
    expect(typeof app.listen).toBe("function");
  });
});

describe("GET /health", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });
  afterAll(async () => {
    await app.close();
  });

  test("returns 200 with status=ok and a version field", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.version).toBe("string");
  });

  test("returns Content-Type: application/json", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});

describe("unknown routes", () => {
  test("return 404", async () => {
    const app = createApp();
    const res = await app.inject({ method: "GET", url: "/nope" });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});
