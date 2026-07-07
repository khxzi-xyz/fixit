import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.khxzi.fixitvendor.v103',
  appName: 'FixIt Vendor',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    }
  }
};

export default config;
