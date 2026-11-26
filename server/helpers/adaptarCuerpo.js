"use strict";

/**
 * Admin envía `{ body: { data } }`; content-api `{ data }`.
 * Unifica al formato que espera el servicio del plugin.
 */
function adaptarCuerpoCreate(requestBody) {
  const raw = requestBody || {};
  if (raw.body !== undefined) {
    return raw;
  }
  if (raw.data !== undefined) {
    return { body: { data: raw.data } };
  }
  return { body: { data: raw } };
}

function adaptarCuerpoUpdate(requestBody, id) {
  const raw = requestBody || {};
  if (raw.body !== undefined) {
    return raw;
  }
  if (raw.data !== undefined) {
    return { body: { data: raw.data, id } };
  }
  return { body: { data: raw, id } };
}

module.exports = {
  adaptarCuerpoCreate,
  adaptarCuerpoUpdate,
};
