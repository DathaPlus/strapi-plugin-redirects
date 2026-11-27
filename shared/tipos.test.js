"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { TIPOS_REDIRECT, TIPO_DEFAULT, TIPO_POR_CODIGO } = require("./tipos");

describe("catálogo de tipos", () => {
  it("el default es 301 y está en el catálogo", () => {
    assert.equal(TIPO_DEFAULT, "moved_permanently_301");
    assert.ok(TIPOS_REDIRECT.includes(TIPO_DEFAULT));
  });

  it("mapea cada código HTTP a su tipo", () => {
    assert.deepEqual(TIPO_POR_CODIGO, {
      301: "moved_permanently_301",
      302: "found_302",
      307: "temporary_redirect_307",
      308: "permanent_redirect_308",
      410: "gone_410",
      451: "unavailable_for_legal_reasons_451",
    });
  });

  it("es inmutable", () => {
    assert.ok(Object.isFrozen(TIPOS_REDIRECT));
    assert.ok(Object.isFrozen(TIPO_POR_CODIGO));
  });
});
