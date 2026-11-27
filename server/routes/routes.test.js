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

  it("cada ruta tiene su propia config (regresión 1.1.2: PUT heredaba el scope create)", () => {
    const post = ruta(contentApi, "POST", "/");
    const put = ruta(contentApi, "PUT", "/:id");
    assert.notEqual(post.config, put.config);
    assert.notEqual(post.config.auth, put.config.auth);
    // Lo que hace Strapi al registrar: escribe el scope de cada acción en su config.
    for (const r of [post, put]) {
      r.config.auth.scope ??= [`plugin::redirects.redirects.${r.handler.split(".")[1]}`];
    }
    assert.deepEqual(put.config.auth.scope, ["plugin::redirects.redirects.update"]);
    assert.deepEqual(post.config.auth.scope, ["plugin::redirects.redirects.create"]);
  });
});

describe("rutas admin del webhook", () => {
  const politica = { name: "admin::hasPermissions", config: { actions: ["plugin::redirects.webhook"] } };

  for (const [method, path] of [["POST", "/webhook"], ["GET", "/webhook"], ["POST", "/webhook/execute"]]) {
    it(`${method} ${path} exige el permiso plugin::redirects.webhook`, () => {
      assert.deepEqual(ruta(admin, method, path).config.policies, [politica]);
    });
  }

  it("las rutas del webhook no comparten el objeto config", () => {
    const configs = [["POST", "/webhook"], ["GET", "/webhook"], ["POST", "/webhook/execute"]].map(
      ([m, p]) => ruta(admin, m, p).config,
    );
    assert.equal(new Set(configs).size, 3);
  });

  it("ejecutar el webhook ya no es GET", () => {
    assert.equal(ruta(admin, "GET", "/webhook/execute"), undefined);
  });
});
