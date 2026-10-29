// {
//   "expo": {
//     "name": "your-app-name",
//     "slug": "your-app-slug",
//     "version": "1.0.0",
//     "scheme": "your-app-scheme",
//     "orientation": "portrait",
//     "icon": "./assets/icon.png",
//     "userInterfaceStyle": "light",
//     "ios": {
//       "bundleIdentifier": "com.polygonZ.myfullstackapp",
//       "supportsTablet": true
//     },
//     "android": {
//       "package": "com.polygonZ.myfullstackapp",
//       "adaptiveIcon": {
//         "backgroundColor": "#E6F4FE",
//         "foregroundImage": "./assets/android-icon-foreground.png",
//         "backgroundImage": "./assets/android-icon-background.png",
//         "monochromeImage": "./assets/android-icon-monochrome.png"
//       },
//       "softwareKeyboardLayoutMode": "resize",
//       "predictiveBackGestureEnabled": false
//     },
//     "web": {
//       "favicon": "./assets/favicon.png"
//     },
//     "experiments": {
//       "typedRoutes": true,
//       "tsconfigPaths": true
//     }
//   }
// }

// app.json 대신 app.config.ts를 사용하면 주석도 활용가능하며, api key와 같은 값들을 .env로 관리하여 동적 바인딩이 가능하다.
// 지도가 필요하면 EXPO_PUBLIC_GOOGLE_MAPS_API_KEY .env 값을 바인딩

import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name || 'your-app-name', // 앱으로 사용할 name (ex - snap map)
  slug: config.slug || 'your-app-slug', // client package.json의 name과 일치
  version: '1.0.0',
  // scheme은 외부 웹사이트나 다른 앱에서 내 앱을 직접 호출하여 열기 위해 사용하는 ‘앱 전용 URL 주소(Custom URL Scheme)’입니다.
  // 웹 브라우저에서 https://로 시작하는 주소를 입력하면 웹페이지가 열리는 것처럼, 휴대폰에서 내스킴:// 형태의 주소를 누르면 내 앱이 실행됩니다.  
  // 보통 앱 이름을 대표하는 영문 소문자 단어를 넣습니다. (특수문자, 공백, 대문자 제외)
  scheme: "your-app-scheme",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "com.polygonZ.myfullstackapp",
    supportsTablet: true
  },
  android: {
    package: "com.polygonZ.myfullstackapp",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png"
    },
    softwareKeyboardLayoutMode: "resize",
    predictiveBackGestureEnabled: false,
    // 💡 [Android 구글 맵 사용 시 주석 해제]
    // config: {
    //   googleMaps: {
    //     apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    //   },
    // },
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true
  },
  plugins: [
    'expo-router'
  ],
  // 💡 앱을 빌드하기 위해서 다음의 명령어(pnpm --filter <clientName> exec eas build:configure)를 사용하면
  // 터미널에서 특정 projectId가 나올텐데 해당 projectId값을 projectId에 바인딩하면 됨 (주석 해제 후 사용)
  // extra: {
  //   ...config.extra,
  //   eas: {
  //     projectId: '여기에_터미널에_출력된_PROJECT_ID_입력',
  //   },
  // },
});