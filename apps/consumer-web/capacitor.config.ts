import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.khxzi.fixit',
  appName: 'FixIt',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    }
  }
};

export default config;
