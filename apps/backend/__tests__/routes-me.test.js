/**
 * /me — returns the authenticated user.
 * Demonstrates DIP wiring: createApp accepts an `auth` port.
 */
const { createApp } = require("../src/app");
const { createInMemoryAuth } = require("../src/adapters/in-memory-auth");

function seededApp() {
  const auth = createInMemoryAuth({
    seed: { "tok-alice": { userId: "u_1", email: "alice@example.com" } },
  });
  return createApp({ auth });
}

describe("GET /me", () => {
  test("401 when no Authorization header", async () => {
    const app = seededApp();
    const res = await app.inject({ method: "GET", url: "/me" });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  test("401 when token is invalid", async () => {
    const app = seededApp();
    const res = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: "Bearer wrong" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  test("200 with userId+email when token is valid", async () => {
    const app = seededApp();
    const res = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: "Bearer tok-alice" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ userId: "u_1", email: "alice@example.com" });
    await app.close();
  });

  test('accepts "bearer" in lower-case', async () => {
    const app = seededApp();
    const res = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: "bearer tok-alice" },
    });
    expect(res.statusCode).toBe(200);
    await app.close();
  });

  test("401 when Authorization header lacks Bearer prefix", async () => {
    const app = seededApp();
    const res = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: "tok-alice" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});

describe("createApp with custom ports", () => {
  test("defaults to in-memory auth when no port is provided", async () => {
    const app = createApp(); // no opts.auth — falls back to in-memory
    const res = await app.inject({ method: "GET", url: "/me" });
    expect(res.statusCode).toBe(401); // empty in-memory, no users seeded
    await app.close();
  });
});
