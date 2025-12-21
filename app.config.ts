import { ConfigContext, ExpoConfig } from "expo/config";


const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

// Google OAuth iOS Client IDs per environment
const GOOGLE_IOS_CLIENT_IDS = {
  development: '576860647918-nm7ghog299kfj4dirlln5a7s7dotto95',
  preview: '576860647918-hf9vfimbv7bnenvtcgeecepeub1lko1p',
  production: '576860647918-qn7ok48tfb5q2iopjb56pf1mqcp3s109',
};

const getGoogleIosClientId = () => {
  if (IS_DEV) {
    return GOOGLE_IOS_CLIENT_IDS.development;
  }
  if (IS_PREVIEW) {
    return GOOGLE_IOS_CLIENT_IDS.preview;
  }
  return GOOGLE_IOS_CLIENT_IDS.production;
};

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.hryvnt.cuistudio.dev';
  }

  if (IS_PREVIEW) {
    return 'com.hryvnt.cuistudio.preview';
  }

  return 'com.hryvnt.cuistudio';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'Cuisto (Dev)';
  }

  if (IS_PREVIEW) {
    return 'Cuisto (Preview)';
  }

  return 'Cuisto';
};



export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "cuisto",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "cuistudiomobile",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
    icon: "./assets/cuisto.icon",
    usesAppleSignIn: true,
    config: {
      usesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png"
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: getUniqueIdentifier(),
    permissions: [
      "android.permission.RECORD_AUDIO"
    ]
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    [
      "expo-router"
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 100,
        resizeMode: "contain",
        backgroundColor: "#334d43"
      }
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "The app accesses your photos to let you upload them to your recipes."
      }
    ],
    "expo-web-browser",
    "expo-apple-authentication",
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: `com.googleusercontent.apps.${getGoogleIosClientId()}`
      }
    ]
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  },
  extra: {
    router: {},
    googleIosClientId: `${getGoogleIosClientId()}.apps.googleusercontent.com`,
    eas: {
      projectId: "1ec87d29-438e-494a-87aa-d1b1ed577f15"
    }
  },
  owner: "harrys-expo-org"
})