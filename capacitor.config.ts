import type { CapacitorConfig } from '@capacitor/cli';

// App Android (Play Store) que empaqueta la misma app web ya compilada (dist/).
// Flujo: npm run build && npx cap sync android && npx cap open android
const config: CapacitorConfig = {
  appId: 'pe.innovacontratistas.app',
  appName: 'Innova Contratistas',
  webDir: 'dist',
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
