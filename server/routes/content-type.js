"use strict";

/** Escrituras del content-api solo con API token (ni JWT de users-permissions ni otra estrategia). */
const soloApiToken = { policies: [], auth: { strategies: ["api-token"] } };

module.exports = [
  {
    method: "GET",
    path: "/",
    handler: "redirects.findAll",
    config: { policies: [], auth: false },
  },
  {
    method: "POST",
    path: "/",
    handler: "redirects.create",
    config: soloApiToken,
  },
  {
    method: "PUT",
    path: "/:id",
    handler: "redirects.update",
    config: soloApiToken,
  },
  {
    method: "GET",
    path: "/content-types",
    handler: "content-type.find",
    config: { policies: [], auth: false },
  },
  {
    method: "POST",
    path: "/content-types/search",
    handler: "content-type.search",
  },
];
