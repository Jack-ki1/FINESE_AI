import { test as base, expect } from "@playwright/test";

// Extend base test with app-specific fixtures if needed
export const test = base.extend({
  // Example: authenticated page, seeded dataset, etc.
});

export { expect };
