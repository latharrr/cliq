import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lpu.cliq',
  appName: 'CLIQ',
  webDir: 'public', // Using public directory to bypass strict static export checks
  server: {
    // This entirely removes the need to package the app! It maps directly bridging the Vercel app natively.
    url: 'https://cliq.deepanshulathar.dev/feed',
    cleartext: true
  }
};

export default config;
