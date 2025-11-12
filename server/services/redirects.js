const { errors } = require('@strapi/utils');
const { ApplicationError } = errors;
const { validateRedirect } = require('../helpers/redirectValidationHelper');

const sendWebhookRequest = async (url, headers) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, {
        method: 'POST',
        headers,
        signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseHeaders = Object.fromEntries(response.headers.entries());
    const status = response.status;
    const statusText = response.statusText;

    if (status < 200 || status >= 300) {
        const errorText = await response.text();
        throw new ApplicationError('Webhook returned non-2xx status', {
          status,
          details: { type: 'WEBHOOK_NON_2XX', body: errorText },
        });
    }

    return { status, statusText, headers: responseHeaders };
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === 'AbortError') {
        throw new ApplicationError('Webhook request timeout', {
          status: 408,
          details: { type: 'WEBHOOK_TIMEOUT' },
        });
    }

    throw new ApplicationError(`Webhook request failed: ${error.message}`, {
      status: 500,
      details: { type: 'WEBHOOK_REQUEST_FAILED', originalError: error.message },
    });
  }
};

module.exports = ({ strapi }) => ({
  /**
   * Find a single redirect
   * 
   * @param {*} id 
   * @returns 
   */
  findOne: async (id) => {
    const results = await strapi.entityService.findOne('plugin::redirects.redirect', id);

    return results;
  },

  /**
   * Find all redirects
   * 
   * @returns 
   */
  findAll: async (params = {}) => {
    // Destructure and set default values for sort, filters, and handle pagination using start and limit
    const {
      sort = 'id:desc', // Default sorting order
      filters = {},
      pagination = {}
    } = params;
  
    // Calculate start (offset) based on page and pageSize (or limit)
    let start = 0;
    const limit = parseInt(pagination.pageSize, 10) || 10; // Default limit
    if (pagination.page) {
      start = (parseInt(pagination.page, 10) - 1) * limit;
    }
  
    // Fetch the redirects with filters, sort, and calculated start and limit
    const redirects = await strapi.entityService.findMany('plugin::redirects.redirect', {
      sort,
      start,
      limit,
      filters,
    });
  
    // Calculate the total number of redirects matching the filters (without pagination limit)
    const total = await strapi.entityService.count('plugin::redirects.redirect', { filters });
  
    return {
      redirects,
      total,
    };
  },

  /**
   * Create a redirect
   * 
   * @param {Object} params 
   * @returns 
   */
  create: async ({ body }) => {
    const validity = await validateRedirect(body);

    if (!validity.ok) {
      throw new ApplicationError(validity.errorMessage, validity.details);
    }

    const results = await strapi.entityService.create('plugin::redirects.redirect', body);

    return results;
  },

  /**
   * Update a redirect
   * 
   * @param {Number} id 
   * @param {Object} body 
   * @returns 
   */
  update: async (id, { body }) => {
    const validity = await validateRedirect({ ...body, id }, true);

    if (!validity.ok) {
      throw new ApplicationError(validity.errorMessage, validity.details);
    }

    const results = await strapi.entityService.update('plugin::redirects.redirect', id, body);

    return results;
  },

  /**
   * Delete a redirect
   * 
   * @param {Number} id 
   * @returns Redirect Object
   */
  delete: async (id) => {
    const results = await strapi.entityService.delete('plugin::redirects.redirect', id);

    return results;
  },

  /**
   * Import redirects
   * 
   * @param {Object} body 
   * @returns 
   */
  import: async ({ body }) => {
    const importResults = [];
    for (const row of body.data) {
  
      // Skip processing for rows already marked as INVALID in the parsing phase
      if (row.status === 'INVALID') {
        importResults.push(row); // Include these rows in the importResults to report back as skipped due to validation failures
        continue;
      }
  
      try {
        // Since the row passed initial CSV parsing validation, proceed with database-specific validation
        const validity = await validateRedirect({ data: row }, false);
  
        if (!validity.ok) {
          // If further validation fails (e.g., against database entries), mark as INVALID with detailed reasons
          importResults.push({ ...row, status: 'INVALID', reason: validity.errorMessage, details: validity.details });
          continue;
        }
  
        let operationResult;
        // As validateRedirect ensures the row is valid for import, directly create or update without re-checking for duplicates
        const existingRedirects = await strapi.entityService.findMany('plugin::redirects.redirect', {
          filters: { from: row.from }
        });
  
        if (existingRedirects.length > 0) {
          // Update the existing redirect if it's considered valid for an update
          const existingRedirect = existingRedirects[0];
          operationResult = await strapi.entityService.update('plugin::redirects.redirect', existingRedirect.id, { data: row });
          importResults.push({ ...operationResult, status: 'UPDATED', details: { type: 'UPDATED' } });
        } else {
          // Create a new redirect if no valid duplicates are found in the database
          operationResult = await strapi.entityService.create('plugin::redirects.redirect', { data: row });
          importResults.push({ ...operationResult, status: 'CREATED', details: { type: 'CREATED' } });
        }
      } catch (e) {
        console.error('error during import operation', e);
        importResults.push({ ...row, status: 'ERROR', error: e.message });
      }
    }
  
    return importResults;
  }
  ,
    /**
     * Save webhook configuration (POST)
     */
  saveWebhook: async (body) => {
    const { url, headers } = body || {};

    // ✅ Validar que se hayan enviado parámetros
    if (!url && !headers) {
      throw new ApplicationError(
        "No se obtuvieron parámetros para realizar las configuraciones",
        {
          status: 400,
          details: { type: "MISSING_PARAMETERS" },
        }
      );
    }

    // ✅ Validar que la URL no esté vacía ni sea inválida
    if (!url || typeof url !== "string" || !url.trim()) {
      throw new ApplicationError("Webhook URL es requerida", {
        status: 400,
        details: { type: "INVALID_WEBHOOK_URL" },
      });
    }

    // ✅ Validar headers (si existen)
    let parsedHeaders = [];
    try {
      if (headers) {
        parsedHeaders = Array.isArray(headers)
                  ? headers
                  : JSON.parse(headers); // permite string JSON o array
      }
    } catch (e) {
      throw new ApplicationError("Formato de headers inválido", {
        status: 400,
        details: { type: "INVALID_HEADERS_FORMAT" },
      });
    }

    const config = { url: url.trim(), headers: parsedHeaders };

    // ✅ Guardar configuración en el store
    try {
      const store = strapi.store({ type: "plugin", name: "redirects" });
      await store.set({ key: "webhookConfig", value: config });

      return { ok: true, message: "Configuración del webhook guardada correctamente" };
    } catch (e) {
      throw new ApplicationError("Error al guardar configuración del webhook", {
        status: 500,
        details: { type: "STORE_SAVE_ERROR", originalError: e.message },
      });
    }
  },
  /**
   * Get webhook configuration (GET)
   */
  getWebhookConfig: async () => {
    try {
      const store = strapi.store({ type: "plugin", name: "redirects" });
      const config = await store.get({ key: "webhookConfig" });

      if (!config) {
        throw new ApplicationError("No hay configuración guardada", {
          status: 404,
          details: { type: "CONFIG_NOT_FOUND" },
        });
      }

      return config;
    } catch (e) {
      throw new ApplicationError("Error al obtener configuración del webhook", {
        status: 500,
        details: { type: "STORE_GET_ERROR", originalError: e.message },
      });
    }
  },
  /**
   * Execute configured webhook
   */
  executeWebhook: async () => {
    const store = strapi.store({ type: 'plugin', name: 'redirects' });
    const config = (await store.get({ key: 'webhookConfig' })) || {};
    
    const url = config.url ? config.url.trim() : '';
    const headersList = Array.isArray(config.headers) ? config.headers : [];

    if (!url) {
      throw new ApplicationError('Webhook URL not configured', { 
        status: 400,
        details: { type: 'WEBHOOK_NOT_CONFIGURED' }
      });
    }

    const headersObj = headersList.reduce((acc, cur) => {
      if (cur && cur.key && cur.key.trim()) {
        acc[cur.key.trim()] = cur.value || '';
      }
      return acc;
    }, {});

    try {
      const result = await sendWebhookRequest(url, headersObj);
      return { ok: true, result };
    } catch (error) {
      if (error instanceof ApplicationError) throw error;

      throw new ApplicationError(`Failed to execute webhook: ${error.message}`, {
        status: 500,
        details: { type: 'WEBHOOK_EXECUTION_FAILED', originalError: error.message },
      });
    }
  }
});
