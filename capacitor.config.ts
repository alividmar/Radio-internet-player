import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'si.radio.internetni',
  appName: 'Internetni Radio',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { allowMixedContent: true }
};

export default config;
