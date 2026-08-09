import { describe, expect, it } from "vitest";
import { env } from "../src/config.js";

describe("env", () => {
  it("설정된 변수 값을 돌려준다", () => {
    process.env.__TEST_VAR = "abc";
    expect(env("__TEST_VAR")).toBe("abc");
  });
  it("없는 변수는 이름을 담아 throw한다", () => {
    delete process.env.__MISSING_VAR;
    expect(() => env("__MISSING_VAR")).toThrow("__MISSING_VAR");
  });
});
