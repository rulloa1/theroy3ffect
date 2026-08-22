// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Load non-VITE_ env vars into process.env for server-side code only.
// These are NOT injected into the client bundle.
const serverEnv = loadEnv(process.env["NODE_ENV"] ?? "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      // Needed for readable Sentry stack traces; maps are uploaded and then
      // deleted by @sentry/vite-plugin in CI so they are never served publicly.
      sourcemap: true,
    },
    plugins: [
      mcpPlugin(),
      // Only active in CI, where SENTRY_AUTH_TOKEN is provided.
      ...(process.env["SENTRY_AUTH_TOKEN"] &&
      process.env["SENTRY_ORG"] &&
      process.env["SENTRY_PROJECT"]
        ? [
            sentryVitePlugin({
              org: process.env["SENTRY_ORG"],
              project: process.env["SENTRY_PROJECT"],
              authToken: process.env["SENTRY_AUTH_TOKEN"],
              ...(process.env["SENTRY_RELEASE"]
                ? { release: { name: process.env["SENTRY_RELEASE"] } }
                : {}),
              sourcemaps: { filesToDeleteAfterUpload: ["**/*.map"] },
              telemetry: false,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(
          process.cwd(),
          "node_modules/entities/lib/decode.js",
        ),
        "entities/lib/encode.js": path.resolve(
          process.cwd(),
          "node_modules/entities/lib/encode.js",
        ),
        entities: path.resolve(process.cwd(), "node_modules/entities"),
        // tslib's CJS entry breaks ESM interop in the Worker bundle
        // (pdf-lib crashes on `__extends` being undefined). Force the ESM build.
        tslib: path.resolve(process.cwd(), "node_modules/tslib/tslib.es6.mjs"),
      },
    },
  },
});
