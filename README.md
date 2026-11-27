# Strapi Plugin for Managing Redirects

This plugin provides a convenient way to manage URL redirects within a dedicated collection type in Strapi, catering to the headless nature of the CMS. While it does not automatically handle redirects on the server side, it offers a structured endpoint from which frontend applications can fetch redirect rules and implement redirection logic as needed. This approach empowers developers and content managers to seamlessly integrate and manage redirect rules, enhancing SEO and user experience by leveraging the flexibility of Strapi's headless architecture.

![Version](https://img.shields.io/badge/version-1.1.2-blue.svg?cacheSeconds=2592000)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/Webbist-dev/strapi-redirects/#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/Webbist-dev/strapi-redirects/graphs/commit-activity)
[![License: MIT](https://img.shields.io/github/license/Webbist-dev/strapi-redirects)](https://github.com/Webbist-dev/strapi-redirects/blob/master/LICENSE)
[![Twitter: webbist](https://img.shields.io/twitter/follow/webbist.svg?style=social)](https://twitter.com/webbist)

## Features

- **Admin Panel Integration:** Once installed, the plugin adds a new section called "Redirects" under the plugins category in the Strapi admin dashboard. This intuitive interface lets you effortlessly manage your redirects.
- **Flexible Redirects Management:** Create redirects by specifying the origin URL (`From`), the destination URL (`To`), and the redirect type (`Type`).
- **Accessible Endpoint:** Redirects are made available through the `api/redirects` endpoint as a JSON object. This endpoint is accessible to authenticated users with the appropriate permissions, enabling easy integration with your frontend.

## Getting Started

### Installation

1. Install the plugin using npm or yarn:

```npm install strapi-plugin-redirects``` or ```yarn add strapi-plugin-redirects```

2. Enable the plugin in Strapi by adding it to your ./config/plugins.js:

```
module.exports = ({ env }) => ({
  // Other plugin configurations...
  redirects: {
    enabled: true,
  },
});
```

3. Restart your Strapi server for the changes to take effect.

## How to Use

1. Access the Strapi admin panel and locate the `Redirects` section within the plugins area.
2. To add a new redirect, click on `Add New Redirect` and fill in the `To`, `From`, and `Type` fields accordingly.
3. After saving, the new redirect will be available at the `api/redirects` endpoint.
4. To fetch redirects, send a GET request to `api/redirects`. The response will be a JSON object listing all configured redirects.

### Importing Redirects

You can import redirects in bulk by uploading a CSV file with `from`, `to`, and `type` headers. `from` must be a relative path (`/old`); `to` can be a relative path (`/new`) or an absolute `https://` URL for external redirects. In the `type` column use the HTTP code (`301`, `302`, `307`, `308`, `410`, `451`); an empty or unknown value falls back to `301`.

## Example Usage with Next.js

This plugin is ideal for content editors or SEO specialists managing redirects in a headless CMS setup. Here's how you can integrate it with a Next.js project:

1. Fetch redirects during the build process to include them in `next.config.js`.

Example script for fetching redirects:

```javascript
const redirects = () => {
  return fetch('http://localhost:1337/api/redirects')
    .then(res => res.json())
    .then(response => {
      // Use redirects however you need to
    });
};

module.exports = redirects;
```

Incorporate the fetched redirects into next.config.js:


```javascript
const getRedirects = require('./redirects');

module.exports = {
  // Other configurations...
  redirects: () => getRedirects(),
};
```

## Redirect Types

Define your redirect types with clear descriptions, for instance:

- moved_permanently_301: The resource has moved permanently to a new URL.
- found_302: The resource is temporarily located at a different URL.
- temporary_redirect_307: Temporarily moved to a new URL with the same method used.
- permanent_redirect_308: Permanently moved to a new URL with the same method used.
- gone_410: The resource is permanently removed and won't be available again.
- unavailable_for_legal_reasons_451: Access to the resource is restricted due to legal reasons.

## 1.1.2

- **Single type catalog:** `shared/tipos.js` is the only list of redirect types (schema, server validation, admin form and CSV import).
- **Webhook permission:** `POST/GET /redirects/webhook` and `POST /redirects/webhook/execute` require the RBAC action *Manage the redirects webhook* (`plugin::redirects.webhook`), not only an admin session. Super Admin has it; grant it to other roles under Settings → Roles → Plugins → Redirects.
- **Masked webhook headers:** reading the webhook config returns header values as `••••••••`. Saving a header with that mask keeps its stored value; type a new value to replace it.
- **Run webhook with POST:** `/redirects/webhook/execute` moved from `GET` to `POST`.
- **Writes only with API token:** `POST /api/redirects` and `PUT /api/redirects/:id` accept only the `api-token` strategy (users-permissions JWT is rejected).
- **`to` destinations:** a relative path (`/new`) or an `https://` URL (external redirects); `http://` and protocol-relative `//` are rejected.
- **Safe admin logs:** request errors are logged as status + message only (never the request config with the `Authorization` header).

## 1.1.1

- Los tipos de redirect y el 301 por defecto salen de `server/helpers/normalizacion.js` (en 1.1.2 pasan a `shared/tipos.js`).
- El paquete ya no incluye los tests.

## 1.1.0

- **Default 301:** new redirects default to `moved_permanently_301` (schema and admin form).
- **Format validation:** `from` / `to` / `type` are normalized and validated server-side before duplicate/loop checks (same rules for create, update, and CSV import). Trailing slashes are preserved (`/en` ≠ `/en/`). Format errors return Spanish messages with `details.type === "FORMAT"`.
- **Webhook with session:** admin webhook routes (`POST/GET /webhook`, `GET /webhook/execute`) require a logged-in admin session (JWT via `useFetchClient`); they are no longer public.
- **Write with custom API token:** content-api accepts `POST /api/redirects` and `PUT /api/redirects/:id` (enable under Settings → API Tokens → custom → Redirects). Body shape:

```json
{ "data": { "from": "/old", "to": "/new", "type": "moved_permanently_301" } }
```

Example:

```bash
curl -X POST "https://example.com/api/redirects" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"data":{"from":"/old","to":"/new","type":"moved_permanently_301"}}'
```

## Contributions

This plugin is inspired by and extends the functionalities of the [@webbio](https://www.npmjs.com/package/@webbio/strapi-plugin-redirects) plugin by adding features like bulk import capabilities. Contributions in the form of translations, feature enhancements, and bug fixes are highly encouraged and appreciated.

We are particularly interested in expanding the plugin to include:

1. A settings page to enable redirects on specific content types, allowing users to easily manage redirects when content items are deleted or slugs are changed.
2. Integration with hosting providers like Vercel, Netlify, Firebase, Amplify, and Render.io to automate the management of redirects through CRUD events.

Feel free to reach out or submit pull requests on GitHub if you're interested in contributing to the development of this plugin.

## License

This plugin is available under the MIT License. For more information, please refer to the LICENSE file in the repository.
