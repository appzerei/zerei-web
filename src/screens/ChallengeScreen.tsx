// src/screens/ChallengeScreen.tsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = SCREEN_WIDTH * 0.58;
const RING_STROKE = 18;

// ─── Hábitos do desafio ───────────────────────────────────────────────────────
const HABITS = [
  {
    id: 'frio',
    label: 'Exposição ao Frio',
    desc: 'Banho frio pela manhã',
    icon: 'snow-outline' as const,
    color: '#4FC3F7',
  },
  {
    id: 'noporn',
    label: 'Sem Pornô',
    desc: 'Construa sua disciplina',
    icon: 'ban-outline' as const,
    color: '#EF5350',
  },
  {
    id: 'meditacao',
    label: 'Meditação',
    desc: '10 minutos de foco',
    icon: 'leaf-outline' as const,
    color: '#66BB6A',
  },
  {
    id: 'diario',
    label: 'Diário',
    desc: 'Escreva seus pensamentos',
    icon: 'book-outline' as const,
    color: '#FFA726',
  },
  {
    id: 'comunidade',
    label: 'Comunidade',
    desc: 'Participe da jornada',
    icon: 'people-outline' as const,
    color: '#AB47BC',
  },
  {
    id: 'exercicio',
    label: 'Exercício',
    desc: '30 minutos de atividade',
    icon: 'barbell-outline' as const,
    color: '#EC407A',
  },
];

// ─── Anel de progresso SVG ────────────────────────────────────────────────────
// Cada hábito vira um arco colorido no anel
// Quando marcado, o arco fica cheio; quando não, fica escuro

function RingProgress({ completedToday }: { completedToday: Set<string> }) {
  const total = HABITS.length;
  const radius = (RING_SIZE - RING_STROKE * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapAngle = 8; // graus de espaço entre os arcos
  const arcAngle = (360 - gapAngle * total) / total;

  const completedCount = completedToday.size;

  return (
    <View style={styles.ringWrapper}>
      <View style={[styles.ring, { width: RING_SIZE, height: RING_SIZE }]}>
        {/* Arcos SVG simulados com Views rotacionadas */}
        {HABITS.map((habit, i) => {
          const isCompleted = completedToday.has(habit.id);
          const rotationStart = i * (arcAngle + gapAngle) - 90;

          return (
            <View
              key={habit.id}
              style={[
                styles.arcContainer,
                {
                  width: RING_SIZE,
                  height: RING_SIZE,
                  transform: [{ rotate: `${rotationStart}deg` }],
                },
              ]}
            >
              <View
                style={[
                  styles.arc,
                  {
                    width: RING_SIZE,
                    height: RING_SIZE,
                    borderRadius: RING_SIZE / 2,
                    borderColor: isCompleted ? habit.color : 'rgba(255,255,255,0.08)',
                    borderWidth: RING_STROKE,
                    // Esconde 3/4 do círculo, mostrando só o arco proporcional ao ângulo
                    // Técnica: clip com overflow hidden em cada quadrante
                  },
                ]}
              />
            </View>
          );
        })}

        {/* Centro do anel */}
        <View style={styles.ringCenter}>
          <Text style={styles.ringCenterCount}>{completedCount}</Text>
          <Text style={styles.ringCenterLabel}>de {total} hoje</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Anel real com segmentos usando border trick ──────────────────────────────
function SegmentRing({ completedToday }: { completedToday: Set<string> }) {
  const size = RING_SIZE;
  const stroke = RING_STROKE;
  const total = HABITS.length;
  const completedCount = completedToday.size;

  // Cada segmento ocupa ~52 graus (360/6 = 60, menos 8 de gap = 52)
  const segmentDeg = (360 - 8 * total) / total;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {HABITS.map((habit, i) => {
        const isOn = completedToday.has(habit.id);
        const startDeg = i * (segmentDeg + 8) - 90;

        return (
          <SegmentArc
            key={habit.id}
            size={size}
            stroke={stroke}
            startDeg={startDeg}
            sweepDeg={segmentDeg}
            color={isOn ? habit.color : 'rgba(255,255,255,0.07)'}
          />
        );
      })}

      {/* Centro */}
      <View style={styles.ringCenter}>
        <Text style={styles.ringCenterCount}>{completedCount}</Text>
        <Text style={styles.ringCenterLabel}>de {total} hoje</Text>
      </View>
    </View>
  );
}

// Arco individual usando dois semicírculos rotacionados (técnica CSS border-radius)
function SegmentArc({
  size,
  stroke,
  startDeg,
  sweepDeg,
  color,
}: {
  size: number;
  stroke: number;
  startDeg: number;
  sweepDeg: number;
  color: string;
}) {
  const half = size / 2;
  const r = half - stroke / 2;

  // Convertemos para radianos e calculamos os pontos do arco
  const start = (startDeg * Math.PI) / 180;
  const end = ((startDeg + sweepDeg) * Math.PI) / 180;

  // Usamos múltiplas Views sobrepostas para simular o arco
  // Cada segmento = View com borderRadius redondo e borda colorida só em certos lados
  const midDeg = startDeg + sweepDeg / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: `${startDeg + 90}deg` }],
        },
      ]}
    >
      <View
        style={{
          width: size,
          height: size / 2,
          overflow: 'hidden',
          position: 'absolute',
          top: 0,
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: color,
            transform: [{ rotate: `${(sweepDeg / 360) * 360 - 180}deg` }],
          }}
        />
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export default function ChallengeScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isProcessing = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [daysCompleted, setDaysCompleted] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      // Busca os hábitos marcados hoje
      const { data: todayData } = await supabase
        .from('challenge_completions')
        .select('habit_id')
        .eq('user_id', uid)
        .eq('completed_date', today);

      if (todayData) {
        setCompletedToday(new Set(todayData.map((r) => r.habit_id)));
      }

      // Conta quantos dias o usuário completou TODOS os hábitos
      const { data: allData } = await supabase
        .from('challenge_completions')
        .select('completed_date')
        .eq('user_id', uid);

      if (allData) {
        // Agrupa por data e conta só os dias com todos os 6 hábitos
        const byDate: Record<string, number> = {};
        for (const row of allData) {
          byDate[row.completed_date] = (byDate[row.completed_date] || 0) + 1;
        }
        const fullDays = Object.values(byDate).filter((c) => c >= HABITS.length).length;
        setDaysCompleted(fullDays);
      }
    } catch (err) {
      console.warn('[ChallengeScreen.loadData]', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleHabit(habitId: string) {
    if (!userId || saving) return;
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 600);

    const isNowCompleted = !completedToday.has(habitId);

    // Atualiza local primeiro (feedback imediato)
    const next = new Set(completedToday);
    if (isNowCompleted) {
      next.add(habitId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      next.delete(habitId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCompletedToday(next);

    // Recalcula dias completos otimisticamente
    const allCompleted = next.size >= HABITS.length;

    setSaving(habitId);

    try {
      if (isNowCompleted) {
        const { error } = await supabase
          .from('challenge_completions')
          .insert({ user_id: userId, habit_id: habitId, completed_date: today });

        if (error && error.code !== '23505') {
          // 23505 = unique violation (já inserido), ignoramos
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('challenge_completions')
          .delete()
          .eq('user_id', userId)
          .eq('habit_id', habitId)
          .eq('completed_date', today);

        if (error) throw error;
      }

      // Recarrega contagem de dias completos do servidor
      const { data: allData } = await supabase
        .from('challenge_completions')
        .select('completed_date')
        .eq('user_id', userId);

      if (allData) {
        const byDate: Record<string, number> = {};
        for (const row of allData) {
          byDate[row.completed_date] = (byDate[row.completed_date] || 0) + 1;
        }
        const fullDays = Object.values(byDate).filter((c) => c >= HABITS.length).length;
        setDaysCompleted(fullDays);
      }
    } catch (err) {
      console.warn('[ChallengeScreen.toggleHabit]', err);
      // Reverte em caso de erro
      const reverted = new Set(completedToday);
      setCompletedToday(reverted);
      Alert.alert('Erro', 'Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setSaving(null);
    }
  }

  const progressPercent = daysCompleted / 30;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#080C14', '#0A0F1A']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator color="#3D54D9" size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#080C14', '#0A0F1A', '#060A12']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back-outline" size={24} color="#E0EAFF" />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Desafio de 30 Dias</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Anel de progresso */}
          <View style={styles.ringSection}>
            <SimpleRing completedToday={completedToday} />
          </View>

          {/* Progresso de dias */}
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              <Text style={styles.progressHighlight}>{daysCompleted}</Text>
              /30 dias completos
            </Text>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(progressPercent * 100, 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* Divisor */}
          <View style={styles.divider} />

          {/* Lista de hábitos */}
          <Text style={styles.sectionTitle}>Hábitos de hoje</Text>

          {HABITS.map((habit) => {
            const isDone = completedToday.has(habit.id);
            const isSaving = saving === habit.id;

            return (
              <TouchableOpacity
                key={habit.id}
                style={[styles.habitCard, isDone && styles.habitCardDone]}
                activeOpacity={0.82}
                onPress={() => toggleHabit(habit.id)}
              >
                {/* Ícone do hábito */}
                <View style={[styles.habitIconWrap, { backgroundColor: habit.color + '20' }]}>
                  <Ionicons
                    name={habit.icon}
                    size={22}
                    color={isDone ? habit.color : 'rgba(255,255,255,0.4)'}
                  />
                </View>

                {/* Textos */}
                <View style={styles.habitTexts}>
                  <Text style={[styles.habitLabel, isDone && styles.habitLabelDone]}>
                    {habit.label}
                  </Text>
                  <Text style={styles.habitDesc}>{habit.desc}</Text>
                </View>

                {/* Checkbox */}
                {isSaving ? (
                  <ActivityIndicator size="small" color={habit.color} style={styles.checkbox} />
                ) : (
                  <View
                    style={[
                      styles.checkbox,
                      isDone
                        ? { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }
                        : styles.checkboxEmpty,
                    ]}
                  >
                    {isDone && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Mensagem motivacional */}
          {completedToday.size === HABITS.length && (
            <View style={styles.allDoneCard}>
              <LinearGradient
                colors={['#1A2A6A', '#0F1840']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="trophy-outline" size={28} color="#FFD700" />
              <Text style={styles.allDoneTitle}>Dia completo!</Text>
              <Text style={styles.allDoneDesc}>
                Você marcou todos os hábitos hoje. Continue assim.
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Anel simples com segmentos coloridos ─────────────────────────────────────
// Cada hábito = um arco. Completo = cor viva. Pendente = quase invisível.

function SimpleRing({ completedToday }: { completedToday: Set<string> }) {
  const size = RING_SIZE;
  const stroke = RING_STROKE;
  const n = HABITS.length;
  const gapDeg = 10;
  const arcDeg = (360 - gapDeg * n) / n;
  const completedCount = completedToday.size;

  return (
    <View style={{ width: size, height: size }}>
      {HABITS.map((habit, i) => {
        const isOn = completedToday.has(habit.id);
        const startDeg = i * (arcDeg + gapDeg) - 90;
        const endDeg = startDeg + arcDeg;
        const midDeg = startDeg + arcDeg / 2;

        return (
          <ArcSegment
            key={habit.id}
            size={size}
            stroke={stroke}
            startDeg={startDeg}
            arcDeg={arcDeg}
            color={isOn ? habit.color : 'rgba(255,255,255,0.07)'}
          />
        );
      })}

      {/* Centro */}
      <View style={[StyleSheet.absoluteFill, styles.ringCenterWrap]}>
        <Text style={styles.ringCenterCount}>{completedCount}</Text>
        <Text style={styles.ringCenterLabel}>de {n} hoje</Text>
      </View>
    </View>
  );
}

// Segmento de arco individual
// Técnica: dois retângulos com overflow:hidden para mascarar partes do círculo
function ArcSegment({
  size,
  stroke,
  startDeg,
  arcDeg,
  color,
}: {
  size: number;
  stroke: number;
  startDeg: number;
  arcDeg: number;
  color: string;
}) {
  const half = size / 2;

  // Se o arco for <= 180 graus, usamos um semicírculo
  // Se > 180, combinamos dois
  const useDouble = arcDeg > 180;

  if (!useDouble) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${startDeg}deg` }] }]}
      >
        {/* Máscara: mostra apenas metade superior */}
        <View style={{ width: size, height: half, overflow: 'hidden' }}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: stroke,
              borderColor: color,
              // Rotaciona para que o arco ocupe o ângulo certo
              transform: [{ rotate: `${arcDeg - 180}deg` }],
            }}
          />
        </View>
      </View>
    );
  }

  // Arco > 180: dois semicírculos
  return (
    <>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${startDeg}deg` }] }]}
      >
        <View style={{ width: size, height: half, overflow: 'hidden' }}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
        </View>
      </View>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${startDeg + 180}deg` }] }]}
      >
        <View style={{ width: size, height: half, overflow: 'hidden' }}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: stroke,
              borderColor: color,
              transform: [{ rotate: `${arcDeg - 360}deg` }],
            }}
          />
        </View>
      </View>
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#080C14',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  backText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#E0EAFF',
    marginLeft: 2,
  },
  headerTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 17,
    color: '#E0EAFF',
    textAlign: 'center',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Anel
  ringSection: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  ringCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterCount: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 36,
    color: '#E0EAFF',
    lineHeight: 40,
  },
  ringCenterLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: 'rgba(224,234,255,0.5)',
    marginTop: 2,
  },

  // Barra de progresso
  progressSection: {
    marginBottom: 24,
  },
  progressLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: 'rgba(224,234,255,0.6)',
    marginBottom: 10,
  },
  progressHighlight: {
    fontFamily: 'Rubik_700Bold',
    color: '#E0EAFF',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#3D54D9',
    borderRadius: 2,
  },

  // Divisor
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 20,
  },

  // Seção
  sectionTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 13,
    color: 'rgba(224,234,255,0.4)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Cards de hábito
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1420',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1A2240',
    gap: 14,
  },
  habitCardDone: {
    borderColor: 'rgba(76,175,80,0.25)',
    backgroundColor: 'rgba(76,175,80,0.05)',
  },
  habitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTexts: {
    flex: 1,
    gap: 3,
  },
  habitLabel: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 15,
    color: '#E0EAFF',
  },
  habitLabelDone: {
    color: 'rgba(224,234,255,0.7)',
  },
  habitDesc: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: 'rgba(224,234,255,0.4)',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Card de parabéns
  allDoneCard: {
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.3)',
  },
  allDoneTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 18,
    color: '#E0EAFF',
  },
  allDoneDesc: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: 'rgba(224,234,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Estilos legados (mantidos por compatibilidade)
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  arcContainer: {
    position: 'absolute',
  },
  arc: {
    position: 'absolute',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
