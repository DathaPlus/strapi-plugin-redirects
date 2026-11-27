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
 * Si cambió el destino (`mismoDestino: false`), ningún valor guardado se reutiliza: un secreto
 * pensado para un servidor no debe viajar a otro solo porque el admin dejó la máscara.
 *
 * @param {Array<{ key?: string, value?: string }>} nuevos headers recibidos del admin
 * @param {Array<{ key?: string, value?: string }>} guardados headers en el store
 * @param {{ mismoDestino?: boolean }} [opciones]
 * @returns {Array<{ key: string, value: string }>}
 * @throws {Error} si un header enmascarado no tiene valor guardado con la misma clave, o si cambió el destino
 */
function fusionarHeaders(nuevos, guardados, { mismoDestino = true } = {}) {
  const previos = new Map(
    (Array.isArray(guardados) ? guardados : []).map((h) => [(h?.key ?? "").trim(), h?.value ?? ""]),
  );
  return (Array.isArray(nuevos) ? nuevos : []).map((h) => {
    const key = (h?.key ?? "").trim();
    const value = h?.value ?? "";
    if (value !== MASCARA) return { key, value };
    if (!mismoDestino) {
      throw new Error(`Cambiaste el destino del webhook: escribe de nuevo el valor del header "${key}".`);
    }
    if (!previos.has(key)) {
      throw new Error(`El header "${key}" no tiene un valor guardado; escribe su valor de nuevo.`);
    }
    return { key, value: previos.get(key) };
  });
}

/**
 * Valida la URL del webhook: solo https:// y con host.
 * @param {string} url
 * @returns {URL}
 * @throws {Error} si no es una URL https válida
 */
function validarUrlWebhook(url) {
  let u;
  try {
    u = new URL(String(url ?? "").trim());
  } catch {
    throw new Error("La URL del webhook no es válida.");
  }
  if (u.protocol !== "https:" || !u.hostname) {
    throw new Error("La URL del webhook debe empezar con https://.");
  }
  return u;
}

/**
 * ¿La URL nueva apunta al mismo origen (esquema + host + puerto) que la guardada?
 * @param {string} nueva
 * @param {string | undefined} guardada
 */
function mismoOrigen(nueva, guardada) {
  try {
    return Boolean(guardada) && new URL(nueva).origin === new URL(guardada).origin;
  } catch {
    return false;
  }
}

module.exports = { MASCARA, enmascararHeaders, fusionarHeaders, validarUrlWebhook, mismoOrigen };
