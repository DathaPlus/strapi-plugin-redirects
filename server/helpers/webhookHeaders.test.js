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
