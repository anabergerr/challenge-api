// jest-axe ships no type definitions. This declares just what the tests use.
//
// In jest-axe 11, `toHaveNoViolations` is an object holding a matcher method
// (not a bare function), which is also what `expect.extend` expects.
declare module "jest-axe" {
  import type { AxeResults } from "axe-core";

  /** Run axe against a DOM node and resolve with the results. */
  export function axe(container: Element | Document): Promise<AxeResults>;

  /** Matcher object that fails when the results contain violations. */
  export const toHaveNoViolations: {
    toHaveNoViolations(
      this: unknown,
      results: AxeResults,
    ): { pass: boolean; message: () => string };
  };
}
