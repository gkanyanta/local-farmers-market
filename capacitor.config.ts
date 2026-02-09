import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.localfarmersmarket.app",
  appName: "Local Farmers Market",
  webDir: "public",
  server: {
    // Replace with your deployed Vercel production URL
    url: "https://local-farmers-market.vercel.app",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#16a34a",
      spinnerColor: "#ffffff",
      launchShowDuration: 2000,
      showSpinner: true,
    },
    StatusBar: {
      backgroundColor: "#16a34a",
      style: "LIGHT",
    },
    Keyboard: {
      resize: "body",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
