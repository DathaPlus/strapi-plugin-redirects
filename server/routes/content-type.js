"use strict";

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
    config: { policies: [] },
  },
  {
    method: "PUT",
    path: "/:id",
    handler: "redirects.update",
    config: { policies: [] },
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
