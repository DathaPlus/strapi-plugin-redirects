"use strict";

/**
 * Los valores de los headers del webhook (p. ej. un token de GitHub) nunca salen del server.
 * Al leer la config se reemplazan por MASCARA; al guardar, un valor igual a MASCARA
 * conserva el valor ya guardado para ese header.
 */
const MASCARA = "••••••••";

/**
 * @param {Array<{ key?: string, value?: string }>} headers
 * @returns {Array<{ key: string, value: string }>}
 */
function enmascararHeaders(headers) {
  return (Array.isArray(headers) ? headers : []).map((h) => ({
    key: h?.key ?? "",
    value: h?.value ? MASCARA : "",
  }));
}

/**
 * @param {Array<{ key?: string, value?: string }>} nuevos headers recibidos del admin
 * @param {Array<{ key?: string, value?: string }>} guardados headers en el store
 * @returns {Array<{ key: string, value: string }>}
 * @throws {Error} si un header enmascarado no tiene valor guardado con la misma clave
 */
function fusionarHeaders(nuevos, guardados) {
  const previos = new Map(
    (Array.isArray(guardados) ? guardados : []).map((h) => [(h?.key ?? "").trim(), h?.value ?? ""]),
  );
  return (Array.isArray(nuevos) ? nuevos : []).map((h) => {
    const key = (h?.key ?? "").trim();
    const value = h?.value ?? "";
    if (value !== MASCARA) return { key, value };
    if (!previos.has(key)) {
      throw new Error(`El header "${key}" no tiene un valor guardado; escribe su valor de nuevo.`);
    }
    return { key, value: previos.get(key) };
  });
}

module.exports = { MASCARA, enmascararHeaders, fusionarHeaders };
