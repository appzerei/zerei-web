// screens/DashboardScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
  Image,
  } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { getCustomerInfo, ENTITLEMENT_ID } from '../lib/revenuecat';
import { STREAK, SUPABASE_TABLES } from '../constants';
import { formatStreak } from '../utils/format';
import { logError } from '../utils/logger';
import MeditarScreen from './MeditarScreen';
import JureiScreen from './JureiScreen';
import { BadgeTier, getCurrentTier, getNextTier } from '../utils/badges';

const { width, height } = Dimensions.get('window');

const TAB_BAR_HEIGHT = 64;

function calcStreak(startDate: string | null): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
}


function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

import { Navigation } from '../types';

function BadgeCircle({
  tier,
  size,
  days,
  isNext = false,
  onPress,
}: {
  tier: BadgeTier;
  size: number;
  days?: number;
  isNext?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }
      }}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={isNext ? `Próxima badge: ${tier.label}` : `${tier.label}, ${days} dia${days !== 1 ? 's' : ''}`}
      accessibilityHint={isNext ? 'Próxima conquista a desbloquear' : 'Toque para ver opções do streak'}
    >
      <View style={{ alignItems: 'center' }}>
        {!isNext && (
          <View style={{
            position: 'absolute',
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 2,
            backgroundColor: 'rgba(61,84,217,0.12)',
            top: -12,
            left: -12,
          }} />
        )}
        <Image
          source={isNext ? tier.imageOff : tier.imageOn}
          style={{ width: size, height: size, opacity: isNext ? 0.5 : 1 }}
          resizeMode="contain"
        />
        <Text style={{
          fontFamily: 'Rubik_500Medium',
          fontSize: isNext ? 11 : 15,
          color: '#FFFFFF',
          marginTop: 8,
        }}>
          {tier.label}
        </Text>
        {days !== undefined && (
          <Text style={{
            fontFamily: 'Rubik_400Regular',
            fontSize: isNext ? 10 : 13,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 2,
          }}>
            {isNext ? `em ${tier.minDay - days}d` : `${days} dia${days !== 1 ? 's' : ''}`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}


const NOTIF_MESSAGES = [
  { id: '1', emoji: '🔥', titulo: 'Continue assim!',         corpo: 'Cada dia conta. Você está construindo algo real.',          hora: 'Hoje, 08:00' },
  { id: '2', emoji: '💪', titulo: 'Você é mais forte',       corpo: 'O impulso dura 20 minutos. Você dura uma vida inteira.',    hora: 'Ontem, 08:00' },
  { id: '3', emoji: '🧠', titulo: 'Seu cérebro está mudando', corpo: 'Após 2 semanas, os receptores de dopamina começam a se regenerar.', hora: 'Há 2 dias, 08:00' },
  { id: '4', emoji: '🌅', titulo: 'Novo dia, nova chance',    corpo: 'Hoje é mais um dia que você escolheu você mesmo.',          hora: 'Há 3 dias, 08:00' },
  { id: '5', emoji: '🏆', titulo: 'Progresso invisível',      corpo: 'Você não vê, mas seu cérebro está se reconstruindo agora.', hora: 'Há 4 dias, 08:00' },
];


  export default function DashboardScreen({ navigation, streakVersion }: { navigation: Navigation; streakVersion?: number }) {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [relapses, setRelapses] = useState(0);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState({ day: 1, month: 0, year: new Date().getFullYear() });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showJureiModal, setShowJureiModal] = useState(false);
  const [showMeditarModal, setShowMeditarModal] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalAnim = useRef(new Animated.Value(300)).current;
  const isProcessing = useRef(false);

  useEffect(() => {
    loadUserData();
  }, [streakVersion]);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  async function loadUserData() {
    setErrorMsg(null);
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      );

      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        timeout
      ]);
      
      if (!session) {
        setLoading(false);
        return;
      }
      
      const user = session.user;

      const { data: profile, error: profileError } = await Promise.race([
        supabase
          .from(SUPABASE_TABLES.PROFILES)
          .select('full_name, streak_start_date, relapses_count')
          .eq('id', user.id)
          .single(),
        timeout
      ]);

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setErrorMsg('Seu perfil ainda está sendo preparado. Aguarde um instante.');
        } else {
          setErrorMsg('Não conseguimos carregar seus dados. Verifique sua conexão e tente novamente.');
        }
        return;
      }

      if (profile) {
        setStartDate(profile.streak_start_date);
        setStreak(calcStreak(profile.streak_start_date));
        setRelapses(profile.relapses_count || 0);

        // Check subscription status after confirming Supabase session
        const customerInfo = await getCustomerInfo();
if (customerInfo) {
  const hasPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  if (!hasPremium) {
    navigation.replace('Paywall');
    return;
  }
}
      }
    } catch (error: any) {
      logError('DashboardScreen.loadUserData', error);
      if (error.message === 'timeout') {
        setErrorMsg('A conexão demorou muito. Verifique sua internet e tente novamente.');
      } else {
        setErrorMsg('Algo deu errado. Verifique sua internet e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  function openStreakModal() {
    setShowStreakModal(true);
    Animated.spring(modalAnim, {
      toValue: 0,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }

  function closeStreakModal() {
    Animated.timing(modalAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowStreakModal(false));
  }

  async function handleResetStreak(): Promise<void> {
    // Fecha o modal primeiro e só abre o Alert depois da animação terminar
    Animated.timing(modalAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowStreakModal(false);

      Alert.alert(
        'Resetar streak',
        'Tem certeza? Seu contador vai voltar para zero.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Resetar',
            style: 'destructive',
            onPress: async () => {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;
                if (!user) return;
                const now = new Date().toISOString();
                const { error } = await supabase
                  .from(SUPABASE_TABLES.PROFILES)
                  .update({ streak_start_date: now, relapses_count: relapses + 1 })
                  .eq('id', user.id);

                if (error) {
                  Alert.alert('Erro', 'Não foi possível resetar o streak. Tente novamente.');
                  return;
                }

                setStartDate(now);
                setStreak(0);
                setRelapses((r) => r + 1);
                onStreakReset?.();
              } catch (error) {
                logError('DashboardScreen.handleResetStreak', error);
                Alert.alert('Erro', 'Verifique sua conexão e tente novamente.');
              }
            },
          },
        ]
      );
    });
  }

  async function handleSaveStartDate() {
    const { day, month, year } = pickerDate;
    const date = new Date(year, month, day);
    if (date > new Date()) return;
    const iso = date.toISOString();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setStartDate(iso);
        setStreak(calcStreak(iso));
        setShowDatePicker(false);
        return;
      }
      const { error } = await supabase
        .from(SUPABASE_TABLES.PROFILES)
        .update({ streak_start_date: iso })
        .eq('id', user.id);
      if (error) throw error;
      setStartDate(iso);
      setStreak(calcStreak(iso));
      setShowDatePicker(false);
    } catch (error) {
      logError('DashboardScreen.handleSaveStartDate', error);
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    }
  }

  // ─── Estados de loading / erro ────────────────────────────────────────────
  if (!loading && errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#080C14', '#0A0F1A', '#060A12']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.errorEmoji}>😔</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity
  style={styles.errorBtn}
  activeOpacity={0.8}
  onPress={() => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setLoading(true);
    loadUserData().finally(() => { isProcessing.current = false; });
  }}
>
          <Text style={styles.errorBtnText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#3D54D9" size="large" />
      </View>
    );
  }

  const currentTier = getCurrentTier(streak);
  const nextTier    = getNextTier(streak);

  const QUICK_ACTIONS = [
    { iconName: 'hand-left-outline' as const,   label: 'Jurei',   onPress: () => { if (isProcessing.current) return; isProcessing.current = true; setTimeout(() => { isProcessing.current = false; }, 500); setShowJureiModal(true); } },
    { iconName: 'leaf-outline' as const,        label: 'Meditar', onPress: () => { if (isProcessing.current) return; isProcessing.current = true; setTimeout(() => { isProcessing.current = false; }, 500); setShowMeditarModal(true); } },
    { iconName: 'refresh-outline' as const,     label: 'Resetar', onPress: () => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      setTimeout(() => { isProcessing.current = false; }, 500);
      openStreakModal();
    }},
    { iconName: 'sparkles-outline' as const,    label: 'Zara',     onPress: () => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      setTimeout(() => { isProcessing.current = false; }, 500);
      navigation.navigate('ZARA');
    }},
  ];

  const bottomPad = TAB_BAR_HEIGHT + insets.bottom + 8;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#080C14', '#0A0F1A', '#060A12']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Partículas decorativas */}
      {[...Array(12)].map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: '#4A6AFF',
            opacity: 0.06 + (i % 4) * 0.02,
            top:  height * (0.05 + (i * 0.072) % 0.85),
            left: width  * ((i * 0.137 + 0.05) % 0.95),
          }}
        />
      ))}



      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.logoText}>ZEREI</Text>
        <TouchableOpacity
  style={styles.notifBtn}
  activeOpacity={0.8}
  accessibilityRole="button"
  accessibilityLabel="Notificações"
  accessibilityHint="Abre a lista de notificações"
  onPress={() => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 500);
    setShowNotifPopover(p => !p);
  }}
>
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>1</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

{/* Popover — Notificações */}
{showNotifPopover && (
        <TouchableOpacity
          style={styles.notifBackdrop}
          activeOpacity={1}
          onPress={() => setShowNotifPopover(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.notifPopover}>
              <Text style={styles.notifPopoverTitle}>Notificações</Text>
              {NOTIF_MESSAGES.map((n, i) => (
                <View key={n.id}>
                  <View style={styles.notifItem}>
                    <Text style={styles.notifItemEmoji}>{n.emoji}</Text>
                    <View style={styles.notifItemText}>
                      <Text style={styles.notifItemTitulo}>{n.titulo}</Text>
                      <Text style={styles.notifItemCorpo}>{n.corpo}</Text>
                      <Text style={styles.notifItemHora}>{n.hora}</Text>
                    </View>
                  </View>
                  {i < NOTIF_MESSAGES.length - 1 && <View style={styles.notifDivider} />}
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Badges */}
      <Animated.View
        style={[
          styles.badgesRow,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <BadgeCircle
          tier={currentTier}
          size={130}
          days={streak}
          onPress={openStreakModal}
        />
        {nextTier && (
          <View style={{ marginLeft: 16, marginTop: 20 }}>
            <BadgeCircle tier={nextTier} size={80} days={streak} isNext />
          </View>
        )}
      </Animated.View>

      <Animated.View style={[styles.separator, { opacity: fadeAnim }]} />

      {/* Métricas */}
      <Animated.View style={[styles.metricsRow, { opacity: fadeAnim }]}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Recaídas</Text>
          <Text style={styles.metricValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{relapses}</Text>
        </View>
        <View style={[styles.metric, styles.metricCenter]}>
          <Text style={styles.metricLabel}>Livre há</Text>
          <Text style={[styles.metricValue, { color: '#E0EAFF' }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{formatStreak(streak)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Até 90d</Text>
          <Text style={[styles.metricValue, { color: '#E0EAFF' }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{Math.max(0, STREAK.MAX_DAYS - streak)}d</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.separator, { opacity: fadeAnim }]} />

      {/* Ações rápidas */}
      <Animated.View style={[styles.actionsRow, { opacity: fadeAnim }]}>
        {QUICK_ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={styles.actionItem}
            activeOpacity={0.8}
            onPress={a.onPress}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            accessibilityHint={a.label === 'Resetar' ? 'Abre o modal de opções do streak' : a.label === 'REI' ? 'Navega para a tela de REI' : undefined}
          >
            <View style={styles.actionCircle}>
              <Ionicons name={a.iconName} size={23} color="#E0EAFF" />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Panic Button */}
      <Animated.View style={[styles.panicWrapper, { opacity: fadeAnim, marginBottom: bottomPad }]}>
      <TouchableOpacity
  activeOpacity={0.85}
  onPress={() => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 500);
    navigation.navigate('PanicButton');
  }}
>
          <LinearGradient
            colors={['#F27A5E', '#D05030']}
            style={styles.panicBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.panicIcon}>⚠️</Text>
            <Text style={styles.panicText}>Botão de Pânico</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal — Streak Options */}
      <Modal
        visible={showStreakModal}
        transparent
        animationType="none"
        onRequestClose={closeStreakModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeStreakModal}
        >
          <Animated.View
            style={[styles.bottomSheet, { transform: [{ translateY: modalAnim }] }]}
          >
            <TouchableOpacity activeOpacity={1}>
              <Text style={styles.sheetTitle}>Streak Options</Text>
              <TouchableOpacity
  style={styles.sheetOption}
  activeOpacity={0.7}
  onPress={() => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 500);
    closeStreakModal();
    setTimeout(() => setShowEditWarning(true), 300);
  }}
>
                <Text style={[styles.sheetOptionText, { color: '#3D54D9' }]}>Edit Start Date</Text>
              </TouchableOpacity>
              <View style={styles.sheetDivider} />
              <TouchableOpacity
  style={styles.sheetOption}
  activeOpacity={0.7}
  onPress={() => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    handleResetStreak().finally(() => { isProcessing.current = false; });
  }}
>
                <Text style={[styles.sheetOptionText, { color: '#C0392B' }]}>Reset Streak</Text>
              </TouchableOpacity>
              <View style={styles.sheetDivider} />
              <TouchableOpacity
  style={[styles.sheetOption, { marginTop: 4 }]}
  activeOpacity={0.7}
  onPress={() => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 500);
    closeStreakModal();
  }}
>
                <Text style={[styles.sheetOptionText, { color: 'rgba(255,255,255,0.4)' }]}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Modal — Edit Warning */}
      <Modal
        visible={showEditWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditWarning(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Editar data de início</Text>
            <Text style={styles.warningBody}>
              Editar sua data de início vai te remover dos leaderboards. Seu progresso continua sendo
              rastreado, mas você não vai aparecer nos rankings da comunidade.
            </Text>
            <View style={styles.warningActions}>
            <TouchableOpacity
  onPress={() => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 500);
    setShowEditWarning(false);
  }}
  activeOpacity={0.7}
>
                <Text style={[styles.warningBtn, { color: 'rgba(255,255,255,0.4)' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
  onPress={() => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 500);
    const d = startDate ? new Date(startDate) : new Date();
    setPickerDate({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
    setShowEditWarning(false);
    setTimeout(() => setShowDatePicker(true), 300);
  }}
  activeOpacity={0.7}
>
                <Text style={[styles.warningBtn, { color: '#C0392B' }]}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal — Date Picker */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerSheet}>
              <Text style={styles.sheetTitle}>Data de início</Text>

              <ScrollView style={styles.datePickerRowScroll} contentContainerStyle={styles.datePickerRow} showsVerticalScrollIndicator={false}>
                {/* Dia */}
                <View style={styles.datePickerCol}>
                  <Text style={styles.datePickerColLabel}>DIA</Text>
                  {Array.from({ length: getDaysInMonth(pickerDate.month, pickerDate.year) }, (_, i) => i + 1).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.datePickerItem, pickerDate.day === d && styles.datePickerItemActive]}
                      onPress={() => setPickerDate((p) => ({ ...p, day: d }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.datePickerItemText, pickerDate.day === d && styles.datePickerItemTextActive]}>
                        {String(d).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Mês */}
                <View style={styles.datePickerCol}>
                  <Text style={styles.datePickerColLabel}>MÊS</Text>
                  {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.datePickerItem, pickerDate.month === i && styles.datePickerItemActive]}
                      onPress={() => {
                        const maxDay = getDaysInMonth(i, pickerDate.year);
                        setPickerDate((p) => ({ ...p, month: i, day: Math.min(p.day, maxDay) }));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.datePickerItemText, pickerDate.month === i && styles.datePickerItemTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Ano */}
                <View style={styles.datePickerCol}>
                  <Text style={styles.datePickerColLabel}>ANO</Text>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.datePickerItem, pickerDate.year === y && styles.datePickerItemActive]}
                      onPress={() => {
                        const maxDay = getDaysInMonth(pickerDate.month, y);
                        setPickerDate((p) => ({ ...p, year: y, day: Math.min(p.day, maxDay) }));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.datePickerItemText, pickerDate.year === y && styles.datePickerItemTextActive]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.datePickerBtnCancel}
                  onPress={() => {
                    if (isProcessing.current) return;
                    isProcessing.current = true;
                    setTimeout(() => { isProcessing.current = false; }, 500);
                    setShowDatePicker(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.datePickerBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePickerBtnConfirm}
                  onPress={() => {
                    if (isProcessing.current) return;
                    isProcessing.current = true;
                    handleSaveStartDate().finally(() => { isProcessing.current = false; });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.datePickerBtnConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
       
      </Modal>

    {/* Modal — Jurei */}
      <Modal
        visible={showJureiModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowJureiModal(false)}
      >
        <JureiScreen onClose={() => setShowJureiModal(false)} />
      </Modal>


      {/* Modal — Meditar */}
      <Modal
        visible={showMeditarModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMeditarModal(false)}
      >
        <MeditarScreen onClose={() => setShowMeditarModal(false)} />
      </Modal>
    </View>
  );
}


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
  errorContainer: {
    flex: 1,
    backgroundColor: '#080C14',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3D54D9',
  },
  errorBtnText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 24,
    color: '#E0EAFF',
    letterSpacing: 3,
  },
  notifBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifIcon: {
    fontSize: 22,
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3D54D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  separator: {
    height: 1,
    backgroundColor: '#1A2240',
    marginHorizontal: 24,
    marginVertical: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1A2240',
  },
  metricLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 11,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 19,
    color: '#3D54D9',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F1420',
    borderWidth: 1,
    borderColor: '#1A2240',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 11,
    color: '#FFFFFF',
  },
  panicWrapper: {
    marginHorizontal: 20,
    marginTop: 4,
  },
  panicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 50,
    gap: 10,
  },
  panicIcon: {
    fontSize: 18,
  },
  panicText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#0F1420',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sheetOption: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  sheetOptionText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 16,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#1A2240',
  },
  warningCard: {
    backgroundColor: '#0F1420',
    marginHorizontal: 32,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  warningTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningBody: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  warningActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  warningBtn: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  datePickerSheet: {
    backgroundColor: '#0F1420',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#1A2240',
    maxHeight: '70%',
  },
  datePickerRowScroll: {
    maxHeight: 220,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  datePickerCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  datePickerColLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  datePickerItem: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  datePickerItemActive: {
    backgroundColor: 'rgba(61,84,217,0.2)',
    borderWidth: 1,
    borderColor: '#3D54D9',
  },
  datePickerItemText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },
  datePickerItemTextActive: {
    fontFamily: 'Rubik_600SemiBold',
    color: '#E0EAFF',
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerBtnCancel: {
    flex: 1,
    height: 52,
    borderRadius: 30,
    backgroundColor: 'rgba(61,84,217,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerBtnCancelText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
  },
  datePickerBtnConfirm: {
    flex: 1,
    height: 52,
    borderRadius: 30,
    backgroundColor: '#3D54D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerBtnConfirmText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Jurei modal
jureiCard: {
  backgroundColor: '#0F1420',
  marginHorizontal: 24,
  borderRadius: 24,
  padding: 28,
  borderWidth: 1,
  borderColor: '#1A2240',
  alignItems: 'center',
},
jureiIconWrap: {
  width: 96,
  height: 96,
  borderRadius: 48,
  backgroundColor: 'rgba(61,84,217,0.12)',
  borderWidth: 1,
  borderColor: 'rgba(61,84,217,0.25)',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20,
},
jureiIconEmoji: {
  fontSize: 44,
},
jureiTitle: {
  fontFamily: 'Rubik_700Bold',
  fontSize: 22,
  color: '#E0EAFF',
  textAlign: 'center',
  marginBottom: 10,
},
jureiSubtitle: {
  fontFamily: 'Rubik_400Regular',
  fontSize: 14,
  color: 'rgba(255,255,255,0.55)',
  textAlign: 'center',
  lineHeight: 22,
  marginBottom: 24,
  paddingHorizontal: 8,
},
jureiTopicos: {
  width: '100%',
  gap: 16,
  marginBottom: 28,
},
jureiTopico: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 14,
},
jureiTopicoIcon: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(61,84,217,0.1)',
  alignItems: 'center',
  justifyContent: 'center',
},
jureiTopicoEmoji: {
  fontSize: 18,
},
jureiTopicoTexto: {
  flex: 1,
  gap: 3,
},
jureiTopicoTitulo: {
  fontFamily: 'Rubik_600SemiBold',
  fontSize: 14,
  color: '#E0EAFF',
},
jureiTopicoDesc: {
  fontFamily: 'Rubik_400Regular',
  fontSize: 13,
  color: 'rgba(255,255,255,0.5)',
  lineHeight: 19,
},
jureiBtn: {
  width: '100%',
  borderRadius: 30,
  overflow: 'hidden',
},
jureiBtnGradient: {
  paddingVertical: 17,
  alignItems: 'center',
},
jureiBtnText: {
  fontFamily: 'Rubik_700Bold',
  fontSize: 16,
  color: '#FFFFFF',
  letterSpacing: 0.5,
},
jureiCancelar: {
  fontFamily: 'Rubik_400Regular',
  fontSize: 14,
  color: 'rgba(255,255,255,0.3)',
},


// Popover notificações
notifBackdrop: {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  zIndex: 200,
},
notifPopover: {
  position: 'absolute',
  top: 56,
  right: 20,
  width: 300,
  backgroundColor: '#0F1420',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#1A2240',
  paddingVertical: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.4,
  shadowRadius: 16,
  elevation: 12,
},
notifPopoverTitle: {
  fontFamily: 'Rubik_600SemiBold',
  fontSize: 13,
  color: 'rgba(255,255,255,0.4)',
  letterSpacing: 1,
  textTransform: 'uppercase',
  paddingHorizontal: 16,
  paddingVertical: 10,
},
notifItem: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 12,
},
notifItemEmoji: {
  fontSize: 20,
  lineHeight: 24,
  marginTop: 2,
},
notifItemText: {
  flex: 1,
  gap: 2,
},
notifItemTitulo: {
  fontFamily: 'Rubik_600SemiBold',
  fontSize: 13,
  color: '#E0EAFF',
},
notifItemCorpo: {
  fontFamily: 'Rubik_400Regular',
  fontSize: 12,
  color: 'rgba(255,255,255,0.5)',
  lineHeight: 17,
},
notifItemHora: {
  fontFamily: 'Rubik_400Regular',
  fontSize: 11,
  color: 'rgba(255,255,255,0.25)',
  marginTop: 2,
},
notifDivider: {
  height: 1,
  backgroundColor: '#1A2240',
  marginHorizontal: 16,
},

});
