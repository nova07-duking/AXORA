import { beforeEach, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import React from "react";
import { create, act } from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const output = await build({
  entryPoints: ["src/pages/Admin.jsx"],
  bundle: true,
  write: false,
  format: "cjs",
  platform: "node",
  packages: "external",
  plugins: [
    {
      name: "admin-fixtures",
      setup(builder) {
        builder.onResolve(
          { filter: /(?:api\/client|context\/(?:SiteContext|AuthContext))$/ },
          (args) => ({ path: args.path, namespace: "fixture" }),
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          contents: args.path.endsWith("client")
            ? "export const api = new Proxy({}, { get: (_, key) => globalThis.__adminFixture.api[key] });"
            : args.path.endsWith("SiteContext")
              ? "export const useSite = () => globalThis.__adminFixture.siteContext;"
              : "export const useAuth = () => ({ logout: () => globalThis.__adminFixture.logout() });",
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
const Admin = compiled.exports.default;
let renderer, fixture, dashboardCalls, confirms;
const company = {
  name: "AXORA",
  city: "Libreville",
  email: "team@example.test",
  phone: "",
  address: "",
  hours: "",
  maps_url: "",
  history: "Histoire",
  mission: "Mission",
  vision: "Vision",
  objectives: ["Protéger les données"],
  team: [],
};
const services = [
  {
    id: 1,
    name: "Service A",
    tagline: "Expertise A",
    description: "Description A",
    deliverables: ["Conseil"],
  },
  {
    id: 2,
    name: "Service B",
    tagline: "Expertise B",
    description: "Description B",
    deliverables: ["Audit"],
  },
];
const request = {
  id: 1,
  status: "nouveau",
  message: "Un projet à chiffrer",
  created_at: "2026-09-06T10:00:00Z",
  user: { name: "Client", email: "client@example.test" },
  service: { name: "Service A" },
};
function text(node) {
  return typeof node === "string"
    ? node
    : (node.children || []).map(text).join("");
}
function button(label) {
  const result = renderer.root
    .findAllByType("button")
    .find((b) => text(b).trim() === label);
  assert.ok(result, "Button missing: " + label);
  return result;
}
async function click(label) {
  await act(async () => {
    button(label).props.onClick({ preventDefault() {} });
  });
}
async function mount() {
  await act(async () => {
    renderer = create(
      React.createElement(MemoryRouter, null, React.createElement(Admin)),
    );
  });
}
function title() {
  return text(renderer.root.findByType("h1"));
}

beforeEach(() => {
  dashboardCalls = 0;
  confirms = 0;
  globalThis.window = new EventTarget();
  window.confirm = () => {
    confirms++;
    return false;
  };
  fixture = globalThis.__adminFixture = {
    logout() {},
    siteContext: {
      site: {
        company: structuredClone(company),
        pages: {
          home: { method_steps: [] },
          about: {},
          contact: {},
          footer: {},
        },
      },
      error: "",
      reload: async () => {},
      applySite: () => {},
    },
    api: {
      adminDashboard: async () => {
        dashboardCalls++;
        return {
          totals: { quote: 1, audit: 0, appointment: 0 },
          pending: 1,
          active: 0,
          clients: 1,
          upcoming_count: 0,
          upcoming: [],
          recent: [],
        };
      },
      adminRequests: async (kind) => ({
        data: [
          {
            ...structuredClone(request),
            ...(kind === "quote"
              ? {}
              : {
                  kind,
                  subject: "Demande client",
                  preferred_at:
                    kind === "appointment" ? "2026-09-08T10:00:00Z" : null,
                }),
          },
        ],
        total: 1,
        current_page: 1,
        last_page: 1,
      }),
      getServices: async () => structuredClone(services),
      updateService: async (id, body) => ({ id, ...body }),
      updateSite: async (body) => ({ company: body, pages: body.pages }),
      updateRequest: async () => ({}),
    },
  };
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  renderer = null;
  delete globalThis.__adminFixture;
});

test("clicking the current dashboard does not leave an endless loading state", async () => {
  await mount();
  await click("Vue d’ensemble");
  assert.equal(title(), "Vue d’ensemble");
  assert.equal(dashboardCalls, 1);
  assert.ok(!text(renderer.root).includes("Chargement de votre espace…"));
});
test("navigation between different response shapes remains renderable", async () => {
  await mount();
  for (const section of [
    "Devis",
    "Catalogue des services",
    "Pages publiques",
    "Vue d’ensemble",
    "Rendez-vous",
  ]) {
    await click(section);
    assert.equal(title(), section);
  }
});
test("company edits require confirmation before changing section", async () => {
  await mount();
  await click("Entreprise & équipe");
  const name = renderer.root
    .findAllByType("input")
    .find((i) => i.props.value === "AXORA");
  await act(async () =>
    name.props.onChange({ target: { value: "AXORA modifié" } }),
  );
  await click("Devis");
  assert.equal(confirms, 1);
  assert.equal(title(), "Entreprise & équipe");
  window.confirm = () => true;
  await click("Devis");
  assert.equal(title(), "Devis");
});
test("saving one service does not clear unsaved edits in another service", async () => {
  await mount();
  await click("Catalogue des services");
  const name = renderer.root
    .findAllByType("input")
    .find((i) => i.props.value === "Service A");
  await act(async () =>
    name.props.onChange({ target: { value: "Service A modifié" } }),
  );
  await act(async () =>
    renderer.root
      .findAllByType("form")[1]
      .props.onSubmit({ preventDefault() {} }),
  );
  await click("Vue d’ensemble");
  assert.equal(confirms, 1);
  assert.equal(title(), "Catalogue des services");
});
test("navigation is blocked while a request is being saved", async () => {
  let finish;
  fixture.api.updateRequest = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  await mount();
  await click("Devis");
  await click("Ouvrir");
  const textarea = renderer.root.findByType("textarea");
  await act(async () =>
    textarea.props.onChange({ target: { value: "Notre proposition" } }),
  );
  let saving;
  await act(async () => {
    saving = renderer.root
      .findByType("form")
      .props.onSubmit({ preventDefault() {} });
  });
  assert.equal(renderer.root.findByType("fieldset").props.disabled, true);
  await click("Vue d’ensemble");
  assert.equal(title(), "Devis");
  assert.equal(confirms, 0);
  await act(async () => {
    finish({});
    await saving;
  });
  assert.ok(text(renderer.root).includes("Réponse enregistrée"));
  await click("Vue d’ensemble");
  assert.equal(title(), "Vue d’ensemble");
});
test("unavailable company data shows an error with a retry action", async () => {
  fixture.siteContext = {
    ...fixture.siteContext,
    site: null,
    error: "Informations indisponibles",
  };
  await mount();
  await click("Entreprise & équipe");
  assert.ok(text(renderer.root).includes("Informations indisponibles"));
  assert.ok(button("Réessayer"));
});
