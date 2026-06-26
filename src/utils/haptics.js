import { Vibration, Platform } from 'react-native';

let _H = null;
let _tried = false;

function getH() {
  if (_tried) return _H;
  _tried = true;
  try { _H = require('expo-haptics'); } catch (_) {}
  return _H;
}

export function hapticLight() {
  const H = getH();
  if (H) { H.impactAsync(H.ImpactFeedbackStyle.Light).catch(() => {}); }
  else if (Platform.OS === 'android') { Vibration.vibrate(10); }
}

export function hapticSuccess() {
  const H = getH();
  if (H) { H.notificationAsync(H.NotificationFeedbackType.Success).catch(() => {}); }
  else if (Platform.OS === 'android') { Vibration.vibrate(15); }
}

export function hapticMedium() {
  const H = getH();
  if (H) { H.impactAsync(H.ImpactFeedbackStyle.Medium).catch(() => {}); }
  else if (Platform.OS === 'android') { Vibration.vibrate(20); }
}
