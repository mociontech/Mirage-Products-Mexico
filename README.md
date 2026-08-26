# Mirage - Catalogo Interactivo

Experiencia de dos dispositivos sincronizados en red local para punto de venta:

- **Tablet Android (tactil, APK):** recorre el flujo y selecciona producto.
- **Pantalla Pitch (grande, no tactil):** espejo narrativo del producto seleccionado; en reposo muestra un video institucional en loop.

La experiencia funciona sin internet. La red local es obligatoria; internet solo se usa para enviar participaciones y leer rankings (ver Fase 7).

## Estructura del monorepo

```
apps/client       app React (tablet + pitch), Vite + TypeScript
apps/sync-server  servidor Node de sincronizacion local (llega en Fase 2)
android           proyecto Capacitor (llega en Fase 6)
```

## Desarrollo

```bash
npm install
npm run dev:client
```

Esto sirve la app en local con dos rutas independientes: `/tablet` y `/pitch`. En desarrollo, sin `sync-server` levantado, ambas rutas cargan pero no estan sincronizadas todavia (transporte `BroadcastChannelSync` llega en Fase 2).

## Estado

Este README se ampliara al final de cada fase con diagrama de red, procedimiento de instalacion en sitio y advertencias de HTTPS/contenido mixto (ver Fase 8). Por ahora:

- [x] Fase 1 - estructura del monorepo, tokens, reset, guards de kiosco, rutas `/tablet` y `/pitch` con pantallas vacias.
- [ ] Fase 2 - `sync-server` + `WebSocketSync`.
- [ ] Fase 3 en adelante - ver historial de commits.
