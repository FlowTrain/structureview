const { validateEntitlementPort } = require("../../src/ports/entitlement-port");

const valid = {
  id: "in-memory",
  get: async () => null,
  set: async () => {},
};

describe("validateEntitlementPort", () => {
  test("accepts a valid port", () => {
    expect(() => validateEntitlementPort(valid)).not.toThrow();
  });
  test("rejects when id is empty", () => {
    expect(() => validateEntitlementPort({ ...valid, id: "" })).toThrow(/id/);
  });
  test("rejects when get is not a function", () => {
    expect(() => validateEntitlementPort({ ...valid, get: null })).toThrow(
      /get/,
    );
  });
  test("rejects when set is not a function", () => {
    expect(() => validateEntitlementPort({ ...valid, set: 42 })).toThrow(/set/);
  });
  test("returns the port when valid", () => {
    expect(validateEntitlementPort(valid)).toBe(valid);
  });
});
