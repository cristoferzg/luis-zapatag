import type { CapacitorConfig } from '@capacitor/cli';

// App Android (Play Store). Carga la web publicada (server.url); dist/ solo aporta offline.html.
// Flujo: npm run build && npx cap sync android && npx cap open android
const config: CapacitorConfig = {
  appId: 'pe.innovacontratistas.app',
  appName: 'InnovApp',
  webDir: 'dist',
  // Se actualiza sola: la app carga la web publicada en Firebase Hosting, así cada
  // "firebase deploy" llega a los teléfonos sin generar otro APK. Sin internet se
  // muestra offline.html (va dentro del APK) con un botón para reintentar.
  server: {
    url: 'https://innovacontratistas-434d2.web.app',
    androidScheme: 'https',
    errorPath: 'offline.html',
  },
  android: {
    // Sin zoom ni gestos del navegador: se comporta como app nativa.
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    StatusBar: { overlaysWebView: false, style: 'DARK', backgroundColor: '#0f172a' },
  },
};

export default config;
