import { defineProject } from "vitest/config";

export default defineProject({
  test: { name: "games", include: ["src/**/*.test.ts"] },
});
