import { withAlpha } from "@/utils/color";
describe("withAlpha", () => {
  it("handles rgb() token strings (the bug)", () => {
    expect(withAlpha("rgb(255, 255, 255)", 0.2)).toBe("rgba(255, 255, 255, 0.2)");
  });
  it("handles hex", () => {
    expect(withAlpha("#054463", 0.5)).toBe("rgba(5, 68, 99, 0.5)");
    expect(withAlpha("#fff", 1)).toBe("rgba(255, 255, 255, 1)");
  });
  it("composes with existing alpha", () => {
    expect(withAlpha("rgba(0, 0, 0, 0.5)", 0.5)).toBe("rgba(0, 0, 0, 0.25)");
  });
  it("passes through transparent and junk", () => {
    expect(withAlpha("transparent", 0.5)).toBe("transparent");
    expect(withAlpha("papayawhip", 0.5)).toBe("papayawhip");
  });
});
