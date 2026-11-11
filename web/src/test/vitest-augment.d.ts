// Module augmentation: adds jest-axe's matcher to Vitest's Assertion type.
// This file must stay a module (hence the import) for the augmentation to apply
// instead of replacing vitest's own types.
import "vitest";

declare module "vitest" {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
