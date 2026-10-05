import { defineConfig } from "vitest/config";

// Unit tests only. Playwright owns e2e/, and agent worktrees under .claude/
// carry their own copies of the suite.
export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
});
