const { errors } = require('@strapi/utils');
const { ApplicationError } = errors;
const { validateRedirect } = require('../helpers/redirectValidationHelper');
const http = require('http');
const https = require('https');
const { URL } = require('url');

console.log('=== redirects.js SERVICE LOADED ===');

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
   * Save or retrieve webhook configuration
   * For GET without query params: returns current config
   * For GET with ?url=...&headers=JSON: saves config
   */
  saveWebhook: async (query) => {
    console.log('=== saveWebhook called with query:', JSON.stringify(query, null, 2));
    
    const hasParams = query && (typeof query.url === 'string' || typeof query.headers === 'string');
    console.log('=== hasParams:', hasParams);
    
    if (!hasParams) {
      // Try to get from strapi.store first
      try {
        const store = strapi.store({ type: 'plugin', name: 'redirects' });
        const current = await store.get({ key: 'webhookConfig' });
        console.log('=== Retrieved from store:', JSON.stringify(current, null, 2));
        return current || { url: '', headers: [] };
      } catch (e) {
        console.log('=== Store error, returning empty config:', e.message);
        return { url: '', headers: [] };
      }
    }

    const url = decodeURIComponent(query.url || '').trim();
    
    // Validate URL is not empty
    if (!url) {
      throw new ApplicationError('Webhook URL is required', {
        status: 400,
        details: { type: 'INVALID_WEBHOOK_URL' }
      });
    }

    let headers = [];
    try {
      headers = query.headers ? JSON.parse(decodeURIComponent(query.headers)) : [];
    } catch (e) {
      throw new ApplicationError('Invalid headers format');
    }

    const config = { url, headers };
    
    // Debug logging
    console.log('=== Saving webhook config:', JSON.stringify(config, null, 2));
    
    try {
      const store = strapi.store({ type: 'plugin', name: 'redirects' });
      await store.set({ key: 'webhookConfig', value: config });
      
      // Verify it was saved
      const saved = await store.get({ key: 'webhookConfig' });
      console.log('=== Webhook config after save:', JSON.stringify(saved, null, 2));
      
      return { ok: true };
    } catch (e) {
      console.log('=== Store save error:', e.message);
      throw new ApplicationError('Failed to save webhook configuration', {
        status: 500,
        details: { type: 'STORE_SAVE_ERROR', originalError: e.message }
      });
    }
  }
  ,
  /**
   * Execute configured webhook
   */
  executeWebhook: async () => {
    const store = strapi.store({ type: 'plugin', name: 'redirects' });
    const config = (await store.get({ key: 'webhookConfig' })) || {};
    
    // Debug logging
    console.log('Webhook config retrieved:', JSON.stringify(config, null, 2));
    
    const url = config.url ? config.url.trim() : '';
    const headersList = Array.isArray(config.headers) ? config.headers : [];

    if (!url) {
      console.log('Webhook URL is empty or not configured');
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

    const doFetch = async () => {
      // Use global fetch (Node 18+)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s

      try {
        // If calling GitHub Actions workflow_dispatch/dispatches, send default body
        let bodyPayload = undefined;
        const contentType = (headersObj['Content-Type'] || headersObj['content-type'] || '').toLowerCase();
        const isGithubDispatch = url.includes('api.github.com') && url.includes('/dispatches');
        if (isGithubDispatch) {
          // Default payload for workflow_dispatch
          bodyPayload = { ref: 'master', inputs: { environment: 'deploy_prod' } };
          // Ensure JSON header is present
          if (!contentType.includes('application/json')) {
            headersObj['Content-Type'] = 'application/json';
          }
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: headersObj,
          body: bodyPayload ? JSON.stringify(bodyPayload) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const responseHeaders = Object.fromEntries(response.headers.entries());
        // If GitHub returns non-2xx (e.g., 422), surface the error body for debugging
        if (response.status < 200 || response.status >= 300) {
          const errorText = await response.text();
          console.log('Webhook non-2xx response:', response.status, errorText);
          throw new ApplicationError('Webhook returned non-2xx status', {
            status: response.status,
            details: { type: 'WEBHOOK_NON_2XX', body: errorText }
          });
        }

        return {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        };
      } catch (error) {
        clearTimeout(timeout);
        if (error && error.name === 'AbortError') {
          throw new ApplicationError('Webhook request timeout', {
            status: 408,
            details: { type: 'WEBHOOK_TIMEOUT' }
          });
        }
        throw new ApplicationError(`Webhook request failed: ${error.message}`, {
          status: 500,
          details: { type: 'WEBHOOK_REQUEST_FAILED', originalError: error.message }
        });
      }
    };

    try {
      const result = await doFetch();
      return { ok: true, result };
    } catch (error) {
      // If it's already an ApplicationError, re-throw it
      if (error instanceof ApplicationError) {
        throw error;
      }
      // Otherwise, wrap it
      throw new ApplicationError(`Failed to execute webhook: ${error.message}`, {
        status: 500,
        details: { type: 'WEBHOOK_EXECUTION_FAILED', originalError: error.message }
      });
    }
  }
});
