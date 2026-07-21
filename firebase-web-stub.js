const React = require('react');
const { View } = require('react-native');

const DummyView = (props) => React.createElement(View, props);

const dummyFunc = () => {};
const dummyAsyncFunc = () => Promise.resolve(null);

const app = {
  name: '[DEFAULT]',
  options: {},
  init: dummyFunc,
  startCall: dummyAsyncFunc,
  acceptCall: dummyAsyncFunc,
  rejectCall: dummyFunc,
  endCall: dummyFunc,
  toggleMute: () => false,
  switchCamera: dummyFunc,
  on: dummyFunc,
  off: dummyFunc
};

module.exports = app;
module.exports.default = app;
module.exports.firebase = app;
module.exports.RTCView = DummyView;
module.exports.mediaDevices = {};
module.exports.RTCPeerConnection = function() {};
module.exports.RTCIceCandidate = function() {};
module.exports.RTCSessionDescription = function() {};
module.exports.init = dummyFunc;
module.exports.startCall = dummyAsyncFunc;
module.exports.acceptCall = dummyAsyncFunc;
module.exports.rejectCall = dummyFunc;
module.exports.endCall = dummyFunc;
module.exports.toggleMute = () => false;
module.exports.switchCamera = dummyFunc;
module.exports.on = dummyFunc;
module.exports.off = dummyFunc;
