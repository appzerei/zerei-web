import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Sintoma {
  id: string;
  labelBold: string;
  labelResto: string;
}

interface SecaoSintomas {
  titulo: string;
  itens: Sintoma[];
}

const SECOES: SecaoSintomas[] = [
  {
    titulo: 'Mental',
    itens: [
      { id: 'm1', labelBold: 'Dificuldade',    labelResto: ' de concentração' },
      { id: 'm2', labelBold: 'Pensamentos',    labelResto: ' intrusivos' },
      { id: 'm3', labelBold: 'Ansiedade',      labelResto: ' social' },
      { id: 'm4', labelBold: 'Baixa',          labelResto: ' autoestima' },
      { id: 'm5', labelBold: 'Procrastinação', labelResto: ' constante' },
      { id: 'm6', labelBold: 'Sensação',       labelResto: ' de vazio' },
    ],
  },
  {
    titulo: 'Físico',
    itens: [
      { id: 'f1', labelBold: 'Cansaço',         labelResto: ' sem motivo' },
      { id: 'f2', labelBold: 'Dificuldades',    labelResto: ' no sono' },
      { id: 'f3', labelBold: 'Baixa energia',   labelResto: ' no dia a dia' },
      { id: 'f4', labelBold: 'Redução',         labelResto: ' da libido' },
      { id: 'f5', labelBold: 'Tensão',          labelResto: ' muscular' },
      { id: 'f6', labelBold: 'Dores de cabeça', labelResto: ' frequentes' },
    ],
  },
];

const MIN_SELECOES = 3;

interface CardProps {
  sintoma: Sintoma;
  selecionado: boolean;
  onPress: () => void;
}

const CardSintoma: React.FC<CardProps> = ({ sintoma, selecionado, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80,  useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={styles.cardWrapper}
      >
        {selecionado ? (
          <LinearGradient
            colors={['#3D54D9', '#293CA6', '#1A2A6E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={[styles.checkbox, styles.checkboxOn]}>
              <Ionicons name="checkmark" size={14} color="#E0EAFF" />
            </View>
            <Text style={styles.cardTexto}>
              <Text style={styles.cardTextoBold}>{sintoma.labelBold}</Text>
              <Text style={styles.cardTextoResto}>{sintoma.labelResto}</Text>
            </Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#0F1420', '#0C1228']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.cardDefault]}
          >
            <View style={styles.checkbox} />
            <Text style={styles.cardTexto}>
              <Text style={styles.cardTextoBold}>{sintoma.labelBold}</Text>
              <Text style={styles.cardTextoResto}>{sintoma.labelResto}</Text>
            </Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const SymptomsScreen: React.FC<Props> = ({ onNext, onBack }) => {
  const insets = useSafeAreaInsets();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const isProcessing = useRef(false);

  const toggle = (id: string) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });
  };

  const total       = selecionados.size;
  const podeAvancar = total >= MIN_SELECOES;
  const faltam      = MIN_SELECOES - total;

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
            onBack();
          }}
          style={styles.btnVoltar}
        >
          <Ionicons name="chevron-back" size={20} color="#E0EAFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Sintomas</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Scroll */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 0 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <LinearGradient
          colors={['#F27A5E', '#C0392B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        >
          <Ionicons name="warning" size={20} color="#E0EAFF" style={{ marginRight: 10 }} />
          <Text style={styles.bannerTexto}>
            O uso excessivo de conteúdo porno pode impactar sua saúde mental.
          </Text>
        </LinearGradient>

        {/* Instrução */}
        <Text style={styles.instrucao}>
          Selecione os sintomas que você reconhece:
        </Text>

        {/* Seções */}
        {SECOES.map(secao => (
          <View key={secao.titulo} style={styles.secao}>
            <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
            {secao.itens.map(item => (
              <CardSintoma
                key={item.id}
                sintoma={item}
                selecionado={selecionados.has(item.id)}
                onPress={() => toggle(item.id)}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      {/* CTA fixo */}
      <View style={[styles.ctaWrapper, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.contador}>
          {podeAvancar
            ? `${total} sintomas selecionados`
            : total === 0
              ? `Selecione ao menos ${MIN_SELECOES} sintomas para continuar`
              : `Selecione mais ${faltam} para continuar`}
        </Text>

        <TouchableOpacity
          activeOpacity={podeAvancar ? 0.8 : 1}
          onPress={() => {
            if (!podeAvancar) return;
            if (isProcessing.current) return;
            isProcessing.current = true;
            setTimeout(() => { isProcessing.current = false; }, 500);
            onNext();
          }}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={podeAvancar ? ['#4A9C52', '#2D7A35'] : ['#0F1420', '#0C1228']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBotao}
          >
            <Text style={[styles.ctaTexto, !podeAvancar && styles.ctaTextoInativo]}>
              Reiniciar meu cérebro
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 18,
    color: '#E0EAFF',
    letterSpacing: 0.3,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 24,
  },
  bannerTexto: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#E0EAFF',
    lineHeight: 22,
    flex: 1,
  },

  // Instrução
  instrucao: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 28,
    lineHeight: 26,
  },

  // Seção
  secao: { marginBottom: 28 },
  secaoTitulo: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 16,
    color: '#3D54D9',
    marginBottom: 14,
    letterSpacing: 0.5,
  },

  // Card
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  cardDefault: {
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  cardTexto: {
    flex: 1,
    marginLeft: 14,
  },
  cardTextoBold: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 16,
    color: '#E0EAFF',
  },
  cardTextoResto: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#E0EAFF',
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A3A6A',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxOn: {
    borderColor: '#3D54D9',
    backgroundColor: '#3D54D9',
  },

  // CTA
  ctaWrapper: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#080C14',
    borderTopWidth: 1,
    borderTopColor: '#1A2240',
    alignItems: 'center',
    gap: 10,
  },
  contador: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
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
  ctaTextoInativo: {
    color: '#2A3A6A',
  },
});

export default SymptomsScreen;