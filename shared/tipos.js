"use strict";

/**
 * Catálogo único de tipos de redirect: lo usan el esquema, la validación del server,
 * el formulario del admin y el importador CSV. Agregar un tipo = agregarlo solo aquí.
 * CommonJS sin dependencias para que lo carguen Node (server) y el bundle del admin.
 */
const TIPOS_REDIRECT = Object.freeze([
  "moved_permanently_301",
  "found_302",
  "temporary_redirect_307",
  "permanent_redirect_308",
  "gone_410",
  "unavailable_for_legal_reasons_451",
]);

const TIPO_DEFAULT = "moved_permanently_301";

/** Código HTTP (texto) → tipo, derivado del sufijo `_NNN`: { "301": "moved_permanently_301", … }. */
const TIPO_POR_CODIGO = Object.freeze(
  Object.fromEntries(TIPOS_REDIRECT.map((tipo) => [tipo.slice(tipo.lastIndexOf("_") + 1), tipo])),
);

module.exports = { TIPOS_REDIRECT, TIPO_DEFAULT, TIPO_POR_CODIGO };
