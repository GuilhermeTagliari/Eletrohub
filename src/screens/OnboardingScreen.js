import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    icon: 'bag-outline',
    color: '#1a1a1a',
    accent: '#fff',
    title: 'Compre com segurança',
    desc: 'Encontre os melhores eletrônicos com garantia de qualidade e entrega rápida para todo o Brasil.',
  },
  {
    key: '2',
    icon: 'storefront-outline',
    color: '#2c7be5',
    accent: '#fff',
    title: 'Anuncie seus produtos',
    desc: 'Venda seus eletrônicos de forma simples. Crie anúncios, defina seu preço e alcance compradores.',
  },
  {
    key: '3',
    icon: 'chatbubbles-outline',
    color: '#2ed573',
    accent: '#fff',
    title: 'Negocie pelo chat',
    desc: 'Converse diretamente com vendedores, faça propostas e feche o melhor negócio em segundos.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const flatRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();
  const s = makeStyles(colors);

  useEffect(() => {
    AsyncStorage.getItem('@eletrohub:onboarding').then(val => {
      if (val) navigation.replace('Login');
    });
  }, []);

  async function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      await AsyncStorage.setItem('@eletrohub:onboarding', '1');
      navigation.replace('Login');
    }
  }

  function handleSkip() {
    AsyncStorage.setItem('@eletrohub:onboarding', '1');
    navigation.replace('Login');
  }

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
        {!isLast && <Text style={s.skipText}>Pular</Text>}
      </TouchableOpacity>

      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.key}
        scrollEnabled
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={s.slide}>
            <View style={[s.iconCircle, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={72} color={item.accent} />
            </View>
            <Text style={s.slideTitle}>{item.title}</Text>
            <Text style={s.slideDesc}>{item.desc}</Text>
          </View>
        )}
      />

      <View style={s.footer}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[s.dot, { width: dotWidth, opacity }]} />;
          })}
        </View>

        <TouchableOpacity style={[s.btn, isLast && s.btnPrimary]} onPress={handleNext}>
          <Text style={[s.btnText, isLast && s.btnTextPrimary]}>
            {isLast ? 'Começar' : 'Próximo'}
          </Text>
          <Ionicons
            name={isLast ? 'flash' : 'arrow-forward'}
            size={18}
            color={isLast ? colors.primaryText : colors.text}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    skipBtn: { alignSelf: 'flex-end', paddingHorizontal: 24, paddingVertical: 16, minWidth: 60, alignItems: 'flex-end' },
    skipText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
    slide: {
      width,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingBottom: 40,
    },
    iconCircle: {
      width: 160, height: 160, borderRadius: 80,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 48,
      shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    slideTitle: {
      fontSize: 28, fontWeight: '800', color: colors.text,
      textAlign: 'center', marginBottom: 16, letterSpacing: -0.5,
    },
    slideDesc: {
      fontSize: 16, color: colors.textSecondary, textAlign: 'center',
      lineHeight: 24, maxWidth: 280,
    },
    footer: { paddingHorizontal: 32, paddingBottom: 40, gap: 28 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { height: 8, borderRadius: 4, backgroundColor: colors.text },
    btn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      borderWidth: 1.5, borderColor: colors.text, borderRadius: 14,
      paddingVertical: 16,
    },
    btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
    btnText: { fontSize: 16, fontWeight: '700', color: colors.text },
    btnTextPrimary: { color: colors.primaryText },
  });
}
