// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { statSync } from "node:fs";
import { resolve } from "node:path";

import { execSync } from "node:child_process";

const inventoryMtime = (() => {
  try {
    const gitTime = execSync("git log -1 --format=%cI src/data/seed.csv", { encoding: "utf8" }).trim();
    if (gitTime) return gitTime;
  } catch {}
  try {
    return statSync(resolve(__dirname, "src/data/seed.csv")).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
})();

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      __INVENTORY_UPDATED_AT__: JSON.stringify(inventoryMtime),
    },
  },
});
