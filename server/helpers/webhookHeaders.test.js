"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MASCARA, enmascararHeaders, fusionarHeaders } = require("./webhookHeaders");

describe("enmascararHeaders", () => {
  it("nunca devuelve el valor guardado", () => {
    const leidos = enmascararHeaders([{ key: "Authorization", value: "Bearer ghp_secreto" }]);
    assert.deepEqual(leidos, [{ key: "Authorization", value: MASCARA }]);
    assert.doesNotMatch(JSON.stringify(leidos), /ghp_secreto/);
  });

  it("un header vacío sigue vacío y tolera config sin headers", () => {
    assert.deepEqual(enmascararHeaders([{ key: "X-Vacio", value: "" }]), [{ key: "X-Vacio", value: "" }]);
    assert.deepEqual(enmascararHeaders(undefined), []);
  });
});

describe("fusionarHeaders", () => {
  const guardados = [{ key: "Authorization", value: "Bearer ghp_secreto" }];

  it("la máscara conserva el valor guardado", () => {
    assert.deepEqual(fusionarHeaders([{ key: "Authorization", value: MASCARA }], guardados), guardados);
  });

  it("un valor nuevo reemplaza al guardado", () => {
    assert.deepEqual(
      fusionarHeaders([{ key: " Authorization ", value: "Bearer nuevo" }], guardados),
      [{ key: "Authorization", value: "Bearer nuevo" }],
    );
  });

  it("un header quitado en el admin se elimina", () => {
    assert.deepEqual(fusionarHeaders([], guardados), []);
  });

  it("máscara sin valor guardado para esa clave → error claro", () => {
    assert.throws(
      () => fusionarHeaders([{ key: "X-Otro", value: MASCARA }], guardados),
      /X-Otro.*escribe su valor de nuevo/,
    );
  });
});

describe("cambio de destino del webhook (1.1.3)", () => {
  const { validarUrlWebhook, mismoOrigen } = require("./webhookHeaders");
  const guardados = [{ key: "Authorization", value: "Bearer ghp_secreto" }];

  it("con otro origen, un valor enmascarado no reutiliza el secreto guardado", () => {
    assert.throws(
      () => fusionarHeaders([{ key: "Authorization", value: MASCARA }], guardados, { mismoDestino: false }),
      /escribe de nuevo/,
    );
  });

  it("con otro origen, un valor escrito de nuevo sí se guarda", () => {
    assert.deepEqual(
      fusionarHeaders([{ key: "Authorization", value: "Bearer nuevo" }], guardados, { mismoDestino: false }),
      [{ key: "Authorization", value: "Bearer nuevo" }],
    );
  });

  it("mismoOrigen compara esquema, host y puerto", () => {
    const gh = "https://api.github.com/repos/x/y/dispatches";
    assert.equal(mismoOrigen("https://api.github.com/repos/x/z/dispatches", gh), true);
    assert.equal(mismoOrigen("https://evil.example/repos/x/y/dispatches", gh), false);
    assert.equal(mismoOrigen("https://api.github.com:8443/x", gh), false);
    assert.equal(mismoOrigen(gh, undefined), false);
    assert.equal(mismoOrigen("no-es-url", gh), false);
  });

  it("validarUrlWebhook solo acepta https", () => {
    assert.equal(validarUrlWebhook(" https://api.github.com/x ").hostname, "api.github.com");
    assert.throws(() => validarUrlWebhook("http://api.github.com/x"), /https/);
    assert.throws(() => validarUrlWebhook("file:///etc/passwd"), /https/);
    assert.throws(() => validarUrlWebhook("no es url"), /no es válida/);
  });
});
