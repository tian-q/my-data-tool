import { defineConfig } from "vitest/config";

// The store is pure logic (no React, no DOM), so a plain node environment is
// all the tests need — fast and dependency-free.
export default defineConfig({ test: { environment: "node" } });
