import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48 - 48;
const CHART_HEIGHT = 180;

function RecoveryChart() {
  const greenPath = `
    M 0,${CHART_HEIGHT - 20}
    C ${CHART_WIDTH * 0.15},${CHART_HEIGHT - 30}
      ${CHART_WIDTH * 0.3},${CHART_HEIGHT - 60}
      ${CHART_WIDTH * 0.5},${CHART_HEIGHT - 100}
    C ${CHART_WIDTH * 0.7},${CHART_HEIGHT - 140}
      ${CHART_WIDTH * 0.85},${CHART_HEIGHT - 160}
      ${CHART_WIDTH},20
  `;

  const redPath = `
    M 0,${CHART_HEIGHT - 20}
    C ${CHART_WIDTH * 0.08},${CHART_HEIGHT - 50}
      ${CHART_WIDTH * 0.12},${CHART_HEIGHT - 70}
      ${CHART_WIDTH * 0.18},${CHART_HEIGHT - 40}
    C ${CHART_WIDTH * 0.22},${CHART_HEIGHT - 20}
      ${CHART_WIDTH * 0.28},${CHART_HEIGHT - 100}
      ${CHART_WIDTH * 0.33},${CHART_HEIGHT - 90}
    C ${CHART_WIDTH * 0.38},${CHART_HEIGHT - 80}
      ${CHART_WIDTH * 0.42},${CHART_HEIGHT - 20}
      ${CHART_WIDTH * 0.48},${CHART_HEIGHT - 30}
    C ${CHART_WIDTH * 0.52},${CHART_HEIGHT - 40}
      ${CHART_WIDTH * 0.56},${CHART_HEIGHT - 80}
      ${CHART_WIDTH * 0.60},${CHART_HEIGHT - 70}
    C ${CHART_WIDTH * 0.64},${CHART_HEIGHT - 60}
      ${CHART_WIDTH * 0.68},${CHART_HEIGHT - 20}
      ${CHART_WIDTH * 0.72},${CHART_HEIGHT - 35}
    C ${CHART_WIDTH * 0.78},${CHART_HEIGHT - 55}
      ${CHART_WIDTH * 0.85},${CHART_HEIGHT - 45}
      ${CHART_WIDTH},${CHART_HEIGHT - 25}
  `;

  const redFill = `
    M 0,${CHART_HEIGHT - 20}
    C ${CHART_WIDTH * 0.08},${CHART_HEIGHT - 50}
      ${CHART_WIDTH * 0.12},${CHART_HEIGHT - 70}
      ${CHART_WIDTH * 0.18},${CHART_HEIGHT - 40}
    C ${CHART_WIDTH * 0.22},${CHART_HEIGHT - 20}
      ${CHART_WIDTH * 0.28},${CHART_HEIGHT - 100}
      ${CHART_WIDTH * 0.33},${CHART_HEIGHT - 90}
    C ${CHART_WIDTH * 0.38},${CHART_HEIGHT - 80}
      ${CHART_WIDTH * 0.42},${CHART_HEIGHT - 20}
      ${CHART_WIDTH * 0.48},${CHART_HEIGHT - 30}
    C ${CHART_WIDTH * 0.52},${CHART_HEIGHT - 40}
      ${CHART_WIDTH * 0.56},${CHART_HEIGHT - 80}
      ${CHART_WIDTH * 0.60},${CHART_HEIGHT - 70}
    C ${CHART_WIDTH * 0.64},${CHART_HEIGHT - 60}
      ${CHART_WIDTH * 0.68},${CHART_HEIGHT - 20}
      ${CHART_WIDTH * 0.72},${CHART_HEIGHT - 35}
    C ${CHART_WIDTH * 0.78},${CHART_HEIGHT - 55}
      ${CHART_WIDTH * 0.85},${CHART_HEIGHT - 45}
      ${CHART_WIDTH},${CHART_HEIGHT - 25}
    L ${CHART_WIDTH},${CHART_HEIGHT}
    L 0,${CHART_HEIGHT}
    Z
  `;

  const relapses = [
    { x: CHART_WIDTH * 0.22, y: CHART_HEIGHT - 28 },
    { x: CHART_WIDTH * 0.42, y: CHART_HEIGHT - 28 },
    { x: CHART_WIDTH * 0.52, y: CHART_HEIGHT - 38 },
    { x: CHART_WIDTH * 0.63, y: CHART_HEIGHT - 58 },
    { x: CHART_WIDTH * 0.72, y: CHART_HEIGHT - 33 },
  ];

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 24}>
      <Defs>
        <SvgGradient id="redFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F27A5E" stopOpacity="0.4" />
          <Stop offset="1" stopColor="#F27A5E" stopOpacity="0.03" />
        </SvgGradient>
      </Defs>

      {/* Eixo X */}
      <Line
        x1={0} y1={CHART_HEIGHT}
        x2={CHART_WIDTH} y2={CHART_HEIGHT}
        stroke="#1A2240"
        strokeWidth={1}
      />

      {/* Labels eixo X */}
      <SvgText x={0} y={CHART_HEIGHT + 18} fill="#2A3A6A" fontSize={11} fontFamily="Rubik_400Regular">
        Semana 1
      </SvgText>
      <SvgText x={CHART_WIDTH * 0.44} y={CHART_HEIGHT + 18} fill="#2A3A6A" fontSize={11} fontFamily="Rubik_400Regular">
        Semana 2
      </SvgText>
      <SvgText x={CHART_WIDTH * 0.76} y={CHART_HEIGHT + 18} fill="#2A3A6A" fontSize={11} fontFamily="Rubik_400Regular">
        Semana 3
      </SvgText>

      {/* Área preenchida */}
      <Path d={redFill} fill="url(#redFill)" />

      {/* Linha vermelha */}
      <Path
        d={redPath}
        stroke="#F27A5E"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Linha verde */}
      <Path
        d={greenPath}
        stroke="#4A9C52"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* X de recaídas */}
      {relapses.map((r, i) => (
        <React.Fragment key={i}>
          <Line
            x1={r.x - 5} y1={r.y - 5}
            x2={r.x + 5} y2={r.y + 5}
            stroke="#F27A5E" strokeWidth={2} strokeLinecap="round"
          />
          <Line
            x1={r.x + 5} y1={r.y - 5}
            x2={r.x - 5} y2={r.y + 5}
            stroke="#F27A5E" strokeWidth={2} strokeLinecap="round"
          />
        </React.Fragment>
      ))}

      {/* Ponto inicial */}
      <Circle cx={0} cy={CHART_HEIGHT - 20} r={6} fill="#E0EAFF" />
      <Circle cx={0} cy={CHART_HEIGHT - 20} r={3} fill="#0F1420" />

      {/* Ponto final verde */}
      <Circle cx={CHART_WIDTH} cy={20} r={7} fill="#4A9C52" />
      <Circle cx={CHART_WIDTH} cy={20} r={3.5} fill="#E0EAFF" />

      {/* Ponto final vermelho */}
      <Circle cx={CHART_WIDTH} cy={CHART_HEIGHT - 25} r={6} fill="#F27A5E" />

      {/* Label verde */}
      <SvgText
        x={CHART_WIDTH - 60}
        y={14}
        fill="#4A9C52"
        fontSize={11}
        fontFamily="Rubik_500Medium"
      >
        ZEREI
      </SvgText>

      {/* Label vermelho */}
      <SvgText
  x={CHART_WIDTH * 0.70}
  y={CHART_HEIGHT - 80}
  fill="#F27A5E"
  fontSize={10}
  fontFamily="Rubik_500Medium"
  textAnchor="middle"
>
  Sem método
</SvgText>
    </Svg>
  );
}

interface RewiringScreenProps {
  navigation?: any;
  onNext?: () => void;
  onBack?: () => void;
}

export default function RewiringScreen({ navigation, onNext, onBack }: RewiringScreenProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isProcessing = useRef(false);
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            setTimeout(() => { isProcessing.current = false; }, 500);
            onBack ? onBack() : navigation?.goBack();
          }}
          style={styles.btnVoltar}
        >
          <Ionicons name="chevron-back" size={20} color="#E0EAFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Benefícios da Recuperação</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Conteúdo */}
      <Animated.ScrollView
  style={{ flex: 1, opacity: fadeAnim }}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}
>
        {/* Card do gráfico */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitulo}>Recuperação Real</Text>
              <View style={styles.legendaRow}>
                <View style={styles.legendaItem}>
                  <View style={[styles.legendaDot, { backgroundColor: '#F27A5E' }]} />
                  <Text style={styles.legendaTexto}>recaídas</Text>
                </View>
              </View>
            </View>
            <Text style={styles.cardLogo}>ZEREI</Text>
          </View>

          <View style={styles.chartWrapper}>
            <RecoveryChart />
          </View>
        </View>

        {/* Texto */}
        <Text style={styles.titulo}>Benefícios da{'\n'}Recuperação</Text>
        <Text style={styles.descricao}>
          Com o método certo, seu cérebro começa a se reorganizar em semanas.{' '}
          <Text style={styles.descricaoBold}>A diferença é real!</Text> Mais foco, mais energia e mais presença no que importa.
        </Text>
        </Animated.ScrollView>

      {/* CTA fixo */}
      <View style={[styles.ctaWrapper, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            setTimeout(() => { isProcessing.current = false; }, 500);
            onNext ? onNext() : navigation?.navigate('Goals');
          }}
        >
          <LinearGradient
            colors={['#3D54D9', '#293CA6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBotao}
          >
            <Text style={styles.ctaTexto}>Continuar</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  btnVoltar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(61,84,217,0.08)',
    borderWidth: 1,
    borderColor: '#1A2240',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 16,
    color: '#E0EAFF',
    letterSpacing: 0.2,
  },

  // Conteúdo
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  // Card gráfico
  card: {
    backgroundColor: '#0F1420',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1A2240',
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitulo: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 16,
    color: '#E0EAFF',
    marginBottom: 4,
  },
  legendaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendaTexto: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: '#FFFFFF',
  },
  cardLogo: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 16,
    color: '#3D54D9',
    letterSpacing: 1,
  },
  chartWrapper: {
    alignItems: 'flex-start',
  },

  // Texto
  titulo: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: '#E0EAFF',
    lineHeight: 36,
    marginBottom: 14,
  },
  descricao: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  descricaoBold: {
    fontFamily: 'Rubik_700Bold',
    color: '#3D54D9',
  },

  // CTA
  ctaWrapper: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#080C14',
  },
  ctaBotao: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTexto: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 17,
    color: '#E0EAFF',
    letterSpacing: 0.3,
  },
});