const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web ke liye @react-native-firebase stub banao
// Yeh packages web browser mein kaam nahi karte (native only hain)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Stub all native-only packages for web
    if (
      moduleName.startsWith('@react-native-firebase/app') ||
      moduleName.startsWith('@react-native-firebase/auth') ||
      moduleName.startsWith('@react-native-firebase') ||
      moduleName === 'react-native-webrtc' ||
      moduleName === 'react-native-maps' ||
      moduleName.includes('webrtcService')
    ) {
      return {
        filePath: require.resolve('./firebase-web-stub.js'),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
