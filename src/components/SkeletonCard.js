import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

export default function SkeletonCard() {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });
  const shade = colors.borderStrong + '88';

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.surface, opacity }]}>
      <View style={[styles.image, { backgroundColor: shade }]} />
      <View style={styles.info}>
        <View style={[styles.line, { width: '38%', height: 9, backgroundColor: shade }]} />
        <View style={[styles.line, { width: '85%', height: 12, backgroundColor: shade, marginTop: 7 }]} />
        <View style={[styles.line, { width: '65%', height: 12, backgroundColor: shade, marginTop: 4 }]} />
        <View style={[styles.line, { width: '48%', height: 16, backgroundColor: shade, marginTop: 10 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, borderRadius: 14, marginBottom: 16, overflow: 'hidden', elevation: 2 },
  image: { width: '100%', height: 130 },
  info: { padding: 12, gap: 0 },
  line: { borderRadius: 6 },
});
