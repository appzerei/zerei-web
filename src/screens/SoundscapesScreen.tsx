import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { logError } from '../utils/logger';

// ─── Sons disponíveis ─────────────────────────────────────────────────────────
const SOUNDS = [
  {
    id: 'oceano',
    label: 'Oceano',
    image: require('../assets/soundscapes/oceano.png'),
    file: require('../assets/sounds/oceano.mp3'),
  },
  {
    id: 'fogueira',
    label: 'Fogueira',
    image: require('../assets/soundscapes/fogueira.png'),
    file: require('../assets/sounds/fogueira.mp3'),
  },
  {
    id: 'chuva',
    label: 'Chuva',
    image: require('../assets/soundscapes/chuva.png'),
    file: require('../assets/sounds/rain.mp3'),
  },
  {
    id: 'floresta',
    label: 'Floresta',
    image: require('../assets/soundscapes/floresta.png'),
    file: require('../assets/sounds/forest.mp3'),
  },
  {
    id: 'cachoeira',
    label: 'Cachoeira',
    image: require('../assets/soundscapes/cachoeira.png'),
    file: require('../assets/sounds/cachoeira.mp3'),
  },
  {
    id: 'vento',
    label: 'Vento',
    image: require('../assets/soundscapes/vento.png'),
    file: require('../assets/sounds/vento.mp3'),
  },
] as const;

interface Props {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function SoundscapesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [soundLoading, setSoundLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // ── Áudio ──────────────────────────────────────────────────────────────────
  const stopSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
    }
  }, []);

  const playSound = useCallback(async (soundId: string) => {
    setSoundLoading(true);
    await stopSound();

    const soundObj = SOUNDS.find(s => s.id === soundId);
    if (!soundObj) { setSoundLoading(false); return; }

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      const { sound } = await Audio.Sound.createAsync(soundObj.file, {
        isLooping: true,
        volume: 0.7,
      });
      soundRef.current = sound;
      await sound.playAsync();
      setSelectedSound(soundId);
    } catch (error) {
      logError('SoundscapesScreen.playSound', error);
    } finally {
      setSoundLoading(false);
    }
  }, [stopSound]);

  const handlePress = useCallback(async (soundId: string) => {
    if (selectedSound === soundId) {
      await stopSound();
      setSelectedSound(null);
    } else {
      await playSound(soundId);
    }
  }, [selectedSound, playSound, stopSound]);

  // Cleanup ao sair da tela
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, [stopSound]);

  const handleBack = useCallback(async () => {
    await stopSound();
    navigation.goBack();
  }, [stopSound, navigation]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#060912', '#080C14', '#0A0F1C']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={handleBack}
        >
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Soundscapes</Text>
        <Text style={styles.subtitle}>
          Relaxe e deixe-se levar para um mundo diferente{'\n'}para ajudar a diminuir os impulsos
        </Text>
      </View>

      {/* Lista de sons */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {SOUNDS.map((s) => {
          const isActive = selectedSound === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.88}
              style={[styles.soundCard, isActive && styles.soundCardActive]}
              onPress={() => handlePress(s.id)}
              disabled={soundLoading}
            >
              <ImageBackground
                source={s.image}
                style={styles.soundCardBg}
                imageStyle={styles.soundCardImage}
                resizeMode="cover"
              >
                {/* Overlay escuro para legibilidade */}
                <LinearGradient
                  colors={
                    isActive
                      ? ['rgba(61,84,217,0.55)', 'rgba(20,30,90,0.45)']
                      : ['rgba(8,12,20,0.55)', 'rgba(8,12,20,0.35)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Conteúdo do card */}
                <View style={styles.soundCardContent}>
                  <Text style={styles.soundLabel}>{s.label}</Text>
                  <View style={[styles.playIcon, isActive && styles.playIconActive]}>
                    <Text style={styles.playIconText}>
                      {isActive ? '■' : '▶'}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  backBtn: {
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 15,
    color: '#3D54D9',
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: '#E0EAFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: 'rgba(224,234,255,0.45)',
    lineHeight: 22,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },

  // Cards
  soundCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  soundCardActive: {
    borderColor: '#3D54D9',
    borderWidth: 1.5,
  },
  soundCardBg: {
    flex: 1,
  },
  soundCardImage: {
    borderRadius: 18,
  },
  soundCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  soundLabel: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  playIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconActive: {
    backgroundColor: '#3D54D9',
  },
  playIconText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});
