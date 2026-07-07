import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.khxzi.fixit.v102',
  appName: 'FixIt Now',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    }
  }
};

export default config;
