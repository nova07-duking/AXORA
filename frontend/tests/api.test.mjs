import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const output = await build({
  entryPoints: ["src/api/client.js"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  define: { "import.meta.env": "{}" },
});
const { api } = await import(
  "data:text/javascript;base64," +
    Buffer.from(output.outputFiles[0].text).toString("base64")
);
let values;
beforeEach(() => {
  values = new Map();
  globalThis.localStorage = {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
  globalThis.window = new EventTarget();
});
test("public catalog never sends the stored bearer token", async () => {
  localStorage.setItem("axora_token", "private");
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/services");
    assert.equal(options.headers.Authorization, undefined);
    return Response.json([]);
  };
  assert.deepEqual(await api.getServices(), []);
});
test("protected API sends token and propagates validation errors", async () => {
  localStorage.setItem("axora_token", "private");
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.Authorization, "Bearer private");
    return Response.json(
      {
        message: "Données invalides",
        errors: { message: ["Message trop court"] },
      },
      { status: 422 },
    );
  };
  await assert.rejects(
    api.createQuoteRequest({ message: "a" }),
    (e) => e.status === 422 && e.errors.message[0] === "Message trop court",
  );
});
test("invalidated token notifies the application", async () => {
  localStorage.setItem("axora_token", "expired");
  let notified = false;
  window.addEventListener("axora:unauthorized", () => {
    notified = true;
  });
  globalThis.fetch = async () =>
    Response.json({ message: "Non connecté" }, { status: 401 });
  await assert.rejects(api.me());
  assert.equal(notified, true);
});
test("late 401 from an old request does not invalidate a newer session", async () => {
  localStorage.setItem("axora_token", "old");
  let notified = false;
  window.addEventListener("axora:unauthorized", () => {
    notified = true;
  });
  globalThis.fetch = async () => {
    localStorage.setItem("axora_token", "new");
    return Response.json({}, { status: 401 });
  };
  await assert.rejects(api.me());
  assert.equal(notified, false);
  assert.equal(localStorage.getItem("axora_token"), "new");
});
test("server error does not invalidate authentication", async () => {
  localStorage.setItem("axora_token", "valid");
  let notified = false;
  window.addEventListener("axora:unauthorized", () => {
    notified = true;
  });
  globalThis.fetch = async () => new Response("Maintenance", { status: 503 });
  await assert.rejects(api.me(), (e) => e.status === 503);
  assert.equal(notified, false);
  assert.equal(localStorage.getItem("axora_token"), "valid");
});
test("HTML response with status 200 is reported as failure", async () => {
  globalThis.fetch = async () => new Response("<html>PHP warning</html>");
  await assert.rejects(api.getServices(), /illisible/);
});
test("network failure gives a useful retry message", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(api.getServices(), /Vérifiez votre connexion/);
});
