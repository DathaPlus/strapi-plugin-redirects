"use strict";

/**
 * Leer, guardar o ejecutar el webhook exige el permiso propio (no basta la sesión de admin).
 * Una config nueva por ruta: Strapi muta el objeto `config` al registrar cada ruta.
 */
const soloConPermisoWebhook = () => ({
  policies: [
    { name: "admin::hasPermissions", config: { actions: ["plugin::redirects.webhook"] } },
  ],
});

module.exports = [
  // Place specific webhook routes FIRST to avoid being shadowed by generic routes
  {
    method: "POST",
    path: "/webhook",
    handler: "redirects.saveWebhook",
    config: soloConPermisoWebhook(),
  },
  {
    method: "GET",
    path: "/webhook",
    handler: "redirects.getWebhookConfig",
    config: soloConPermisoWebhook(),
  },
  {
    method: "POST",
    path: "/webhook/execute",
    handler: "redirects.executeWebhook",
    config: soloConPermisoWebhook(),
  },
  // Generic routes below
  {
    method: "GET",
    path: "/:id",
    handler: "redirects.findOne",
    config: { policies: [] },
  },
  {
    method: "GET",
    path: "/",
    handler: "redirects.findAll",
    config: { policies: [] },
  },
  {
    method: "POST",
    path: "/",
    handler: "redirects.create",
    config: { policies: [] },
  },
  {
    method: "PUT",
    path: "/:id",
    handler: "redirects.update",
    config: { policies: [] },
  },
  {
    method: "DELETE",
    path: "/:id",
    handler: "redirects.delete",
    config: { policies: [] },
  },
  {
    method: "POST",
    path: "/import",
    handler: "redirects.import",
    config: { policies: [] },
  },
];
