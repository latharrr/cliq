import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lpu.cliq',
  appName: 'CLIQ',
  webDir: 'out', // Use standard Next.js static export folder
  /* server: {
    // Removed direct remote URL bridging to prevent App Store rejection and enable offline features.
    // url: 'https://cliq.deepanshulathar.dev/feed',
    // cleartext: true
  } */
};

export default config;
