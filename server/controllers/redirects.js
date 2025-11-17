'use strict';

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
    try {
      // If there are no query params, return current config
      const body = ctx.request.body || {};
      const result = await getPluginService('redirects').saveWebhook(body);
      // Force 200 with JSON body to avoid 204 No Content in some proxies
      ctx.status = 200;
      ctx.body = result && Object.keys(result).length ? result : { ok: true };
    } catch (error) {
      ctx.status = error.status || 400;
      ctx.body = {
        error: {
          message: error.message || 'Failed to save webhook settings',
          details: error.details || {}
        }
      };
    }
  },
  /**
   * Obtiene la configuración guardada del webhook (GET)
   */
  getWebhookConfig: async (ctx) => {
    try {
      const result = await getPluginService('redirects').getWebhookConfig();

      ctx.status = 200;
      ctx.body = result;
    } catch (error) {
      ctx.status = error.status || 400;
      ctx.body = {
        error: {
          message: error.message || 'Error al obtener la configuración del webhook',
          details: error.details || {},
        },
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