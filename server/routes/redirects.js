"use strict";

module.exports = [
  // Place specific webhook routes FIRST to avoid being shadowed by generic routes
  {
    method: "GET",
    path: "/webhook",
    handler: "redirects.saveWebhook",
    config: { policies: [], auth: false },
  },
  {
    method: "GET",
    path: "/webhook/execute",
    handler: "redirects.executeWebhook",
    config: { policies: [], auth: false },
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
  {
    method: "GET",
    path: "/webhook",
    handler: "redirects.saveWebhook",
    config: { policies: [], auth: false },
  },
  {
    method: "GET",
    path: "/webhook/execute",
    handler: "redirects.executeWebhook",
    config: { policies: [], auth: false },
  },
];
