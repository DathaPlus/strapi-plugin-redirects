# Plan 1.1.0 — endurecer @dathaplus/strapi-plugin-redirects

Strapi 4 (peer `^4.0.0`). El admin va en fuente (lo compila el proyecto), sin build en este repo.
Referencia: `docs/ref-validacion.js`, `docs/ref-validacion.test.js` y `docs/ref-extension-tracendio.js` (lo que hoy
hace Tracendio como extensión; se pasa al paquete para que Tracendio la borre). Borra los tres `docs/ref-*` al final.

## Cambios
1. **Tipo por defecto 301**: `server/content-types/redirect/index.js` → `default: "moved_permanently_301"`.
   `admin/components/RedirectForm/types.js`: primera opción = 301 (verificar).
2. **Validación de formato en un solo lugar**: `server/helpers/normalizacion.js` = `docs/ref-validacion.js` (mismas
   reglas y mensajes en español; `/en` y `/en/` son distintos: no tocar la barra final). En
   `server/helpers/redirectValidationHelper.js` → `validateRedirect` normaliza `data.from/to/type` (muta `redirect.data`
   con lo normalizado) **antes** de duplicados/loops; si falla devuelve
   `{ ok: false, errorMessage: <mensaje>, details: { type: "FORMAT" } }`. Así create, update e import CSV usan lo mismo.
   En update, si el payload no trae from/to/type, completar con el registro existente para validar (como la referencia).
3. **Mensaje en el admin**: `admin/screens/Redirect/DetailPage/index.js` (catch ~línea 69 y ~95) y donde
   `RedirectForm` muestra errores: si `details.type === "FORMAT"` mostrar `error.message` del servidor tal cual;
   si el tipo no tiene traducción (o falta), caer en `detail.form.save.notify.error.general.message`. Nunca debe verse
   una clave `…error.undefined.message`. Revisar que el servicio lance `ApplicationError(errorMessage, details)` para que
   llegue `error.response.data.error.message`.
4. **Webhook con sesión**: `server/routes/redirects.js` quitar `auth: false` de `POST /webhook`, `GET /webhook` y
   `GET /webhook/execute` (el admin ya llama con `useFetchClient`, que manda el JWT).
5. **Escritura por API token**: `server/routes/content-type.js` agregar `POST /` → `redirects.create` y
   `PUT /:id` → `redirects.update` (sin `auth: false`; aparecen en Settings → API Tokens → custom → Redirects).
   `server/controllers/redirects.js` `create`/`update` aceptan los dos cuerpos: admin `{ body: { data } }` y
   content-api `{ data }` (función `adaptarCuerpo` como en la referencia). `GET /` público sin cambios.
6. **Tests**: `server/helpers/normalizacion.test.js` (de `docs/ref-validacion.test.js`) + test de `adaptarCuerpo`;
   script `"test": "node --test server/"` en package.json.
7. **Versión** `1.1.0` en package.json; README: sección «1.1.0» (default 301, validación de formato, webhook con sesión,
   escritura con API token custom: cuerpo `{ data: { from, to, type } }`, ejemplo curl con `Authorization: Bearer`).

## Checklist
- [ ] `npm test` en verde (`node --test`).
- [ ] `node -e "require('./strapi-server.js')"` carga sin errores.
- [ ] Ninguna clave `undefined` en mensajes del admin.
- [ ] Sin cambios en `.github/`.
- [ ] Un commit en español por tema (máx. 3), `git add` por archivo, sin firma de agente.
