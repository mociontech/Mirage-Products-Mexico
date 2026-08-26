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
npm run dev:client   # app en local, rutas /tablet, /pitch y /debug/sync
npm run dev:server   # sync-server, ws://localhost:7777
```

Por default el cliente usa el transporte `BroadcastChannelSync` (dos pestanas de la misma maquina, sin servidor). Para probar contra `sync-server` de verdad, copia `apps/client/.env.example` a `apps/client/.env` con `VITE_SYNC_TRANSPORT=websocket`, abre `/debug/sync`, guarda host/puerto/room (el mismo `sync-server` corriendo en `localhost:7777` sirve para probar en una sola maquina) y dispara eventos a mano.

## Estado

Este README se ampliara al final de cada fase con diagrama de red, procedimiento de instalacion en sitio y advertencias de HTTPS/contenido mixto (ver Fase 8). Por ahora:

- [x] Fase 1 - estructura del monorepo, tokens, reset, guards de kiosco, rutas `/tablet` y `/pitch` con pantallas vacias.
- [x] Fase 2 - `sync-server` (salas, snapshot de estado, heartbeat, logs) + `WebSocketSync`/`BroadcastChannelSync` en cliente + `/debug/sync` para probar eventos a mano.
- [ ] Fase 3 en adelante - ver historial de commits.
