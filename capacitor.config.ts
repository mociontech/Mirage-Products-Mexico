import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mirage.catalogointeractivo',
  appName: 'Mirage Catalogo Interactivo',
  webDir: 'apps/client/dist',
  server: {
    // La tablet abre directo en /tablet - nunca en la ruta raiz ni en /pitch.
    androidScheme: 'http',
  },
};

export default config;
