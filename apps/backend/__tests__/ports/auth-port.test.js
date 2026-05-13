/**
 * AuthPort — contract every auth provider implements (ADR-0001).
 */
const { validateAuthPort } = require("../../src/ports/auth-port");

const valid = {
  id: "in-memory",
  validateSessionToken: async () => null,
};

describe("validateAuthPort", () => {
  test("accepts a valid port", () => {
    expect(() => validateAuthPort(valid)).not.toThrow();
  });

  test("rejects when id is missing", () => {
    expect(() => validateAuthPort({ ...valid, id: "" })).toThrow(/id/);
  });

  test("rejects when validateSessionToken is not a function", () => {
    expect(() =>
      validateAuthPort({ ...valid, validateSessionToken: "no" }),
    ).toThrow(/validateSessionToken/);
  });

  test("returns the port when valid (chainable)", () => {
    expect(validateAuthPort(valid)).toBe(valid);
  });
});
