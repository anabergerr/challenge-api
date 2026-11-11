import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

/**
 * Proves the axe setup actually detects problems. Without this, a matcher that
 * silently passes everything would look identical to a clean codebase.
 */
describe("axe setup", () => {
  it("flags a button with no accessible name", async () => {
    const { container } = render(<button type="button" />);

    const results = await axe(container);

    expect(results.violations.length).toBeGreaterThan(0);
    expect(results.violations.map((v) => v.id)).toContain("button-name");
  });

  it("flags an image without alt text", async () => {
    const { container } = render(<img src="rover.png" />);

    const results = await axe(container);

    expect(results.violations.map((v) => v.id)).toContain("image-alt");
  });

  it("passes a properly labelled button", async () => {
    const { container } = render(<button type="button">Lancar sonda</button>);

    expect(await axe(container)).toHaveNoViolations();
  });
});
