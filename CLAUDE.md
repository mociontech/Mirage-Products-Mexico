# Mirage - Catalogo Interactivo

Reglas del proyecto. Aplican en toda sesion de trabajo sobre este repo.

## Restricciones duras (no negociables)

1. La experiencia funciona sin internet. Internet solo se usa para enviar participaciones y leer rankings; si se cae, la experiencia sigue completa.
2. La pantalla Pitch nunca queda en negro ni en un estado roto. Ante error, timeout o desconexion, cae siempre a IDLE (video en loop).
3. Video y assets locales, nunca remotos. Nada de CDNs, YouTube/Vimeo ni URLs de Figma en runtime.
4. Autoplay de video garantizado: `muted`, `loop`, `playsinline`, `preload="auto"`, con manejo explicito del rechazo de `play()`.
5. Sin dependencias pesadas: React + CSS + APIs nativas. Nada de UI kits, libs de animacion ni state managers externos.
6. TypeScript estricto: `strict: true`, sin `any`, sin `@ts-ignore`.
7. Una pagina servida por HTTPS no puede abrir `ws://` en LAN (contenido mixto). Por eso ni la tablet ni el pitch se sirven desde un deploy publico en produccion: la tablet corre como APK (origen `http://localhost`) y el pitch se sirve desde el propio `sync-server` en `http://localhost:7777`. Cualquier deploy en Vercel/Netlify/similar es solo QA/demo con `VITE_SYNC_TRANSPORT=broadcast`.

## Git y commits

**Ninguna referencia a Claude, Anthropic, Claude Code o cualquier herramienta de IA** en mensajes de commit, descripciones de PR, comentarios de codigo o documentacion. Especificamente prohibido:

- Trailers `Co-Authored-By: Claude <...>`
- Lineas tipo "Generated with Claude Code"
- Menciones a "asistente", "IA", "generado automaticamente" o similar

Los commits se escriben como los escribiria el autor del repo, y nada mas.

- Conventional Commits en ingles: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:`
- Un commit por unidad logica de trabajo, no un commit gigante por fase
- Rama por fase: `feat/phase-1-scaffolding`, `feat/phase-2-sync`, etc.
- Nunca `git push --force` sobre `main`, nunca `--no-verify`
- Al terminar cada fase: commits atomicos, push de la rama, esperar revision antes de mergear

## Contenido de producto

El catalogo vive en `apps/client/src/content/products.ts` como dato tipado, nunca hardcodeado en componentes. Agregar un producto es editar ese archivo y soltar sus assets.

## Stack

React 18+ / Vite / TypeScript, CSS Modules + `tokens.css`, `react-router-dom` (rutas `/tablet` y `/pitch`), Capacitor para el APK, Node 20 + `ws` (sin framework) para `sync-server`.
