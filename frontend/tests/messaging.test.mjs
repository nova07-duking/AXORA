import { beforeEach, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import React from "react";
import { create, act } from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import { build } from "esbuild";
const output = await build({
  entryPoints: ["src/components/Messaging.jsx"],
  bundle: true,
  write: false,
  format: "cjs",
  platform: "node",
  packages: "external",
  plugins: [
    {
      name: "fixtures",
      setup(builder) {
        builder.onResolve(
          { filter: /(?:api\/client|context\/AuthContext)$/ },
          (args) => ({ path: args.path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          contents: args.path.endsWith("client")
            ? "export const api = new Proxy({}, {get: (_, key) => globalThis.fixture.api[key]});"
            : 'export const useAuth = () => ({user: {id: 1, name: "Client"}});',
          loader: "js",
        }));
      },
    },
  ],
});
const compiled = { exports: {} };
new Function("require", "module", "exports", output.outputFiles[0].text)(
  createRequire(import.meta.url),
  compiled,
  compiled.exports,
);
const { default: Messaging, mergeMessages } = compiled.exports;
let renderer;
const message = {
  id: 1,
  sender_id: 1,
  sender_name: "Client",
  body: "Bonjour",
  is_staff: false,
  created_at: "2026-09-06T10:00:00Z",
};
beforeEach(() => {
  globalThis.window = new EventTarget();
  window.confirm = () => false;
  globalThis.document = { visibilityState: "visible" };
  globalThis.fixture = {
    api: {
      ownConversation: async () => ({ conversation: null }),
      messages: async () => ({
        messages: [message],
        has_older: false,
        peer_read_id: 0,
      }),
      readMessages: async () => ({}),
      sendMessage: async () => ({ conversation: { id: 1 }, message }),
    },
  };
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  renderer = null;
  delete globalThis.fixture;
  delete globalThis.document;
  delete globalThis.window;
});
async function mount(props = {}) {
  await act(async () => {
    renderer = create(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(Messaging, props),
      ),
    );
  });
}
async function write(value) {
  await act(async () =>
    renderer.root.findByType("textarea").props.onChange({ target: { value } }),
  );
}
async function send() {
  await act(async () =>
    renderer.root
      .findByProps({ className: "message-composer" })
      .props.onSubmit({ preventDefault() {} }),
  );
}
const text = (node) =>
  typeof node === "string" ? node : (node.children || []).map(text).join("");
test("failed send keeps draft and retry reuses delivery id", async () => {
  const deliveries = [];
  fixture.api.sendMessage = async (id, payload) => {
    deliveries.push(payload);
    if (deliveries.length === 1) throw new Error("Connexion perdue");
    return { conversation: { id: 1 }, message };
  };
  await mount();
  await write("Bonjour");
  await send();
  assert.equal(renderer.root.findByType("textarea").props.value, "Bonjour");
  await send();
  assert.equal(deliveries[0].client_nonce, deliveries[1].client_nonce);
  assert.equal(renderer.root.findByType("textarea").props.value, "");
  assert.equal(renderer.root.findAllByType("article").length, 1);
});
test("history merge deduplicates send response and polling and keeps chronological order", () => {
  assert.deepEqual(
    mergeMessages(
      [{ id: 2, body: "second" }],
      [
        { id: 1, body: "first" },
        { id: 2, body: "second" },
      ],
    ).map((m) => m.id),
    [1, 2],
  );
});
test("admin cannot discard a reply by changing conversation without confirmation", async () => {
  fixture.api.conversations = async () => ({
    data: [
      { id: 1, user: { name: "Alice" }, last_message_at: message.created_at },
      { id: 2, user: { name: "Bob" }, last_message_at: message.created_at },
    ],
    last_page: 1,
  });
  await mount({ admin: true });
  const contacts = () =>
    renderer.root.findAllByProps({ className: "message-contact" });
  await act(async () => contacts()[0].props.onClick());
  await write("Brouillon pour Alice");
  await act(async () => contacts()[1].props.onClick());
  assert.equal(text(renderer.root.findByType("h2")), "Alice");
  assert.equal(
    renderer.root.findByType("textarea").props.value,
    "Brouillon pour Alice",
  );
  window.confirm = () => true;
  await act(async () => contacts()[1].props.onClick());
  assert.equal(text(renderer.root.findByType("h2")), "Bob");
  assert.equal(renderer.root.findByType("textarea").props.value, "");
});
test("late history response cannot appear in another client conversation", async () => {
  fixture.api.conversations = async () => ({
    data: [
      { id: 1, user: { name: "Alice" }, last_message_at: message.created_at },
      { id: 2, user: { name: "Bob" }, last_message_at: message.created_at },
    ],
    last_page: 1,
  });
  let resolveFirst;
  fixture.api.messages = (id) =>
    id === 1
      ? new Promise((resolve) => {
          resolveFirst = resolve;
        })
      : Promise.resolve({
          messages: [{ ...message, id: 2, body: "Message Bob" }],
          has_older: false,
          peer_read_id: 0,
        });
  await mount({ admin: true });
  const contacts = () =>
    renderer.root.findAllByProps({ className: "message-contact" });
  await act(async () => contacts()[0].props.onClick());
  await act(async () => contacts()[1].props.onClick());
  await act(async () =>
    resolveFirst({
      messages: [{ ...message, body: "Message Alice" }],
      has_older: false,
      peer_read_id: 0,
    }),
  );
  assert.match(text(renderer.toJSON()), /Message Bob/);
  assert.doesNotMatch(text(renderer.toJSON()), /Message Alice/);
});
