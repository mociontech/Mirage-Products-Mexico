# Mirage - Catalogo Interactivo

Experiencia de dos dispositivos sincronizados en red local para punto de venta:

- **Tablet Android (tactil, APK):** recorre el flujo y selecciona producto.
- **Pantalla Pitch (grande, no tactil):** espejo narrativo del producto seleccionado; en reposo muestra un video institucional en loop.

La experiencia funciona sin internet. La red local es obligatoria; internet solo se usa para enviar participaciones y leer rankings (ver Fase 7).

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

La tablet corre como APK (Capacitor), origen `http://localhost` - nunca como el deploy web publico (ver advertencia de HTTPS/contenido mixto mas abajo).

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

**Red:** `usesCleartextTraffic="true"` + `network_security_config.xml` (cleartext permitido a nivel base-config; Android no admite restringir esto por rango CIDR, solo por dominio/IP exacta, y la IP del sync-server se configura en sitio - ver pantalla de Settings). Reservale al equipo del pitch una **IP fija o reserva DHCP** en el router del stand para que la IP no cambie entre reinicios.

`versionCode`/`versionName` en `android/app/build.gradle` se alinean a mano con los tags de git de cada release.

## Estado

Este README se ampliara al final de cada fase con diagrama de red, procedimiento de instalacion en sitio y advertencias de HTTPS/contenido mixto (ver Fase 8). Por ahora:

- [x] Fase 1 - estructura del monorepo, tokens, reset, guards de kiosco, rutas `/tablet` y `/pitch` con pantallas vacias.
- [x] Fase 2 - `sync-server` (salas, snapshot de estado, heartbeat, logs) + `WebSocketSync`/`BroadcastChannelSync` en cliente + `/debug/sync` para probar eventos a mano.
- [x] Fase 3 - assets de Figma optimizados + componentes base (Button, TextField, IdInput, BrandFrame, Logo) + `VideoLayer` con crossfade/autoplay resiliente + catalogo de productos tipado (datos de muestra, ver assets-manifest.md).
- [x] Fase 4 - flujo completo de la tablet (Inicio, Registro con codigo, Seleccion de producto con hotspots, Agradecimiento, Settings).
- [x] Fase 5 - maquina de estados del pitch (IDLE, Attract, ProductContent, watchdog de 90s, persistencia en sessionStorage).
- [x] Fase 6 - proyecto Capacitor, modo kiosco, network security config. `gradlew assembleRelease` no se pudo probar en este entorno (sin JDK/Android SDK) - pendiente de una maquina con Android Studio.
- [ ] Fase 7 en adelante - ver historial de commits.
