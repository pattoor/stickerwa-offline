import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.stickerswpp.app",
  appName: "Stickers WPP",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: { launchShowDuration: 0 },
  },
};

export default config;