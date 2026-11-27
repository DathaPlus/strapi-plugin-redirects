"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const contentApi = require("./content-type");
const admin = require("./redirects");

const ruta = (rutas, method, path) => rutas.find((r) => r.method === method && r.path === path);

describe("rutas content-api", () => {
  it("GET /redirects sigue público", () => {
    assert.equal(ruta(contentApi, "GET", "/").config.auth, false);
  });

  for (const [method, path] of [["POST", "/"], ["PUT", "/:id"]]) {
    it(`${method} ${path} solo acepta la estrategia api-token`, () => {
      assert.deepEqual(ruta(contentApi, method, path).config.auth, { strategies: ["api-token"] });
    });
  }
});

describe("rutas admin del webhook", () => {
  const politica = { name: "admin::hasPermissions", config: { actions: ["plugin::redirects.webhook"] } };

  for (const [method, path] of [["POST", "/webhook"], ["GET", "/webhook"], ["POST", "/webhook/execute"]]) {
    it(`${method} ${path} exige el permiso plugin::redirects.webhook`, () => {
      assert.deepEqual(ruta(admin, method, path).config.policies, [politica]);
    });
  }

  it("ejecutar el webhook ya no es GET", () => {
    assert.equal(ruta(admin, "GET", "/webhook/execute"), undefined);
  });
});
