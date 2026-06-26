import React, { useState, useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { _registerToast } from '../utils/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CONFIG = {
  success: { color: '#22c55e', icon: 'checkmark-circle' },
  error:   { color: '#ff4757', icon: 'close-circle' },
  info:    { color: '#2c7be5', icon: 'information-circle' },
};

export default function Toast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const timer = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    _registerToast((msg, t = 'success') => {
      clearTimeout(timer.current);
      setMessage(msg);
      setType(t);
      setVisible(true);
      opacity.setValue(0);
      translateY.setValue(16);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 120, friction: 10, useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => setVisible(false));
      }, 2600);
    });
    return () => clearTimeout(timer.current);
  }, []);

  if (!visible) return null;
  const conf = CONFIG[type] || CONFIG.success;

  return (
    <Animated.View style={[
      styles.toast,
      { opacity, transform: [{ translateY }], bottom: insets.bottom + 90 },
    ]}>
      <Ionicons name={conf.icon} size={17} color={conf.color} />
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
    maxWidth: '85%',
    zIndex: 9999,
  },
  text: { fontSize: 14, color: '#fff', fontWeight: '600', flex: 1 },
});
