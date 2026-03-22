import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lpu.cliq',
  appName: 'CLIQ',
  webDir: 'public', // Using public directory for remote wrapper
  server: {
    // Bridges the native app directly to the live Vercel deployment.
    // Points to /auth so unauthenticated users see login immediately.
    // Authenticated users will be auto-redirected to /feed by proxy.ts middleware.
    url: 'https://cliq.deepanshulathar.dev/auth',
    cleartext: true
  }
};

export default config;
