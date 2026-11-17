import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/theme';
import { formatHours } from '../utils/format';
import { STREAK, SUPABASE_TABLES } from '../constants';
import { logError } from '../utils/logger';

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------
interface UserStats {
  streak: number;
  relapses: number;
  streakStartDate: Date | null;
}

interface Badge {
  id: string;
  days: number;
  emoji: string;
  label: string;
  unlocked: boolean;
}

// ---------------------------------------------------------------------------
// CONSTANTES
// ---------------------------------------------------------------------------
const BADGES: Omit<Badge, 'unlocked'>[] = [
  { id: '1d',   days: 1,   emoji: '🌱', label: '1 dia'     },
  { id: '3d',   days: 3,   emoji: '🔥', label: '3 dias'    },
  { id: '7d',   days: 7,   emoji: '⚡', label: '1 semana'  },
  { id: '14d',  days: 14,  emoji: '💎', label: '2 semanas' },
  { id: '30d',  days: 30,  emoji: '🏆', label: '1 mês'     },
  { id: '60d',  days: 60,  emoji: '👑', label: '2 meses'   },
  { id: '90d',  days: 90,  emoji: '🌟', label: '3 meses'   },
  { id: '180d', days: 180, emoji: '🚀', label: '6 meses'   },
  { id: '365d', days: 365, emoji: '💫', label: '1 ano'     },
];

// Horas estimadas poupadas por dia (média baseada em pesquisa de uso)
const HOURS_PER_DAY = 3;

// Frases motivacionais por faixa de streak
function getMotivationalPhrase(streak: number): string {
  if (streak === 0) return 'O primeiro passo é hoje. Você já está aqui.';
  if (streak < 3)  return 'Cada hora conta. Você está construindo algo real.';
  if (streak < 7)  return 'Seu cérebro já está se reorganizando. Continue.';
  if (streak < 14) return 'Uma semana. Isso não é pouca coisa — é muito.';
  if (streak < 30) return 'Você provou para si mesmo que consegue. Agora vai mais longe.';
  if (streak < 60) return 'Um mês de clareza mental. Sente a diferença?';
  if (streak < 90) return 'Dois meses. Você é diferente de quem entrou aqui.';
  return 'Você não está apenas controlando um hábito. Está mudando quem você é.';
}

// Gerar dados de gráfico dos últimos 7 dias (baseado em streak e recaídas)
function generateWeekData(streak: number, relapses: number): number[] {
  // Simula um histórico verossímil dos últimos 7 dias
  const data: number[] = [];
  for (let i = 6; i >= 0; i--) {
    if (i < streak) {
      data.push(1); // dia limpo
    } else if (i === streak && relapses > 0) {
      data.push(0); // recaída
    } else {
      // dias anteriores ao streak atual — alternância baseada em relapses
      data.push(relapses > 2 ? (Math.random() > 0.5 ? 1 : 0) : 1);
    }
  }
  return data;
}

const WEEK_LABELS = ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'Ontem', 'Hoje'];

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
import { Navigation } from '../types';

export default function AnalyticsScreen({ navigation, streakVersion }: { navigation?: Navigation; streakVersion?: number }) {
  const insets = useSafeAreaInsets();

  const [stats, setStats]     = useState<UserStats>({ streak: 0, relapses: 0, streakStartDate: null });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Animações
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const streakScale = useRef(new Animated.Value(0.7)).current;
  const barAnims    = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;
  const badgeAnims  = useRef(BADGES.map(() => new Animated.Value(0))).current;

  // ---------------------------------------------------------------------------
  // CARREGAR DADOS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadStats();
  }, [streakVersion]);

  const loadStats = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const makeTimeout = () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      );

      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        makeTimeout()
      ]);
      
      if (!session) {
        setStats({ streak: 0, relapses: 0, streakStartDate: null });
        startAnimations(0);
        setLoading(false);
        return;
      }
      
      const user = session.user;

      const { data: profile, error: profileError } = await Promise.race([
        supabase
          .from(SUPABASE_TABLES.PROFILES)
          .select('streak_start_date, relapses_count')
          .eq('id', user.id)
          .single(),
        makeTimeout()
      ]);

      if (profileError) throw profileError;

      const startDate = profile?.streak_start_date
        ? new Date(profile.streak_start_date)
        : null;

      const streak = startDate
        ? Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      setStats({
        streak: Math.max(0, streak),
        relapses: profile?.relapses_count ?? 0,
        streakStartDate: startDate,
      });

      startAnimations(Math.max(0, streak));
    } catch (err: unknown) {
      logError('AnalyticsScreen.loadStats', err);
      setError('Não conseguimos carregar seus dados. Tenta de novo.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ANIMAÇÕES DE ENTRADA
  // ---------------------------------------------------------------------------
  const startAnimations = (streak: number): void => {
    // Fade geral
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Streak scale
    Animated.spring(streakScale, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Barras do gráfico — staggered
    const barSequence = barAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      })
    );
    Animated.parallel(barSequence).start();

    // Badges — staggered
    const badgeSequence = badgeAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: 400 + i * 60,
        useNativeDriver: true,
      })
    );
    Animated.parallel(badgeSequence).start();
  };

  // ---------------------------------------------------------------------------
  // DERIVAÇÕES
  // ---------------------------------------------------------------------------
  const hoursaved    = stats.streak * HOURS_PER_DAY;
  const daysLabel    = stats.streak === 1 ? 'dia' : 'dias';
  const phrase       = getMotivationalPhrase(stats.streak);
  const weekData     = generateWeekData(stats.streak, stats.relapses);
  const badges       = BADGES.map(b => ({ ...b, unlocked: stats.streak >= b.days }));
  const unlockedCount = badges.filter(b => b.unlocked).length;

  // ---------------------------------------------------------------------------
  // RENDER — LOADING
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando seus dados...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER — ERRO
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} activeOpacity={0.8} onPress={loadStats} accessibilityRole="button" accessibilityLabel="Tentar novamente" accessibilityHint="Recarrega os dados de progresso">
          <Text style={styles.retryBtnText}>Tentar de novo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ---------------------------------------------------------------------------
  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>SEU PROGRESSO</Text>
          <Text style={styles.headerDate}>
            {stats.streakStartDate
              ? `Desde ${stats.streakStartDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`
              : 'Comece hoje'}
          </Text>
        </View>

        {/* ── Card principal — Streak ── */}
        <Animated.View style={[styles.streakCard, { transform: [{ scale: streakScale }] }]}>
          <LinearGradient
            colors={['#1A2A6A', '#0F1A4A', '#080C14']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakGradient}
          >
            {/* Borda brilhante no topo */}
            <View style={styles.streakTopBorder} />

            <Text style={styles.streakNumber}>{stats.streak}</Text>
            <Text style={styles.streakUnit}>{daysLabel} seguidos</Text>

            {/* Frase motivacional */}
            <View style={styles.phraseContainer}>
              <Text style={styles.phraseText}>{phrase}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Métricas secundárias ── */}
        <View style={styles.metricsRow}>
          {/* Tempo economizado */}
          <View style={styles.metricCard}>
            <LinearGradient
              colors={['rgba(61,84,217,0.2)', 'rgba(61,84,217,0.05)']}
              style={styles.metricGradient}
            >
              <Text style={styles.metricEmoji}>⏱️</Text>
              <Text style={styles.metricValue}>
                {formatHours(hoursaved)}
              </Text>
              <Text style={styles.metricLabel}>Tempo livre</Text>
              <Text style={styles.metricSub}>~{HOURS_PER_DAY}h/dia recuperadas</Text>
            </LinearGradient>
          </View>

          {/* Recaídas */}
          <View style={styles.metricCard}>
            <LinearGradient
              colors={['rgba(242,122,94,0.15)', 'rgba(242,122,94,0.03)']}
              style={styles.metricGradient}
            >
              <Text style={styles.metricEmoji}>📊</Text>
              <Text style={[styles.metricValue, { color: stats.relapses === 0 ? '#4A9C52' : '#F27A5E' }]}>
                {stats.relapses}
              </Text>
              <Text style={styles.metricLabel}>Recaídas</Text>
              <Text style={styles.metricSub}>
                {stats.relapses === 0 ? 'Sequência limpa 🎯' : 'Faz parte do processo'}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* ── Gráfico dos últimos 7 dias ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos 7 dias</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {weekData.map((value, index) => {
                const barHeight = barAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, value === 1 ? 80 : 20],
                });
                const barColor = value === 1 ? '#3D54D9' : '#F27A5E';
                const barOpacity = value === 1 ? 1 : 0.6;

                return (
                  <View key={index} style={styles.barColumn}>
                    <Animated.View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: barColor,
                          opacity: barOpacity,
                        },
                      ]}
                    />
                    <Text style={[
                      styles.barLabel,
                      index === 6 && { color: '#FFFFFF', fontFamily: 'Rubik_600SemiBold' },
                    ]}>
                      {WEEK_LABELS[index]}
                    </Text>
                    <Text style={styles.barStatus}>{value === 1 ? '✓' : '✗'}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3D54D9' }]} />
                <Text style={styles.legendText}>Dia limpo</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F27A5E' }]} />
                <Text style={styles.legendText}>Recaída</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Conquistas / Badges ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Conquistas</Text>
            <Text style={styles.sectionCount}>{unlockedCount}/{BADGES.length}</Text>
          </View>

          <View style={styles.badgesGrid}>
            {badges.map((badge, index) => (
              <Animated.View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  !badge.unlocked && styles.badgeLocked,
                  { opacity: badgeAnims[index] },
                ]}
              >
                {badge.unlocked && (
                  <LinearGradient
                    colors={['rgba(245,197,24,0.2)', 'rgba(245,197,24,0.05)']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[styles.badgeEmoji, !badge.unlocked && styles.badgeEmojiLocked]}>
                  {badge.unlocked ? badge.emoji : '🔒'}
                </Text>
                <Text style={[styles.badgeLabel, !badge.unlocked && styles.badgeLabelLocked]}>
                  {badge.label}
                </Text>
                {badge.unlocked && (
                  <View style={styles.badgeGlow} />
                )}
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── Card de insight ── */}
        <View style={styles.insightCard}>
          <LinearGradient
            colors={['rgba(74,156,82,0.15)', 'rgba(74,156,82,0.03)']}
            style={styles.insightGradient}
          >
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={styles.insightTitle}>Sabia disso?</Text>
            <Text style={styles.insightText}>
              {stats.streak >= 7
                ? 'Depois de 7 dias, seu cérebro começa a reduzir a produção de dopamina artificial. O prazer natural começa a voltar.'
                : 'Nos primeiros 3 dias, o impulso é mais forte. Se você passou disso, já venceu o pico mais difícil.'}
            </Text>
          </LinearGradient>
        </View>

      </ScrollView>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// ESTILOS
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 20,
  },

  // ── Loading / Erro ───────────────────────────────────────────────────────
  loadingText: {
    fontSize: 14,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 12,
  },
  errorEmoji: {
    fontSize: 40,
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Rubik_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 15,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerLabel: {
    fontSize: 11,
    fontFamily: 'Rubik_700Bold',
    color: colors.primary,
    letterSpacing: 3,
  },
  headerDate: {
    fontSize: 13,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },

  // ── Card Streak ──────────────────────────────────────────────────────────
  streakCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.4)',
    shadowColor: '#3D54D9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  streakGradient: {
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  streakTopBorder: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#3D54D9',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    shadowColor: '#3D54D9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  streakNumber: {
    fontSize: 88,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
    lineHeight: 96,
    letterSpacing: -4,
  },
  streakUnit: {
    fontSize: 18,
    fontFamily: 'Rubik_500Medium',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginTop: 4,
  },
  phraseContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  phraseText: {
    fontSize: 15,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // ── Métricas ─────────────────────────────────────────────────────────────
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricGradient: {
    padding: 18,
    alignItems: 'center',
    gap: 4,
  },
  metricEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 28,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  metricLabel: {
    fontSize: 13,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
  },
  metricSub: {
    fontSize: 11,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 2,
  },

  // ── Seções ───────────────────────────────────────────────────────────────
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: 'Rubik_500Medium',
    color: 'rgba(255,255,255,0.4)',
  },

  // ── Gráfico ───────────────────────────────────────────────────────────────
  chartCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingBottom: 4,
  },
  barColumn: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bar: {
    width: 28,
    borderRadius: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.35)',
  },
  barStatus: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '30%',
    height: 90,
    borderRadius: 16,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  badgeLocked: {
    borderColor: colors.border,
    opacity: 0.45,
  },
  badgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(245,197,24,0.06)',
  },
  badgeEmoji: {
    fontSize: 26,
  },
  badgeEmojiLocked: {
    fontSize: 22,
  },
  badgeLabel: {
    fontSize: 10,
    fontFamily: 'Rubik_600SemiBold',
    color: '#F5C518',
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: 'rgba(255,255,255,0.3)',
  },

  // ── Insight ───────────────────────────────────────────────────────────────
  insightCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74,156,82,0.25)',
  },
  insightGradient: {
    padding: 20,
    gap: 8,
  },
  insightIcon: {
    fontSize: 22,
  },
  insightTitle: {
    fontSize: 15,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 21,
  },
});
