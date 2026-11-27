"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizarRedirect,
  normalizarFrom,
  normalizarTo,
  normalizarTipo,
  TIPOS_REDIRECT,
  TIPO_DEFAULT,
} = require("./normalizacion");
const {
  adaptarCuerpoCreate,
  adaptarCuerpoUpdate,
} = require("./adaptarCuerpo");

describe("normalizarFrom", () => {
  it("hace trim y conserva la barra final", () => {
    assert.equal(normalizarFrom("  /en/  "), "/en/");
    assert.equal(normalizarFrom("/en"), "/en");
  });

  it("rechaza sin barra inicial, espacios, query, hash o dominio", () => {
    assert.throws(() => normalizarFrom("en"), /empezar con "\/"/);
    assert.throws(() => normalizarFrom("/en us"), /espacios/);
    assert.throws(() => normalizarFrom("/en?x=1"), /\?/);
    assert.throws(() => normalizarFrom("/en#x"), /#/);
    assert.throws(() => normalizarFrom("//example.com/a"), /dominio/);
    assert.throws(() => normalizarFrom("https://example.com/a"), /empezar/);
  });

  it("rechaza caracteres que la web toma como patrón (regresión 1.1.3)", () => {
    for (const from of ["/blog/:slug", "/oferta(1)", "/a*", "/a+", "/a{b}", "/a\\b"]) {
      assert.throws(() => normalizarFrom(from), /patrón/, from);
    }
    assert.equal(normalizarFrom("/es-ec/interpretacion-lengua-senas"), "/es-ec/interpretacion-lengua-senas");
  });
});

describe("normalizarTo", () => {
  it("acepta ruta relativa y https", () => {
    assert.equal(normalizarTo("  /es-ec  "), "/es-ec");
    assert.equal(
      normalizarTo("https://tracendio.com/es-ec"),
      "https://tracendio.com/es-ec",
    );
  });

  it("rechaza espacios, http y rutas sin barra", () => {
    assert.throws(() => normalizarTo("/es ec"), /espacios/);
    assert.throws(() => normalizarTo("http://tracendio.com"), /https/);
    assert.throws(() => normalizarTo("es-ec"), /empezar/);
    assert.throws(() => normalizarTo("//evil.com"), /empezar/);
  });

  it("rechaza patrones en rutas relativas pero acepta https con puerto (regresión 1.1.3)", () => {
    for (const to of ["/blog/:slug", "/x(1)", "/x*"]) {
      assert.throws(() => normalizarTo(to), /patrón/, to);
    }
    assert.equal(normalizarTo("https://tracendio.com:443/es-ec"), "https://tracendio.com:443/es-ec");
  });
});

describe("normalizarTipo", () => {
  it("usa 301 si falta el tipo", () => {
    assert.equal(normalizarTipo(undefined), TIPO_DEFAULT);
    assert.equal(normalizarTipo(null), TIPO_DEFAULT);
    assert.equal(normalizarTipo(""), TIPO_DEFAULT);
  });

  it("acepta el enum y rechaza valores fuera", () => {
    for (const tipo of TIPOS_REDIRECT) {
      assert.equal(normalizarTipo(tipo), tipo);
    }
    assert.throws(() => normalizarTipo("moved_permanently"), /no es válido/);
  });
});

describe("normalizarRedirect", () => {
  it("normaliza un alta válida y pone 301 por defecto", () => {
    assert.deepEqual(
      normalizarRedirect({ from: " /es-ec/home ", to: " /es-ec " }),
      {
        from: "/es-ec/home",
        to: "/es-ec",
        type: "moved_permanently_301",
      },
    );
  });

  it("conserva /en y /en/ como from distintos", () => {
    assert.equal(
      normalizarRedirect({ from: "/en", to: "/es-ec" }).from,
      "/en",
    );
    assert.equal(
      normalizarRedirect({ from: "/en/", to: "/es-ec" }).from,
      "/en/",
    );
  });

  it("rechaza from igual a to", () => {
    assert.throws(
      () => normalizarRedirect({ from: "/es-ec", to: "/es-ec" }),
      /no pueden ser iguales/,
    );
  });
});

describe("adaptarCuerpo", () => {
  it("create: deja pasar cuerpo admin y envuelve content-api", () => {
    const admin = { body: { data: { from: "/a", to: "/b" } } };
    assert.equal(adaptarCuerpoCreate(admin), admin);

    assert.deepEqual(
      adaptarCuerpoCreate({ data: { from: "/a", to: "/b" } }),
      { body: { data: { from: "/a", to: "/b" } } },
    );

    assert.deepEqual(
      adaptarCuerpoCreate({ from: "/a", to: "/b" }),
      { body: { data: { from: "/a", to: "/b" } } },
    );
  });

  it("update: deja pasar cuerpo admin y envuelve content-api con id", () => {
    const admin = { body: { data: { to: "/b" }, id: 3 } };
    assert.equal(adaptarCuerpoUpdate(admin, 3), admin);

    assert.deepEqual(
      adaptarCuerpoUpdate({ data: { to: "/b" } }, 7),
      { body: { data: { to: "/b" }, id: 7 } },
    );

    assert.deepEqual(
      adaptarCuerpoUpdate({ to: "/b" }, 9),
      { body: { data: { to: "/b" }, id: 9 } },
    );
  });
});
