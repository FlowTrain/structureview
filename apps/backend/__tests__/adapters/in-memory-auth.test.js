/**
 * InMemoryAuthAdapter — test-only AuthPort. Maps token → user via a seed Map.
 */
const { createInMemoryAuth } = require("../../src/adapters/in-memory-auth");
const { validateAuthPort } = require("../../src/ports/auth-port");

describe("InMemoryAuthAdapter", () => {
  test("satisfies AuthPort contract", () => {
    expect(() => validateAuthPort(createInMemoryAuth())).not.toThrow();
  });

  test("returns null for an unknown token", async () => {
    const auth = createInMemoryAuth();
    expect(await auth.validateSessionToken("nope")).toBeNull();
  });

  test("returns null for null/empty token (defensive)", async () => {
    const auth = createInMemoryAuth();
    expect(await auth.validateSessionToken(null)).toBeNull();
    expect(await auth.validateSessionToken("")).toBeNull();
    expect(await auth.validateSessionToken(undefined)).toBeNull();
  });

  test("returns the seeded user when token matches", async () => {
    const auth = createInMemoryAuth({
      seed: { "tok-alice": { userId: "u_1", email: "alice@example.com" } },
    });
    expect(await auth.validateSessionToken("tok-alice")).toEqual({
      userId: "u_1",
      email: "alice@example.com",
    });
  });

  test("seed() adds a new token mapping at runtime", async () => {
    const auth = createInMemoryAuth();
    auth.seed("tok-bob", { userId: "u_2", email: "bob@example.com" });
    const user = await auth.validateSessionToken("tok-bob");
    expect(user.userId).toBe("u_2");
  });

  test('id is "in-memory"', () => {
    expect(createInMemoryAuth().id).toBe("in-memory");
  });
});
