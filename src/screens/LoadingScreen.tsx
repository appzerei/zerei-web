import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const CIRCLE_SIZE = 240;
const STROKE_WIDTH = 11;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  onNext: () => void;
  onBack: () => void;
}

function getSubtitle(percent: number): string {
  if (percent < 30) return 'Analisando suas respostas...';
  if (percent < 60) return 'Identificando seus padrões...';
  if (percent < 90) return 'Preparando seu plano...';
  return 'Quase pronto...';
}

export default function LoadingScreen({ onNext, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isProcessing = useRef<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [displayPercent, setDisplayPercent] = useState<number>(0);
  const [subtitle, setSubtitle] = useState<string>('Analisando suas respostas...');

  useEffect((): (() => void) => {
    const listener = progressAnim.addListener(({ value }) => {
      const rounded = Math.floor(value);
      setDisplayPercent(rounded);
      setSubtitle(getSubtitle(rounded));
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(progressAnim, {
        toValue: 98,
        duration: 5800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(400),
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(500),
    ]).start(() => {
      onNext();
    });

    return () => {
      progressAnim.removeListener(listener);
    };
  }, [onNext]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background */}
      <LinearGradient
        colors={['#0F1420', '#080C14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.grain} />

      {/* Header */}
      <View style={[styles.header, { marginTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            setTimeout(() => { isProcessing.current = false; }, 500);
            onBack();
          }}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna à tela anterior"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        <View style={styles.circleWrapper}>
          <Svg
            width={CIRCLE_SIZE}
            height={CIRCLE_SIZE}
            viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
          >
            <Defs>
              <SvgLinearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%"   stopColor="#3D54D9" />
                <Stop offset="50%"  stopColor="#293CA6" />
                <Stop offset="100%" stopColor="#F27A5E" />
              </SvgLinearGradient>
            </Defs>

            {/* Track */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="#1A2240"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              opacity={0.8}
            />

            {/* Progresso */}
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="url(#progressGrad)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              rotation="-90"
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg>

          <View style={styles.percentWrapper}>
            <Text style={styles.percentText}>{displayPercent}%</Text>
          </View>
        </View>

        <Text style={styles.title}>Calculando...</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3D54D9',
    opacity: 0.02,
  },

  // Header
  header: {
    marginLeft: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(61,84,217,0.08)',
    borderWidth: 1,
    borderColor: '#1A2240',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#E0EAFF',
  },

  // Conteúdo
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Círculo
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 52,
    color: '#E0EAFF',
  },

  // Textos
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: '#E0EAFF',
    marginTop: 36,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 16 * 1.45,
    marginTop: 10,
    textAlign: 'center',
  },
});
