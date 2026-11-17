import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { logError } from '../utils/logger';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Sons disponíveis ─────────────────────────────────────────────────────────
const SOUNDS = [
  {
    id: 'rain',
    label: 'Chuva',
    emoji: '🌧️',
    // Coloque o arquivo em src/assets/sounds/rain.mp3
    file: require('../assets/sounds/rain.mp3'),
  },
  {
    id: 'forest',
    label: 'Floresta',
    emoji: '🌿',
    // Coloque o arquivo em src/assets/sounds/forest.mp3
    file: require('../assets/sounds/forest.mp3'),
  },
  {
    id: 'waves',
    label: 'Ondas',
    emoji: '🌊',
    // Coloque o arquivo em src/assets/sounds/waves.mp3
    file: require('../assets/sounds/waves.mp3'),
  },
] as const;

// ─── Fases da respiração 4-7-8 ────────────────────────────────────────────────
const BREATH_PHASES = [
  { label: 'INSPIRE',  seconds: 4, color: '#3D54D9', scale: 1.35 },
  { label: 'SEGURE',   seconds: 7, color: '#4A9C52', scale: 1.35 },
  { label: 'EXPIRE',   seconds: 8, color: '#6B7FE8', scale: 0.75 },
];

interface Props {
  onClose: () => void;
}

export default function MeditarScreen({ onClose }: Props) {
  const insets = useSafeAreaInsets();

  // Som selecionado
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [soundLoading, setSoundLoading] = useState(false);

  // Respiração
  const [breathActive, setBreathActive] = useState(false);
  const [phase, setPhase] = useState(0);
  const [cycles, setCycles] = useState(0);
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;
  const activeRef   = useRef(false);
  const animRef     = useRef<Animated.CompositeAnimation | null>(null);
  const phaseRef    = useRef(0);

  // Fade de entrada
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
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
      const { sound } = await Audio.Sound.createAsync(soundObj.file, {
        isLooping: true,
        volume: 0.6,
      });
      soundRef.current = sound;
      await sound.playAsync();
      setSelectedSound(soundId);
    } catch (error) {
      logError('MeditarScreen.playSound', error);
    } finally {
      setSoundLoading(false);
    }
  }, [stopSound]);

  const handleSoundPress = useCallback(async (soundId: string) => {
    if (selectedSound === soundId) {
      await stopSound();
      setSelectedSound(null);
    } else {
      await playSound(soundId);
    }
  }, [selectedSound, playSound, stopSound]);

  // ── Respiração ─────────────────────────────────────────────────────────────
  const runPhase = useCallback((p: number) => {
    if (!activeRef.current) return;
    const current = BREATH_PHASES[p];

    animRef.current = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: current.scale,
        duration: current.seconds * 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: p === 1 ? 1 : 0.5,
        duration: current.seconds * 1000,
        useNativeDriver: true,
      }),
    ]);

    animRef.current.start(({ finished }) => {
      if (!finished || !activeRef.current) return;
      const next = (p + 1) % BREATH_PHASES.length;
      if (next === 0) setCycles(c => c + 1);
      phaseRef.current = next;
      setPhase(next);
      runPhase(next);
    });
  }, [scaleAnim, opacityAnim]);

  const startBreath = useCallback(() => {
    activeRef.current = true;
    setBreathActive(true);
    phaseRef.current = 0;
    setPhase(0);
    setCycles(0);
    runPhase(0);
  }, [runPhase]);

  const stopBreath = useCallback(() => {
    activeRef.current = false;
    setBreathActive(false);
    animRef.current?.stop();
    scaleAnim.setValue(1);
    opacityAnim.setValue(0.5);
  }, [scaleAnim, opacityAnim]);

  // Cleanup ao fechar
  const handleClose = useCallback(async () => {
    stopBreath();
    await stopSound();
    onClose();
  }, [stopBreath, stopSound, onClose]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      animRef.current?.stop();
      stopSound();
    };
  }, [stopSound]);

  const currentPhase = BREATH_PHASES[phase];

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#04070F', '#080C14', '#060912']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          activeOpacity={0.8}
          onPress={handleClose}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Meditar</Text>
          {cycles > 0 && (
            <Text style={styles.headerCycles}>{cycles} ciclo{cycles !== 1 ? 's' : ''} completo{cycles !== 1 ? 's' : ''}</Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Seleção de sons */}
      <View style={styles.soundsRow}>
        {SOUNDS.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.soundBtn,
              selectedSound === s.id && styles.soundBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => handleSoundPress(s.id)}
            disabled={soundLoading}
          >
            {selectedSound === s.id && (
              <LinearGradient
                colors={['rgba(61,84,217,0.4)', 'rgba(41,60,166,0.2)']}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text style={styles.soundEmoji}>{s.emoji}</Text>
            <Text style={[
              styles.soundLabel,
              selectedSound === s.id && styles.soundLabelActive,
            ]}>
              {s.label}
            </Text>
            {selectedSound === s.id && (
              <View style={styles.soundPlayingDot} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bolha de respiração */}
      <View style={styles.bubbleContainer}>
        {/* Glow externo */}
        <Animated.View style={[
          styles.bubbleGlow,
          {
            backgroundColor: breathActive ? currentPhase.color + '18' : '#3D54D918',
            transform: [{ scale: Animated.multiply(scaleAnim, new Animated.Value(1.5)) }],
          }
        ]} />

        {/* Bolha principal */}
        <Animated.View style={[
          styles.bubble,
          {
            borderColor: breathActive ? currentPhase.color : '#1A2240',
            backgroundColor: breathActive ? currentPhase.color + '18' : 'transparent',
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}>
          <Text style={[
            styles.bubblePhaseLabel,
            { color: breathActive ? currentPhase.color : 'rgba(255,255,255,0.3)' },
          ]}>
            {breathActive ? currentPhase.label : 'PRONTO?'}
          </Text>
          {breathActive && (
            <Text style={styles.bubbleSeconds}>{currentPhase.seconds}s</Text>
          )}
        </Animated.View>
      </View>

      {/* Instrução */}
      <View style={styles.instructionBlock}>
        <Text style={styles.instructionText}>
          {breathActive
            ? phase === 0 ? 'Inspire pelo nariz, lentamente...'
            : phase === 1 ? 'Segure o ar nos pulmões...'
            : 'Expire pela boca com som suave...'
            : 'Técnica 4-7-8. Inspire 4s · Segure 7s · Expire 8s'}
        </Text>
      </View>

      {/* Botão principal */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.mainBtn}
          activeOpacity={0.85}
          onPress={breathActive ? stopBreath : startBreath}
        >
          <LinearGradient
            colors={breathActive ? ['#C0392B', '#922B21'] : ['#3D54D9', '#293CA6']}
            style={styles.mainBtnGradient}
          >
            <Text style={styles.mainBtnText}>
              {breathActive ? '⏹  Pausar' : '▶  Começar'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const BUBBLE_SIZE = Math.min(SCREEN_W * 0.55, 220);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04070F',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Rubik_400Regular',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 17,
    color: '#E0EAFF',
    letterSpacing: 0.5,
  },
  headerCycles: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: '#4A9C52',
  },

  // Sons
  soundsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  soundBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A2240',
    backgroundColor: '#0A0F1A',
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  soundBtnActive: {
    borderColor: '#3D54D9',
  },
  soundEmoji: {
    fontSize: 22,
  },
  soundLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
  },
  soundLabelActive: {
    color: '#6B7FE8',
    fontFamily: 'Rubik_500Medium',
  },
  soundPlayingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3D54D9',
  },

  // Bolha
  bubbleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleGlow: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bubblePhaseLabel: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 18,
    letterSpacing: 3,
    textAlign: 'center',
  },
  bubbleSeconds: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },

  // Instrução
  instructionBlock: {
    paddingHorizontal: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  instructionText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 23,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
  },
  mainBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  mainBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  mainBtnText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
