import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import React from "react";
import { create, act } from "react-test-renderer";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const output = await build({
  entryPoints: ["src/context/AuthContext.jsx"],
  bundle: true,
  write: false,
  format: "cjs",
  platform: "node",
  packages: "external",
  plugins: [
    {
      name: "auth-api-fixture",
      setup(builder) {
        builder.onResolve({ filter: /api\/client$/ }, () => ({
          path: "api",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents:
            "export const api = new Proxy({}, { get: (_, key) => globalThis.__authApi[key] });",
          loader: "js",
        }));
      },
    },
  ],
});
const compiled = { exports: {} };
new Function("require", "module", "exports", output.outputFiles[0].text)(
  require,
  compiled,
  compiled.exports,
);
const { AuthProvider, useAuth } = compiled.exports;

test("an old session lookup failure cannot block a successful new login", async () => {
  const storage = new Map([["axora_token", "old-token"]]);
  globalThis.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, v),
    removeItem: (k) => storage.delete(k),
  };
  globalThis.window = new EventTarget();
  let rejectOldRequest, auth, renderer;
  globalThis.__authApi = {
    me: () =>
      new Promise((_, reject) => {
        rejectOldRequest = reject;
      }),
    login: async () => ({
      token: "new-token",
      user: { id: 2, name: "Compte connecté" },
    }),
  };
  function Capture() {
    auth = useAuth();
    return null;
  }
  try {
    await act(async () => {
      renderer = create(
        React.createElement(AuthProvider, null, React.createElement(Capture)),
      );
    });
    await act(async () => {
      await auth.login({ email: "client@example.test", password: "test-only" });
    });
    await act(async () => {
      rejectOldRequest(new Error("Network unavailable"));
    });
    assert.equal(auth.user.id, 2);
    assert.equal(auth.authError, "");
    assert.equal(auth.loading, false);
    assert.equal(storage.get("axora_token"), "new-token");
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    delete globalThis.__authApi;
  }
});
