import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.knoux.smartorganizer",
  appName: "Knoux SmartOrganizer PRO",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    App: {
      launchAutoHide: false,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 1000,
      backgroundColor: "#6366f1",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#6366f1",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
    Camera: {
      permissions: ["camera", "photos"],
    },
    Filesystem: {
      permissions: ["read", "write"],
    },
    Device: {
      permissions: ["camera"],
    },
    Geolocation: {
      permissions: ["location"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#6366f1",
      sound: "beep.wav",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: "APK",
      signingType: "apksigner",
    },
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    loggingBehavior: "debug",
  },
  ios: {
    scheme: "Knoux SmartOrganizer",
    contentInset: "automatic",
    scrollEnabled: true,
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
    backgroundColor: "#6366f1",
  },
};

export default config;
