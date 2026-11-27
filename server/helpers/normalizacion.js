"use strict";

const { TIPOS_REDIRECT, TIPO_DEFAULT } = require("../../shared/tipos");

/**
 * Caracteres que Next (path-to-regexp) interpreta como patrón en `source`/`destination`:
 * `/blog/:x` redirigiría cualquier ruta y `/oferta(1)` rompería el build de la landing.
 */
const CARACTERES_DE_PATRON = /[:()*+{}\\]/;

/**
 * Normaliza y valida from/to/type de un redirect.
 * No altera la barra final de from ( /en y /en/ son distintos ).
 *
 * @param {{ from?: unknown, to?: unknown, type?: unknown }} input
 * @returns {{ from: string, to: string, type: string }}
 */
function normalizarRedirect(input = {}) {
  const from = normalizarFrom(input.from);
  const to = normalizarTo(input.to);
  const type = normalizarTipo(input.type);

  if (from === to) {
    throw new Error(
      "La ruta de origen (from) y la de destino (to) no pueden ser iguales.",
    );
  }

  return { from, to, type };
}

/**
 * @param {unknown} valor
 * @returns {string}
 */
function normalizarFrom(valor) {
  if (valor === undefined || valor === null) {
    throw new Error("La ruta de origen (from) es obligatoria.");
  }
  if (typeof valor !== "string") {
    throw new Error("La ruta de origen (from) debe ser texto.");
  }

  const from = valor.trim();

  if (!from) {
    throw new Error("La ruta de origen (from) no puede quedar vacía.");
  }
  if (/\s/.test(from)) {
    throw new Error(
      "La ruta de origen (from) no puede contener espacios.",
    );
  }
  if (!from.startsWith("/")) {
    throw new Error(
      'La ruta de origen (from) debe empezar con "/".',
    );
  }
  if (from.startsWith("//")) {
    throw new Error(
      "La ruta de origen (from) no puede ser una URL con dominio.",
    );
  }
  if (from.includes("?") || from.includes("#")) {
    throw new Error(
      'La ruta de origen (from) no puede incluir "?" ni "#".',
    );
  }
  if (from.includes("://") || /https?:/i.test(from)) {
    throw new Error(
      "La ruta de origen (from) no puede incluir un dominio ni un esquema URL.",
    );
  }
  if (CARACTERES_DE_PATRON.test(from)) {
    throw new Error(
      'La ruta de origen (from) no puede incluir : ( ) * + { } ni \\ (la web los toma como patrón).',
    );
  }

  return from;
}

/**
 * @param {unknown} valor
 * @returns {string}
 */
function normalizarTo(valor) {
  if (valor === undefined || valor === null) {
    throw new Error("La ruta de destino (to) es obligatoria.");
  }
  if (typeof valor !== "string") {
    throw new Error("La ruta de destino (to) debe ser texto.");
  }

  const to = valor.trim();

  if (!to) {
    throw new Error("La ruta de destino (to) no puede quedar vacía.");
  }
  if (/\s/.test(to)) {
    throw new Error(
      "La ruta de destino (to) no puede contener espacios.",
    );
  }

  const esRuta = to.startsWith("/") && !to.startsWith("//");
  const esHttps = /^https:\/\//i.test(to);

  if (!esRuta && !esHttps) {
    throw new Error(
      'La ruta de destino (to) debe empezar con "/" o ser una URL https://.',
    );
  }
  if (esRuta && CARACTERES_DE_PATRON.test(to)) {
    throw new Error(
      'La ruta de destino (to) no puede incluir : ( ) * + { } ni \\ (la web los toma como patrón).',
    );
  }

  return to;
}

/**
 * @param {unknown} valor
 * @returns {string}
 */
function normalizarTipo(valor) {
  if (valor === undefined || valor === null || valor === "") {
    return TIPO_DEFAULT;
  }

  if (typeof valor !== "string") {
    throw new Error("El tipo de redirección debe ser texto.");
  }

  if (!TIPOS_REDIRECT.includes(valor)) {
    throw new Error(
      `El tipo de redirección no es válido. Usa uno de: ${TIPOS_REDIRECT.join(", ")}.`,
    );
  }

  return valor;
}

module.exports = {
  TIPOS_REDIRECT,
  TIPO_DEFAULT,
  normalizarRedirect,
  normalizarFrom,
  normalizarTo,
  normalizarTipo,
};
