const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (
      moduleName.startsWith('@react-native-firebase') ||
      moduleName === 'react-native-webrtc'
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
