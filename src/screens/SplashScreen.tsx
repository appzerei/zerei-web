import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

function Wave({ delay, size, duration }: { delay: number; size: number; duration: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.35, 0.2, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: '#3D54D9',
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export default function SplashScreen({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fraseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Tocar áudio da intro
    const playSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/healing-spell-cast.mp3'),
          { shouldPlay: true, volume: 0.8 }
        );
        setTimeout(() => sound.unloadAsync(), 6000);
      } catch (e) {}
    };
    playSound();

    // Fade in do logo
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      // Fade in das frases
      Animated.timing(fraseAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Navegar após 5 segundos
    const timer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Ondas animadas */}
      <View style={styles.waveContainer}>
        <Wave delay={0}    size={width * 0.5} duration={3000} />
        <Wave delay={600}  size={width * 0.75} duration={3000} />
        <Wave delay={1200} size={width * 1.0} duration={3000} />
        <Wave delay={1800} size={width * 1.3} duration={3000} />
      </View>

      {/* Logo */}
      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim }]}>
        <Image
          source={require('../assets/logo/logozerei.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Frases */}
      <Animated.View
        style={[
          styles.frasesWrapper,
          { opacity: fraseAnim, paddingBottom: insets.bottom + 48 },
        ]}
      >
        <Text style={styles.frase1}>Respire fundo.</Text>
        <Text style={styles.frase2}>Você é mais forte do que este impulso.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.65,
    height: 120,
  },
  frasesWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
  },
  frase1: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  frase2: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});