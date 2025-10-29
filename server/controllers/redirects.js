'use strict';

console.log('=== redirects.js CONTROLLER LOADED ===');

const { getPluginService } = require('../helpers/getPluginService');

module.exports = () => ({
  findOne: async (ctx) => {
    ctx.body = await getPluginService('redirects').findOne(ctx.params.id);
  },
  findAll: async (ctx) => {
    ctx.body = await getPluginService('redirects').findAll(ctx.query);
  },
  create: async (ctx) => {
    ctx.body = await getPluginService('redirects').create(ctx.request.body);
  },
  update: async (ctx) => {
    ctx.body = await getPluginService('redirects').update(ctx.params.id, ctx.request.body);
  },
  delete: async (ctx) => {
    ctx.body = await getPluginService('redirects').delete(ctx.params.id);
  },
  import: async (ctx) => {
    ctx.body = await getPluginService('redirects').import(ctx.request.body);
  },
  saveWebhook: async (ctx) => {
    console.log('=== saveWebhook CONTROLLER CALLED ===');
    try {
      console.log('=== saveWebhook controller called, query:', JSON.stringify(ctx.request.query, null, 2));
      // If there are no query params, return current config
      const query = ctx.request.query || {};
      const result = await getPluginService('redirects').saveWebhook(query);
      console.log('=== saveWebhook controller result:', JSON.stringify(result, null, 2));
      // Force 200 with JSON body to avoid 204 No Content in some proxies
      ctx.status = 200;
      ctx.body = result && Object.keys(result).length ? result : { ok: true };
    } catch (error) {
      console.log('=== saveWebhook controller error:', error);
      ctx.status = error.status || 400;
      ctx.body = {
        error: {
          message: error.message || 'Failed to save webhook settings',
          details: error.details || {}
        }
      };
    }
  },
  executeWebhook: async (ctx) => {
    try {
      ctx.body = await getPluginService('redirects').executeWebhook();
    } catch (error) {
      ctx.status = error.status || 400;
      ctx.body = {
        error: {
          message: error.message || 'Failed to execute webhook',
          details: error.details || {}
        }
      };
    }
  },
});