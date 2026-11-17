import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function ResultScreen({ onNext, onBack }: Props) {
  const insets = useSafeAreaInsets();

  const scoreBarAnim = useRef(new Animated.Value(0)).current;
  const isProcessing = useRef(false);
  const avgBarAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateBars = () => {
      Animated.parallel([
        Animated.timing(scoreBarAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
          easing: Easing.out(Easing.back(1.2)),
        }),
        Animated.timing(avgBarAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
          easing: Easing.out(Easing.back(1.2)),
        }),
      ]).start();
    };

    setTimeout(animateBars, 100);
  }, []);

  const scoreBarHeight = scoreBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  const avgBarHeight = avgBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140],
  });

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#0F1420', '#080C14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.grain} />
      </View>

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
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <View style={styles.headline}>
          <Text style={styles.checkIcon}>✓</Text>
          <Text style={styles.headlineTitle}>Análise Concluída</Text>
        </View>
        <Text style={styles.subtitle}>
          Veja como você se compara com a média
        </Text>

        {/* Texto do resultado */}
        <Text style={styles.resultText}>
          Com base nas suas respostas, identificamos uma{' '}
          <Text style={styles.resultHighlight}>dependência clara</Text> dos
          estímulos digitais.
        </Text>

        {/* Gráfico de barras */}
        <View style={styles.chartContainer}>
          <View style={styles.barWrapper}>
            <Animated.View style={[styles.bar, { height: scoreBarHeight }]}>
              <LinearGradient
                colors={['#F27A5E', '#C0392B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.barGradient}
              />
            </Animated.View>
            <Text style={styles.barValue}>87</Text>
            <Text style={styles.barLabel}>Sua pontuação</Text>
          </View>

          <View style={styles.chartSpacer} />

          <View style={styles.barWrapper}>
            <Animated.View style={[styles.bar, { height: avgBarHeight }]}>
              <LinearGradient
                colors={['#4A9C52', '#2D7A35']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.barGradient}
              />
            </Animated.View>
            <Text style={styles.barValue}>34</Text>
            <Text style={styles.barLabel}>Média</Text>
          </View>
        </View>

        {/* Insight */}
        <Text style={styles.insight}>
          Sua pontuação está{' '}
          <Text style={styles.insightHighlight}>64% acima</Text> da média dos
          usuários. Isso indica um padrão de consumo que merece atenção.
        </Text>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Este resultado é baseado nas suas respostas e tem fins informativos.
          Não substitui avaliação profissional.
        </Text>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA fixo */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 20 }]}>
        <LinearGradient
          colors={['rgba(8,12,20,0)', '#080C14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.ctaGradient}
        />
        <TouchableOpacity
          onPress={() => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            setTimeout(() => { isProcessing.current = false; }, 500);
            onNext();
          }}
          style={styles.ctaButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#3D54D9', '#293CA6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButtonGradient}
          >
            <Text style={styles.ctaButtonText}>Ver meu plano completo →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
    backgroundColor: 'rgba(61,84,217,0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  backIcon: {
    fontSize: 18,
    color: '#E0EAFF',
  },

  // ScrollView
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  // Headline
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkIcon: {
    color: '#4A9C52',
    fontSize: 22,
    fontFamily: 'Rubik_500Medium',
  },
  headlineTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 30,
    color: '#E0EAFF',
  },
  subtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
  },

  // Result text
  resultText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 28,
    marginTop: 28,
  },
  resultHighlight: {
    fontFamily: 'Rubik_600SemiBold',
    color: '#E0EAFF',
  },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 32,
    marginTop: 36,
    height: 280,
  },
  chartSpacer: { width: 32 },
  barWrapper: {
    alignItems: 'center',
    width: 78,
  },
  bar: {
    width: 78,
    borderRadius: 16,
    overflow: 'hidden',
  },
  barGradient: { flex: 1 },
  barValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 20,
    color: '#E0EAFF',
    marginTop: 8,
  },
  barLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },

  // Insight
  insight: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginTop: 28,
  },
  insightHighlight: {
    fontFamily: 'Rubik_600SemiBold',
    color: '#F27A5E',
  },

  // Disclaimer
  disclaimer: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 18,
    marginTop: 20,
  },

  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#080C14',
  },
  ctaGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: 30,
    overflow: 'hidden',
  },
  ctaButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 17,
    color: '#E0EAFF',
  },
});