import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';

function IconeHumor(): React.ReactElement {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11} fill="rgba(255,255,255,0.25)" />
      <Circle cx={10} cy={11} r={1.5} fill="#FFFFFF" />
      <Circle cx={16} cy={11} r={1.5} fill="#FFFFFF" />
      <Path d="M9,16 C10,18.5 16,18.5 17,16" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconeEnergia(): React.ReactElement {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11} fill="rgba(255,255,255,0.25)" />
      <Path d="M15,5 L10,14 L13,14 L11,21 L18,11 L14,11 Z" fill="#FFFFFF" />
    </Svg>
  );
}

function IconeRelacionamento(): React.ReactElement {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11} fill="rgba(255,255,255,0.25)" />
      <Path d="M13,18 C13,18 7,14.5 7,10.5 C7,8.5 8.5,7 10.5,7 C11.8,7 12.8,7.7 13,8.5 C13.2,7.7 14.2,7 15.5,7 C17.5,7 19,8.5 19,10.5 C19,14.5 13,18 13,18 Z" fill="#FFFFFF" />
    </Svg>
  );
}

function IconeDesejo(): React.ReactElement {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11} fill="rgba(255,255,255,0.25)" />
      <Rect x={9} y={8} width={8} height={10} rx={1.5} fill="#FFFFFF" opacity={0.9} />
      <Line x1={11} y1={11} x2={15} y2={11} stroke="rgba(0,0,0,0.3)" strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={11} y1={13.5} x2={15} y2={13.5} stroke="rgba(0,0,0,0.3)" strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

function IconeFoco(): React.ReactElement {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11} fill="rgba(255,255,255,0.25)" />
      <Path d="M13,7 L14.5,11 L19,11 L15.5,13.5 L17,18 L13,15.5 L9,18 L10.5,13.5 L7,11 L11.5,11 Z" fill="#FFFFFF" />
    </Svg>
  );
}

function IconeConfianca(): React.ReactElement {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11} fill="rgba(255,255,255,0.25)" />
      <Circle cx={13} cy={10} r={3} fill="#FFFFFF" />
      <Path d="M7,20 C7,16.7 9.7,14 13,14 C16.3,14 19,16.7 19,20" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconePensamentos(): React.ReactElement {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11} fill="rgba(255,255,255,0.25)" />
      <Path d="M9,15 C9,12.2 10.8,10 13,10 C15.2,10 17,12.2 17,15" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Line x1={13} y1={15} x2={13} y2={18} stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={11} y1={18} x2={15} y2={18} stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={8} cy={9} r={1.5} fill="#FFFFFF" opacity={0.6} />
      <Circle cx={6} cy={6} r={1} fill="#FFFFFF" opacity={0.4} />
    </Svg>
  );
}

function IconeControle(): React.ReactElement {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Circle cx={13} cy={13} r={11} fill="rgba(255,255,255,0.25)" />
      <Circle cx={13} cy={13} r={5} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <Path d="M13,4 L13,7" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M13,19 L13,22" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M4,13 L7,13" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M19,13 L22,13" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

interface Meta {
  id: string;
  label: string;
  icone: React.ReactElement;
  cor: string;
  corIcone: string;
}

const METAS: Meta[] = [
  {
    id: 'humor',
    label: 'Melhor humor e felicidade',
    icone: <IconeHumor />,
    cor: '#1A2650',
    corIcone: '#3D54D9',
  },
  {
    id: 'energia',
    label: 'Mais energia e motivação',
    icone: <IconeEnergia />,
    cor: '#2A1A0E',
    corIcone: '#F27A5E',
  },
  {
    id: 'relacionamento',
    label: 'Relacionamentos mais fortes',
    icone: <IconeRelacionamento />,
    cor: '#1A2650',
    corIcone: '#293CA6',
  },
  {
    id: 'desejo',
    label: 'Mais desejo e vida íntima',
    icone: <IconeDesejo />,
    cor: '#2A1A18',
    corIcone: '#F27A5E',
  },
  {
    id: 'foco',
    label: 'Mais foco e clareza mental',
    icone: <IconeFoco />,
    cor: '#1A2650',
    corIcone: '#3D54D9',
  },
  {
    id: 'confianca',
    label: 'Mais autoconfiança',
    icone: <IconeConfianca />,
    cor: '#1A2A1A',
    corIcone: '#4A9C52',
  },
  {
    id: 'pensamentos',
    label: 'Pensamentos mais saudáveis',
    icone: <IconePensamentos />,
    cor: '#1A2A1A',
    corIcone: '#4A9C52',
  },
  {
    id: 'controle',
    label: 'Mais autocontrole',
    icone: <IconeControle />,
    cor: '#1A2650',
    corIcone: '#3D54D9',
  },
];

interface CardMetaProps {
  meta: Meta;
  selecionado: boolean;
  onPress: () => void;
}

function CardMeta({ meta, selecionado, onPress }: CardMetaProps): React.ReactElement {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: meta.cor },
        selecionado && styles.cardSelecionado,
      ]}
      accessibilityRole="button"
      accessibilityLabel={meta.label}
      accessibilityHint={selecionado ? 'Desselecionar este objetivo' : 'Selecionar este objetivo'}
    >
      <View style={[styles.iconeWrapper, { backgroundColor: meta.corIcone }]}>
        {meta.icone}
      </View>
      <Text style={styles.cardLabel} accessibilityRole="text">
        {meta.label}
      </Text>
      <View style={[styles.toggle, selecionado && styles.toggleSelecionado]}>
        {selecionado && (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        )}
      </View>
    </TouchableOpacity>
  );
}

interface GoalsScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export default function GoalsScreen({ onNext, onBack }: GoalsScreenProps) {
  const insets = useSafeAreaInsets();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const isProcessing = useRef<boolean>(false);

  const toggle = (id: string): void => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }
      return novo;
    });
  };

  const podeAvancar: boolean = selecionados.size > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna à tela anterior"
        >
          <Ionicons name="chevron-back" size={20} color="#E0EAFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo} accessibilityRole="text">
          Escolha seus objetivos
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instrucao}>
          Selecione os objetivos que quer acompanhar durante sua recuperação.
        </Text>

        {METAS.map(meta => (
          <CardMeta
            key={meta.id}
            meta={meta}
            selecionado={selecionados.has(meta.id)}
            onPress={() => toggle(meta.id)}
          />
        ))}
      </ScrollView>

      <View style={[styles.ctaWrapper, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          activeOpacity={podeAvancar ? 0.8 : 1}
          onPress={() => {
            if (!podeAvancar) return;
            if (isProcessing.current) return;
            isProcessing.current = true;
            setTimeout(() => { isProcessing.current = false; }, 500);
            onNext();
          }}
        >
          {podeAvancar ? (
            <LinearGradient
              colors={['#3D54D9', '#293CA6'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBotao}
            >
              <Text style={styles.ctaTexto}>Definir esses objetivos</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.ctaBotao, styles.ctaBotaoInativo]}>
              <Text style={[styles.ctaTexto, styles.ctaTextoInativo]}>
                Definir esses objetivos
              </Text>
            </View>
          )}
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
    backgroundColor: 'rgba(61,84,217,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 17,
    color: '#E0EAFF',
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  instrucao: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    borderRadius: 34,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelecionado: {
    borderColor: 'rgba(61,84,217,0.4)',
  },
  iconeWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  cardLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#E0EAFF',
    flex: 1,
  },
  toggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleSelecionado: {
    backgroundColor: '#3D54D9',
  },
  ctaWrapper: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#080C14',
    borderTopWidth: 1,
    borderTopColor: '#1A2240',
  },
  ctaBotao: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBotaoInativo: {
    backgroundColor: '#0F1420',
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  ctaTexto: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  ctaTextoInativo: {
    fontFamily: 'Rubik_400Regular',
    color: '#2A3A6A',
  },
});
