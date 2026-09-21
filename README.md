# Mirage - Catalogo Interactivo

Experiencia de dos dispositivos sincronizados en red local para punto de venta:

- **Tablet Android (tactil, APK):** recorre el flujo y selecciona producto.
- **Pantalla Pitch (grande, no tactil):** espejo narrativo del producto seleccionado; en reposo muestra un video institucional en loop.

La experiencia funciona sin internet. La red local es obligatoria; internet solo se usa para enviar participaciones y leer rankings (ver Fase 7).

## Topologia de red

```
        ┌────────────── Router/AP del stand (LAN, internet opcional) ──────────────┐
        │                                                                          │
   ┌────┴─────┐                                                       ┌────────────┴──────────┐
   │  Tablet  │  ws://<IP-PITCH>:7777                                 │  Equipo del Pitch      │
   │  (APK)   │ ─────────────────────────────────────────────────────>│  - sync-server (Node)  │
   └──────────┘                                                       │  - /pitch en kiosco    │
                                                                       └───────────┬────────────┘
                                                                                   │ internet (opcional)
                                                                                   ▼
                                                         Data hub de la empresa + DB de rankings
```

- El `sync-server` corre en el **equipo del pitch** (el que siempre esta encendido y conectado a corriente), y ese mismo proceso sirve el build de `/pitch` en `http://localhost:7777`.
- El equipo del pitch es el **unico** con salida a internet; la tablet nunca sale a internet directamente (ver Fase 7).
- La tablet guarda la IP/puerto/room del equipo del pitch en storage persistente (pantalla de Settings, gesto oculto de 5 taps en el logo) - nunca hardcodeada en el APK.

## HTTPS y contenido mixto (por que ni tablet ni pitch se sirven publicos)

Una pagina servida por HTTPS no puede abrir un WebSocket `ws://` en la LAN - el navegador lo bloquea como contenido mixto. Por eso:

- La tablet corre como **APK** (Capacitor, `androidScheme: 'http'` en `capacitor.config.ts`), origen `http://localhost`.
- El pitch se sirve desde el propio `sync-server`, tambien `http://localhost:7777`.
- Cualquier deploy publico (Vercel/Netlify/similar) es **solo QA/demo**, con `VITE_SYNC_TRANSPORT=broadcast` - no sirve para el stand real y nunca se apunta a un `sync-server` real desde ahi.
- En Android: `android:usesCleartextTraffic="true"` + `network_security_config.xml` (ver Fase 6 mas abajo). Sin esto, el WebView bloquea la conexion en silencio.

## Instalacion en sitio

1. Router/AP dedicado para el stand. No necesita internet, pero si lo tiene, mejor (rankings/participaciones).
2. **Reserva DHCP o IP fija** para el equipo del pitch en el router - si su IP cambia entre reinicios, la tablet queda apuntando a la IP vieja hasta que alguien la reconfigure a mano.
3. En el equipo del pitch: `npm install`, `npm run build:client`, `npm run dev:server` (o el proceso equivalente en produccion) corriendo de forma persistente. Pantalla en modo kiosco (cursor oculto - `/pitch` ya trae `hide-cursor` propio -, protector de pantalla del SO deshabilitado, apagado de pantalla deshabilitado).
4. En la tablet: instalar el APK (ver Fase 6), abrir la app, tocar 5 veces el logo en Inicio para entrar a Settings, cargar la IP del equipo del pitch (paso 2) + puerto `7777` + el `room`/nombre del stand.
5. Confirmar en `/pitch` que el punto de conexion (modo debug) se ve verde antes de abrir el stand.

## Estructura del monorepo

```
apps/client       app React (tablet + pitch), Vite + TypeScript
apps/sync-server  servidor Node de sincronizacion local
android           proyecto Capacitor - la tablet empaquetada como APK
```

## Desarrollo

```bash
npm install
npm run dev:client   # app en local, rutas /tablet, /pitch y /debug/sync
npm run dev:server   # sync-server, ws://localhost:7777
```

Por default el cliente usa el transporte `BroadcastChannelSync` (dos pestanas de la misma maquina, sin servidor). Para probar contra `sync-server` de verdad, copia `apps/client/.env.example` a `apps/client/.env` con `VITE_SYNC_TRANSPORT=websocket`, abre `/debug/sync`, guarda host/puerto/room (el mismo `sync-server` corriendo en `localhost:7777` sirve para probar en una sola maquina) y dispara eventos a mano.

## Empaquetado de la tablet (APK)

```bash
npm run android:sync    # build del cliente + cap sync android
npm run android:build   # lo anterior + gradlew assembleRelease (necesita JDK 17+ y Android SDK instalados)
```

Este entorno no tiene JDK ni Android SDK, asi que `android:build` no se pudo correr ni verificar aqui - `android:sync` si, y deja `android/app/src/main/assets/public` con el build real. El paso de `gradlew` hay que probarlo con Android Studio instalado.

**Firma de release:** el keystore nunca va en el repo (`android/.gitignore` lo excluye). Procedimiento:

```bash
keytool -genkey -v -keystore mirage-release.keystore -alias mirage -keyalg RSA -keysize 2048 -validity 10000
```

Guarda el `.keystore` fuera del repo, copia `android/keystore.properties.example` a `android/keystore.properties` y llena `storeFile` (ruta al `.keystore`), `storePassword`, `keyAlias`, `keyPassword`. Sin ese archivo, `assembleRelease` genera un APK sin firmar.

**Modo kiosco** (`MainActivity.java`): pantalla siempre encendida, immersive fullscreen, orientacion bloqueada en landscape, `startLockTask()` (pantalla fija - en el dispositivo real conviene ademas configurarla como Device Owner via `adb` para que el pinning no se pueda salir con un gesto, ver documentacion de Android Enterprise), boton atras deshabilitado.

`versionCode`/`versionName` en `android/app/build.gradle` se alinean a mano con los tags de git de cada release.

## Gateway a internet (Fase 7)

La tablet nunca habla con internet directamente: manda `PARTICIPATION_RESULT` (incluye `name`/`email`/`code`/`productId`/`points`) por WebSocket al `sync-server`, que lo encola en `apps/sync-server/outbox/records.jsonl` (patron outbox - persistido antes de intentar el envio) y lo entrega con reintentos exponenciales a tres destinos: `eviusAttendee`, `eviusExperience` y `rankingDb`. Un `idempotencyKey` por sesion evita que un doble flush duplique el registro en cualquiera de los tres.

**Evius (eviusapi/Datahub):**
- `POST /attendees` - solo si hay `email` (sin registro, se omite igual que en otras experiencias). Deduplica del lado del servidor por `(email, eventId)`.
- `POST /experiences` - siempre, con o sin registro (usa un email sintetico si hace falta). Lleva `score`/`bonusScore` nativos - se prefirio sobre `/activities` (que si esta en el PDF oficial de eviusapi) porque `/activities` obligaria a esconder el puntaje como string JSON en `longDescription`. `/experiences` no aparece en el PDF de mayo 2026, solo se vio en produccion en otras experiencias del equipo - si falla, el gateway cae automaticamente a `/activities` (score embebido en `longDescription`) antes de darle el fallo al outbox, para no reintentar contra un endpoint que puede no existir en este evento.
- "Mirage Colombia" y "Mirage Mexico" son eventos separados en Evius, asi que `EVIUS_EVENT_ID`, `EVIUS_EXPERIENCE_ID` y `COUNTRY` son variables de entorno propias de cada despliegue del `sync-server` (uno por pais) - nunca compartidas ni hardcodeadas.
- El email se normaliza (`trim` + `lowercase`) antes de mandarlo a cualquier lado - es la llave de dedup entre Evius y Supabase, y tiene que cruzar igual sin importar en cual experiencia (catalogo o memory match) jugo primero la persona. Mismo criterio de normalizacion acordado con el proyecto de Memory Match.

**Ranking (Supabase):** esquema completo en [`docs/supabase-schema.sql`](docs/supabase-schema.sql) - un solo proyecto compartido entre paises y entre experiencias (catalogo, memory match), diferenciado por columnas `country`/`experience` en cada registro, no por DBs separadas. Tabla `participations` con constraint unico `(participant_id, country, experience)` - es lo que de verdad impide que alguien participe dos veces en la misma experiencia, no solo el guard de UI. Dos vistas de lectura: `ranking_by_experience` (top de una sola experiencia) y `ranking_combined` (promedio catalogo+memory_match por persona, tratando la no jugada como 0 - la que decide el premio). El registro que este proyecto escribe: `{ participant_id (email normalizado), country, experience: 'catalogo', score, submitted_at }` - mismo shape acordado con Memory Match (que escribe `experience: 'memory_match'`), para que ambas vistas lean filas identicas sin importar de cual experiencia vinieron.

Copia `apps/sync-server/.env.example` a `.env` y llena `EVIUS_URL`/`EVIUS_TOKEN`/`EVIUS_EVENT_ID`/`EVIUS_EXPERIENCE_ID`/`COUNTRY`/`RANKING_DB_URL`/`RANKING_DB_API_KEY` cuando existan. Sin configurar, el outbox acumula y reintenta para siempre - exactamente el mismo comportamiento que "sin internet", verificado con un servidor mock local (retry con backoff, purga tras 2xx, deduplicacion por idempotencyKey).

`GET /ranking?experience=catalogo` en el mismo puerto del `sync-server` expone el ranking compartido (pensado para reusarse con la experiencia "kick_and_match" via la columna `experience`); devuelve `503` con el motivo (`ranking_db_not_configured` o `ranking_db_unavailable`) mientras no haya DB real.

## Pruebas de resiliencia

Verificado en este entorno (sin hardware real, con procesos locales):

- [x] Servidor cae y vuelve a mitad de sesion: el cliente detecta la desconexion, reintenta con backoff (1s/2s/4s/8s, tope 8s) y al reconectar recibe un `STATE_SYNC` fresco. Encontrado y corregido en el camino: un bug real que colgaba (o, antes del fix, reventaba el proceso) la reconexion cuando el intento fallaba por conexion rechazada - ver el commit `fix: stop the reconnect loop from hanging or crashing on connection failure`.
- [x] Servidor cae con una sala que ya tenia estado activo: un cliente que se une despues de la caida recibe el `STATE_SYNC` correcto (sala con producto seleccionado), no un estado en blanco.
- [x] Outbox: fallo -> backoff -> exito -> marcado `delivered`; un reintento con el mismo `idempotencyKey` no genera una segunda entrega (probado contra un gateway mock).
- [x] `productId` desconocido en el pitch (cache viejo, catalogo desincronizado) cae a IDLE en vez de dejar las tres capas en opacity 0.

**Pendiente de hardware real** (dos dispositivos fisicos en la misma red, ver criterios de aceptacion del brief original):

- [ ] Tablet y pitch en dispositivos distintos de la misma red, latencia imperceptible.
- [ ] Apagar/prender el Wi-Fi del router: ambos reconectan solos.
- [ ] Reiniciar la tablet a mitad de sesion: el pitch cae a IDLE por el watchdog de 90s (la logica esta escrita y revisada, pero no se disparo con una tablet fisica real).
- [ ] Instalacion del APK real en una tablet Android (modo kiosco, Lock Task, WebView hardening) - el modelo de tablet todavia no esta seleccionado.

## Estado

- [x] Fase 1 - estructura del monorepo, tokens, reset, guards de kiosco, rutas `/tablet` y `/pitch` con pantallas vacias.
- [x] Fase 2 - `sync-server` (salas, snapshot de estado, heartbeat, logs) + `WebSocketSync`/`BroadcastChannelSync` en cliente + `/debug/sync` para probar eventos a mano.
- [x] Fase 3 - assets de Figma optimizados + componentes base (Button, TextField, IdInput, BrandFrame, Logo) + `VideoLayer` con crossfade/autoplay resiliente + catalogo de productos tipado (datos de muestra, ver assets-manifest.md).
- [x] Fase 4 - flujo completo de la tablet (Inicio, Registro con codigo, Seleccion de producto con hotspots, Agradecimiento, Settings).
- [x] Fase 5 - maquina de estados del pitch (IDLE, Attract, ProductContent, watchdog de 90s, persistencia en sessionStorage).
- [x] Fase 6 - proyecto Capacitor, modo kiosco, network security config. `gradlew assembleRelease` no se pudo probar en este entorno (sin JDK/Android SDK) - pendiente de una maquina con Android Studio.
- [x] Fase 7 - outbox con reintentos/backoff/idempotencia (verificado con un gateway mock local), `GET /ranking`. Sin data hub ni DB de rankings reales todavia - pendiente del equipo.
- [x] Fase 8 - diagrama de red, instructivo de montaje, advertencia HTTPS consolidada, pruebas de resiliencia automatizables (ver arriba). Las pruebas que necesitan dos dispositivos fisicos quedan pendientes.

## Pendientes que dependen de terceros (no de codigo)

- Catalogo de productos real (fotos, copy, fichas tecnicas) - hoy es data de muestra, ver `apps/client/src/content/products.ts` y `assets-manifest.md`.
- Video institucional real para IDLE - hoy es un placeholder generado.
- Modelo y resolucion reales de la tablet, y confirmacion de que la pantalla del pitch en Mexico y en Colombia son la misma resolucion (todo el layout ya es responsive/escalado via `ScaleViewport`, pero conviene confirmarlo).
- Endpoints reales del data hub y eleccion Supabase/Firebase para rankings.
- Keystore de firma del APK (se genera en sitio, nunca se commitea).
