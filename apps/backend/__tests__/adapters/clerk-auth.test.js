/**
 * ClerkAdapter — production AuthPort backed by Clerk's verifyToken().
 *
 * The adapter receives a `verifyToken` function (DIP) rather than importing
 * @clerk/clerk-sdk-node directly. Production wires the real SDK call;
 * tests inject a stub.
 */
const { createClerkAuth } = require("../../src/adapters/clerk-auth");
const { validateAuthPort } = require("../../src/ports/auth-port");

describe("ClerkAdapter", () => {
  test("satisfies AuthPort contract", () => {
    const adapter = createClerkAuth({ verifyToken: async () => null });
    expect(() => validateAuthPort(adapter)).not.toThrow();
  });

  test('id is "clerk"', () => {
    expect(createClerkAuth({ verifyToken: async () => null }).id).toBe("clerk");
  });

  test("returns null on empty/null token without calling verifyToken", async () => {
    let called = false;
    const adapter = createClerkAuth({
      verifyToken: async () => {
        called = true;
        return { sub: "x" };
      },
    });
    expect(await adapter.validateSessionToken("")).toBeNull();
    expect(await adapter.validateSessionToken(null)).toBeNull();
    expect(called).toBe(false);
  });

  test("returns null when verifyToken returns null", async () => {
    const adapter = createClerkAuth({ verifyToken: async () => null });
    expect(await adapter.validateSessionToken("whatever")).toBeNull();
  });

  test("returns null when verifyToken throws (e.g. expired token)", async () => {
    const adapter = createClerkAuth({
      verifyToken: async () => {
        throw new Error("expired");
      },
    });
    expect(await adapter.validateSessionToken("expired-tok")).toBeNull();
  });

  test("maps verifyToken claims → {userId,email} on success", async () => {
    const adapter = createClerkAuth({
      verifyToken: async () => ({ sub: "user_xyz", email: "a@b.test" }),
    });
    expect(await adapter.validateSessionToken("valid")).toEqual({
      userId: "user_xyz",
      email: "a@b.test",
    });
  });

  test("omits email when claims do not include one", async () => {
    const adapter = createClerkAuth({
      verifyToken: async () => ({ sub: "user_xyz" }),
    });
    expect(await adapter.validateSessionToken("valid")).toEqual({
      userId: "user_xyz",
    });
  });

  test("throws at construction when verifyToken is missing", () => {
    expect(() => createClerkAuth({})).toThrow(/verifyToken/);
  });
});
