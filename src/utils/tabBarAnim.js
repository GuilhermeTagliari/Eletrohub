import { Animated, Easing } from 'react-native';

// Height of the tab bar area (pill + padding + safe area approx)
// Used by screens to add contentInsetBottom so content clears the floating bar
export const TAB_BAR_INSET = 110;

// 1 = expanded, 0 = shrunk
export const tabBarAnim = new Animated.Value(1);

let lastY = 0;
let targetValue = 1;
let running = null;

function animate(toValue, duration, easing) {
  if (targetValue === toValue) return;
  targetValue = toValue;
  if (running) running.stop();
  running = Animated.timing(tabBarAnim, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
  running.start(({ finished }) => { if (finished) running = null; });
}

export function onTabBarScroll(y) {
  const delta = y - lastY;
  lastY = y;

  if (y < 25) {
    // At top: always expand with a gentle bounce
    animate(1, 400, Easing.out(Easing.back(1.6)));
    return;
  }

  if (delta > 5) {
    // Scrolling down → shrink quickly
    animate(0, 180, Easing.out(Easing.quad));
  } else if (delta < -5) {
    // Scrolling up → expand with elastic bounce
    animate(1, 420, Easing.out(Easing.back(2.0)));
  }
}
