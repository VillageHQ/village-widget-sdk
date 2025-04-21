// __tests__/incrementVersion.test.js
const { incrementVersion } = require("../scripts/deploy");

describe("incrementVersion()", () => {
  test("incrementa o patch (3ª parte) corretamente", () => {
    expect(incrementVersion("1.2.3")).toBe("1.2.4");
    expect(incrementVersion("0.0.9")).toBe("0.0.10");
  });
});
