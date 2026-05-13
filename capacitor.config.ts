import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.todoz.app',
  appName: 'Todoz',
  webDir: 'dist/todoz/browser',
  server: {
    hostname: 'app',
    androidScheme: 'https'
  }
};

export default config;
