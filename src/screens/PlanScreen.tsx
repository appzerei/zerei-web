import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Props {
  onNext: () => void;
  onBack: () => void;
  userName?: string;
}

function getTodayFormatted() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

export default function PlanScreen({ onNext, onBack, userName = 'você' }: Props) {
  const insets = useSafeAreaInsets();
  const today = getTodayFormatted();
const isProcessing = useRef(false);

function handlePress(fn: () => void) {
  if (isProcessing.current) return;
  isProcessing.current = true;
  fn();
  setTimeout(() => { isProcessing.current = false; }, 500);
}
  const phase1Opacity = useRef(new Animated.Value(0)).current;
  const phase1Y = useRef(new Animated.Value(10)).current;
  const phase2Opacity = useRef(new Animated.Value(0)).current;
  const phase2Y = useRef(new Animated.Value(10)).current;
  const phase3Opacity = useRef(new Animated.Value(0)).current;
  const phase3Y = useRef(new Animated.Value(10)).current;
  const phase4Opacity = useRef(new Animated.Value(0)).current;
  const phase4Y = useRef(new Animated.Value(10)).current;
  const phase5Opacity = useRef(new Animated.Value(0)).current;
  const phase5Y = useRef(new Animated.Value(10)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(10)).current;

  const fadeIn = (opacity: Animated.Value, y: Animated.Value, duration = 500) =>
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration, useNativeDriver: true }),
    ]);

  const fadeOut = (opacity: Animated.Value, duration = 300) =>
    Animated.timing(opacity, { toValue: 0, duration, useNativeDriver: true });

  useEffect(() => {
    Animated.sequence([
      Animated.delay(0),
      fadeIn(phase1Opacity, phase1Y),
      Animated.delay(700),
      fadeOut(phase1Opacity),

      Animated.delay(100),
      fadeIn(phase2Opacity, phase2Y),
      Animated.delay(700),
      fadeOut(phase2Opacity),

      Animated.delay(100),
      fadeIn(phase3Opacity, phase3Y),
      Animated.delay(700),
      fadeOut(phase3Opacity),

      Animated.delay(100),
      fadeIn(phase4Opacity, phase4Y),
      Animated.delay(700),
      fadeOut(phase4Opacity),

      Animated.delay(100),
      fadeIn(phase5Opacity, phase5Y, 600),

      Animated.delay(400),
      fadeIn(btnOpacity, btnY, 400),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#1A2A6E', '#0F1420', '#080C14']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* Botão voltar */}
      <TouchableOpacity
  onPress={() => handlePress(onBack)}
  style={[styles.backButton, { marginTop: insets.top + 8 }]}
  activeOpacity={0.8}
  accessibilityRole="button"
  accessibilityLabel="Voltar"
  accessibilityHint="Retorna à tela anterior"
>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Frases */}
      <View style={styles.phrasesArea}>

        <Animated.Text
          style={[
            styles.phrase,
            { opacity: phase1Opacity, transform: [{ translateY: phase1Y }] },
          ]}
        >
          Ei, {userName}.
        </Animated.Text>

        <Animated.Text
          style={[
            styles.phrase,
            { opacity: phase2Opacity, transform: [{ translateY: phase2Y }] },
          ]}
        >
          Bem-vindo ao ZEREI,
        </Animated.Text>

        <Animated.Text
          style={[
            styles.phrase,
            { opacity: phase3Opacity, transform: [{ translateY: phase3Y }] },
          ]}
        >
          seu caminho para a liberdade.
        </Animated.Text>

        <Animated.Text
          style={[
            styles.phrase,
            styles.phraseSmaller,
            { opacity: phase4Opacity, transform: [{ translateY: phase4Y }] },
          ]}
        >
          Com base nas suas respostas, montamos um plano só pra você.
        </Animated.Text>

        {/* Card */}
        <Animated.View
          style={[
            styles.cardBlock,
            { opacity: phase5Opacity, transform: [{ translateY: phase5Y }] },
          ]}
        >
          <View style={styles.card}>

            <LinearGradient
              colors={['#F27A5E', '#D05030', '#A03010']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardTop}
            >
              <View style={styles.cardLogoWrapper}>
                <Text style={styles.cardLogoText}>Z</Text>
              </View>

              <Text style={styles.cardIconPerson}>⬡</Text>

              <View style={styles.cardStreakWrapper}>
                <Text style={styles.cardStreakLabel}>Sequência ativa</Text>
                <Text style={styles.cardStreakValue}>0 dias</Text>
              </View>
            </LinearGradient>

            <View style={styles.cardFooter}>
              <View style={styles.cardFooterCol}>
                <Text style={styles.cardLabel}>Nome</Text>
                <Text style={styles.cardValue}>{userName}</Text>
              </View>
              <View style={[styles.cardFooterCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.cardLabel}>Livre desde</Text>
                <Text style={styles.cardValue}>{today}</Text>
              </View>
            </View>

          </View>

          <Text style={styles.cardSubtext}>
            Projetado para te ajudar a retomar o controle.
          </Text>
        </Animated.View>

      </View>

      {/* Botão */}
      <Animated.View
        style={[
          styles.btnWrapper,
          {
            opacity: btnOpacity,
            transform: [{ translateY: btnY }],
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <TouchableOpacity
  style={styles.btn}
  onPress={() => handlePress(onNext)}
  activeOpacity={0.8}
  accessibilityRole="button"
  accessibilityLabel="Ver meu plano completo"
  accessibilityHint="Avança para a tela com o plano personalizado"
>
          <Text style={styles.btnText}>Ver meu plano completo {'>'}</Text>
        </TouchableOpacity>
      </Animated.View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginLeft: 16,
  },
  backIcon: {
    fontSize: 18,
    color: '#E0EAFF',
  },

  // Frases
  phrasesArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  phrase: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: '#E0EAFF',
    textAlign: 'center',
    lineHeight: 28 * 1.2,
    position: 'absolute',
  },
  phraseSmaller: {
    fontSize: 22,
    lineHeight: 22 * 1.3,
  },

  // Card
  cardBlock: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardTop: {
    height: 200,
    padding: 16,
  },
  cardLogoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(224,234,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 16,
    left: 16,
  },
  cardLogoText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 16,
    color: '#E0EAFF',
  },
  cardIconPerson: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 24,
    color: '#E0EAFF',
  },
  cardStreakWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  cardStreakLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  cardStreakValue: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 28,
    color: '#E0EAFF',
    marginTop: 2,
  },
  cardFooter: {
    backgroundColor: '#0F1420',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1A2240',
  },
  cardFooterCol: {
    gap: 4,
  },
  cardLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  cardValue: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 17,
    color: '#E0EAFF',
  },
  cardSubtext: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: 'rgba(224,234,255,0.70)',
    textAlign: 'center',
    marginTop: 20,
  },

  // Botão
  btnWrapper: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  btn: {
    backgroundColor: '#3D54D9',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 18,
    color: '#E0EAFF',
  },
});