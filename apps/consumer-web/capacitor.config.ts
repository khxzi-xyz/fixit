import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.khxzi.fixit',
  appName: 'FixIt 1.0',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    }
  }
};

export default config;
