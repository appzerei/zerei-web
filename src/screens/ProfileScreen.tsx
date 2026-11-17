import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  Switch,
  TextInput,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { signOutEverywhere } from '../lib/auth';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/theme';
import { logError } from '../utils/logger';
import { STREAK, PRICING } from '../constants';
import { formatStreak } from '../utils/format';
import { BADGE_TIERS, STAR_IMAGES, getBadgeStars, getCurrentTierIndex, BadgeTier } from '../utils/badges';

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------
type SettingsPage =
  | null
  | 'settings'
  | 'profile_edit'
  | 'notifications'
  | 'support'
  | 'feedback'
  | 'subscription'
  | 'more'
  | 'leaderboard'
  | 'achievements';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function calcStreak(startDate: string | null): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
}

function calcJoinedDays(createdAt: string | null): number {
  if (!createdAt) return 0;
  const start = new Date(createdAt);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
}

function getCurrentLevel(streak: number): { level: string; nextLevel: string; progress: number; emoji: string } {
  if (streak >= 120) return { level: 'Lenda V',      nextLevel: 'Máximo',       progress: 1,                              emoji: '👑' };
  if (streak >= 110) return { level: 'Lenda IV',     nextLevel: 'Lenda V',      progress: (streak - 110) / 10,            emoji: '👑' };
  if (streak >= 100) return { level: 'Lenda III',    nextLevel: 'Lenda IV',     progress: (streak - 100) / 10,            emoji: '👑' };
  if (streak >= 95)  return { level: 'Lenda II',     nextLevel: 'Lenda III',    progress: (streak - 95) / 5,              emoji: '👑' };
  if (streak >= 91)  return { level: 'Lenda I',      nextLevel: 'Lenda II',     progress: (streak - 91) / 4,              emoji: '👑' };
  if (streak >= 73)  return { level: 'Libertação',   nextLevel: 'Lenda I',      progress: (streak - 73) / 18,             emoji: '🦅' };
  if (streak >= 55)  return { level: 'Transformação',nextLevel: 'Libertação',   progress: (streak - 55) / 18,             emoji: '🔥' };
  if (streak >= 37)  return { level: 'Construção',   nextLevel: 'Transformação',progress: (streak - 37) / 18,             emoji: '🏗️' };
  if (streak >= 19)  return { level: 'Resistência',  nextLevel: 'Construção',   progress: (streak - 19) / 18,             emoji: '💪' };
  if (streak >= 1)   return { level: 'Iniciante',    nextLevel: 'Resistência',  progress: (streak - 1) / 18,              emoji: '🌱' };
  return               { level: 'Semente',         nextLevel: 'Iniciante',    progress: 0,                              emoji: '🌾' };
}

// Sistema de badges movido para src/utils/badges.ts,
// compartilhado com o DashboardScreen.

const LEADERBOARD = [
  { rank: 1,     name: 'Anônimo',   days: 412  },
  { rank: 2,     name: 'Marcos',    days: 198  },
  { rank: 3,     name: 'Diego',     days: 145  },
  { rank: 4,     name: 'Rafael',    days: 89   },
  { rank: 5,     name: 'Felipe',    days: 67   },
  { rank: 9823,  name: 'Você',      days: 12, isMe: true },
];

// ---------------------------------------------------------------------------
// HELPER — Avatar
// ---------------------------------------------------------------------------
function Avatar({ name, size = 72 }: { name: string; size?: number }) {
  return (
    <LinearGradient
      colors={['#3D54D9', '#293CA6', '#1A2A8A']}
      style={{
        width: size, height: size, borderRadius: size / 2,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2.5, borderColor: 'rgba(61,84,217,0.5)',
      }}
    >
      <Text style={{ fontSize: size * 0.42, fontFamily: 'Rubik_700Bold', color: '#FFFFFF' }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// HELPER — Row de configuração
// ---------------------------------------------------------------------------
function SettingsRow({
  emoji, label, sublabel, onPress, danger = false, last = false,
}: {
  emoji: string; label: string; sublabel?: string;
  onPress: () => void; danger?: boolean; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, last && { borderBottomWidth: 0 }]}
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.settingsRowEmoji}>{emoji}</Text>
      <View style={styles.settingsRowContent}>
        <Text style={[styles.settingsRowLabel, danger && { color: colors.danger }]}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={styles.settingsRowSublabel}>{sublabel}</Text>
        ) : null}
      </View>
      <Text style={styles.settingsRowChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// HELPER — Modal de explicação de badge (mesmo padrão visual do "Jurei")
// ---------------------------------------------------------------------------
function BadgeInfoModal({
  visible, tier, unlocked, onClose,
}: {
  visible: boolean; tier: BadgeTier | undefined; unlocked: boolean; onClose: () => void;
}) {
  if (!tier) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.alertOverlay}>
        <View style={styles.alertBox}>
          <View style={styles.badgeModalIconWrap}>
            <Image
              source={unlocked ? tier.imageOn : tier.imageOff}
              style={styles.badgeModalImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.alertTitle}>{tier.label}</Text>
          <Text style={styles.alertBody}>{tier.description}</Text>
          <Text style={[styles.alertBody, { opacity: 0.6, fontSize: 12 }]}>
            {unlocked ? `Desbloqueada — ${tier.sublabel}` : `Bloqueada — desbloqueia em ${tier.sublabel}`}
          </Text>
          <TouchableOpacity
            style={[styles.badgeModalCloseBtn, { marginTop: 4 }]}
            activeOpacity={0.8}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Entendi"
            accessibilityHint="Fecha a explicação da conquista"
          >
            <Text style={styles.badgeModalCloseBtnText}>Entendi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
import { Navigation } from '../types';

export default function ProfileScreen({ navigation }: { navigation: Navigation }) {
  const insets = useSafeAreaInsets();

  const [page, setPage] = useState<SettingsPage>(null);
  const [loading, setLoading] = useState(true);

  // Dados reais do usuário
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userStreak, setUserStreak] = useState(0);
  const [userRelapses, setUserRelapses] = useState(0);
  const [userJoinedDays, setUserJoinedDays] = useState(0);
  const [userAge, setUserAge] = useState('');

  // Configurações locais
  const [notifEnabled, setNotifEnabled]   = useState(true);
  const [notifFeatured, setNotifFeatured] = useState(false);
  const [notifAll, setNotifAll]           = useState(true);
  const [feedbackText, setFeedbackText]   = useState('');
  const [feedbackSent, setFeedbackSent]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [logoutAllConfirm, setLogoutAllConfirm] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [editingField, setEditingField]   = useState<'nome' | 'idade' | null>(null);
  const [editingValue, setEditingValue]   = useState('');
  const [isLoggingOut, setIsLoggingOut]   = useState(false);
  const [isSharing, setIsSharing]         = useState(false);
  const [referralCode, setReferralCode]   = useState('');
  const isProcessingLogout = useRef(false);
  const isProcessingLogoutAll = useRef(false);
  const isProcessingShare  = useRef(false);
  const isProcessingNav    = useRef(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const badgesScrollRef = useRef<ScrollView>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  // Animações
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const ringAnim     = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile();
    Animated.loop(
      Animated.timing(ringAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: false })
    ).start();
  }, []);

  // Rola o carrossel de badges até a badge do nível atual do usuário,
  // em vez de sempre abrir mostrando a badge 1.
  useEffect(() => {
    if (loading) return;
    const currentIndex = getCurrentTierIndex(userStreak);
    const BADGE_ITEM_WIDTH = 88;
    const BADGE_GAP = 12;
    const offset = Math.max(0, currentIndex * (BADGE_ITEM_WIDTH + BADGE_GAP) - BADGE_ITEM_WIDTH);
    const timeout = setTimeout(() => {
      badgesScrollRef.current?.scrollTo({ x: offset, animated: true });
    }, 400);
    return () => clearTimeout(timeout);
  }, [loading, userStreak]);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  setLoading(false);
  return;
}
      setUserId(session.user.id);
      setUserEmail(session.user.email ?? '');

      const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, age, streak_start_date, relapses_count, created_at, referral_code, avatar_url')
      .eq('id', session.user.id)
      .single();

      if (profile) {
        const streak = calcStreak(profile.streak_start_date);
        const joined = calcJoinedDays(profile.created_at);
        const levelData = getCurrentLevel(streak);

        setUserName(profile.full_name ?? '');
        setUserAge(profile.age ? String(profile.age) : '');
        setUserStreak(streak);
        setUserRelapses(profile.relapses_count ?? 0);
        setUserJoinedDays(joined);
        setReferralCode(profile.referral_code ?? '');
        if (profile.avatar_url) {
          const bustUrl = profile.avatar_url.split('?')[0] + `?t=${Date.now()}`;
          setAvatarUri(bustUrl);
        }

        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        Animated.timing(progressAnim, {
          toValue: levelData.progress,
          duration: 900,
          delay: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      }
    } catch (error) {
      logError('ProfileScreen.loadProfile', error);
    } finally {
      setLoading(false);
    }
  };

  const saveField = async (field: 'nome' | 'idade', value: string) => {
    if (!userId) return;
    try {
      if (field === 'nome') {
        await supabase.from('profiles').update({ full_name: value }).eq('id', userId);
        setUserName(value);
      } else {
        await supabase.from('profiles').update({ age: parseInt(value) || null }).eq('id', userId);
        setUserAge(value);
      }
    } catch (error) {
      logError('ProfileScreen.saveField', error);
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    }
  };

  const levelData = getCurrentLevel(userStreak);
  const selectedTier = BADGE_TIERS.find(t => t.id === selectedBadgeId);
  const selectedUnlocked = selectedTier ? userStreak >= selectedTier.minDay : false;

  const ringColor = ringAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(61,84,217,0.8)', 'rgba(61,84,217,0.3)', 'rgba(61,84,217,0.8)'],
  });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#3D54D9" size="large" />
      </View>
    );
  }

  const handleLogout = async (): Promise<void> => {
    if (isProcessingLogout.current) return;
    isProcessingLogout.current = true;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      navigation?.replace?.('Impact1');
    } catch (error: any) {
      logError('ProfileScreen.handleLogout', error);
      Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
      setIsLoggingOut(false);
      isProcessingLogout.current = false;
    }
  };

  const handleLogoutAll = async (): Promise<void> => {
    if (isProcessingLogoutAll.current) return;
    isProcessingLogoutAll.current = true;
    setIsLoggingOutAll(true);
    try {
      const { error } = await signOutEverywhere();
      if (error) throw new Error(error);
      navigation?.replace?.('Impact1');
    } catch (error: any) {
      logError('ProfileScreen.handleLogoutAll', error);
      Alert.alert('Erro', 'Não foi possível encerrar todas as sessões. Tente novamente.');
      setIsLoggingOutAll(false);
      isProcessingLogoutAll.current = false;
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    if (!userId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Falha ao deletar conta');
      }

      await supabase.auth.signOut();
      navigation?.replace?.('Impact1');
    } catch (error) {
      logError('ProfileScreen.handleDeleteAccount', error);
      Alert.alert('Erro', 'Não foi possível deletar a conta. Tente novamente.');
    }
  };

  const handleShare = async (): Promise<void> => {
    if (isProcessingShare.current) return;
    isProcessingShare.current = true;
    setIsSharing(true);
    try {
       await Share.share({
        message: `Estou usando o ZEREI para controlar meus hábitos digitais e está funcionando.\n\nEntra comigo! Use meu código de indicação: ${referralCode}\n\nVocê ganha 3 dias grátis quando eu te indicar 💙`,
      });
    } catch (error) {
      logError('ProfileScreen.handleShare', error);
      Alert.alert('Erro', 'Não foi possível compartilhar. Tente novamente.');
    } finally {
      setIsSharing(false);
      isProcessingShare.current = false;
    }
  };

  const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const handlePickAvatar = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão necessária', 'Permita o acesso à galeria para trocar a foto.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });
  if (!result.canceled && result.assets[0] && userId) {
    const asset = result.assets[0];

    // Verifica o tamanho do arquivo antes de tentar o upload
    if (asset.fileSize && asset.fileSize > MAX_AVATAR_SIZE_BYTES) {
      Alert.alert('Imagem muito grande', 'Escolha uma foto de até 5MB.');
      return;
    }

    const localUri = asset.uri;
    setAvatarUri(localUri);
    try {
      const fileName = `${userId}.jpg`;
      const response = await fetch(localUri);
      const blob = await response.blob();

      // Verificação extra de segurança, caso fileSize não tenha vindo do picker
      if (blob.size > MAX_AVATAR_SIZE_BYTES) {
        Alert.alert('Imagem muito grande', 'Escolha uma foto de até 5MB.');
        return;
      }

      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
      setAvatarUri(publicUrl);
    } catch (err) {
      logError('ProfileScreen.handlePickAvatar', err);
      Alert.alert('Erro', 'Não foi possível salvar a foto. Tente novamente.');
    }
  }
};

  // ---------------------------------------------------------------------------
  // RENDER — SUBPÁGINAS
  // ---------------------------------------------------------------------------

  // Leaderboard
  const renderLeaderboard = () => (
    <View style={[styles.subpage, { paddingTop: insets.top + 8 }]}>
      <View style={styles.subpageHeader}>
        <TouchableOpacity
          onPress={() => setPage(null)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna à tela de perfil"
        >
          <Text style={styles.subpageBack}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.subpageTitle}>Leaderboard 🏅</Text>
        <View style={{ width: 60 }} />
      </View>
      <Text style={styles.leaderboardSubtitle}>Os maiores streaks do ZEREI</Text>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 40 }}>
        {LEADERBOARD.map((entry, i) => (
          <View
            key={entry.rank}
            style={[
              styles.leaderRow,
              entry.isMe && styles.leaderRowMe,
            ]}
          >
            {entry.rank <= 3 ? (
              <Text style={styles.leaderMedal}>
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
              </Text>
            ) : (
              <View style={[styles.leaderRankBadge, entry.isMe && { backgroundColor: '#3D54D9' }]}>
                <Text style={styles.leaderRankText}>
                  {entry.rank > 9999 ? `${Math.floor(entry.rank / 1000)}k` : entry.rank}
                </Text>
              </View>
            )}
            <Text style={[styles.leaderName, entry.isMe && { color: '#3D54D9', fontFamily: 'Rubik_700Bold' }]}>
              {entry.name}
            </Text>
            <Text style={styles.leaderDays}>{formatStreak(entry.days)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Conquistas — grid completo com todas as badges
  const renderAchievements = () => (
    <View style={[styles.subpage, { paddingTop: insets.top + 8 }]}>
      <View style={styles.subpageHeader}>
        <TouchableOpacity
          onPress={() => setPage(null)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna à tela de perfil"
        >
          <Text style={styles.subpageBack}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.subpageTitle}>Conquistas</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.achievementsGrid, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {BADGE_TIERS.map((tier, index) => {
          const unlocked = userStreak >= tier.minDay;
          const isCurrent = index === getCurrentTierIndex(userStreak);
          const stars = getBadgeStars(userStreak, tier);
          const starOn  = stars > 0 ? STAR_IMAGES.on[stars - 1] : null;
          const starOff = STAR_IMAGES.off[2];
          return (
            <TouchableOpacity
              key={tier.id}
              style={[styles.achievementCard, isCurrent && styles.achievementCardCurrent]}
              activeOpacity={0.8}
              onPress={() => setSelectedBadgeId(tier.id)}
              accessibilityRole="button"
              accessibilityLabel={`Conquista ${tier.label}`}
              accessibilityHint="Abre a explicação dessa conquista"
            >
              {!tier.isLenda && (
                <Image
                  source={unlocked && stars > 0 ? starOn! : starOff}
                  style={styles.achievementStarImg}
                  resizeMode="contain"
                />
              )}
              <Image
                source={unlocked ? tier.imageOn : tier.imageOff}
                style={styles.achievementImg}
                resizeMode="contain"
              />
              <Text style={[styles.badgeLabel, !unlocked && styles.badgeLabelLocked]}>
                {tier.label}
              </Text>
              <Text style={styles.achievementSublabel}>{tier.sublabel}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <BadgeInfoModal
        visible={selectedBadgeId !== null}
        tier={selectedTier}
        unlocked={selectedUnlocked}
        onClose={() => setSelectedBadgeId(null)}
      />
    </View>
  );

  // Settings — menu principal
  const renderSettings = () => (
    <View style={[styles.subpage, { paddingTop: insets.top + 8 }]}>
      <View style={styles.subpageHeader}>
        <TouchableOpacity
          onPress={() => setPage(null)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna à tela de perfil"
        >
          <Text style={styles.subpageBack}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.subpageTitle}>Configurações</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}>
        <View style={styles.settingsGroup}>
          <SettingsRow emoji="👤" label="Meu perfil"        onPress={() => setPage('profile_edit')} />
          <SettingsRow emoji="🔔" label="Notificações"      onPress={() => setPage('notifications')} />
          <SettingsRow emoji="🛟" label="Suporte"           onPress={() => setPage('support')} />
          <SettingsRow emoji="💬" label="Dar feedback"      onPress={() => setPage('feedback')} />
          <SettingsRow emoji="💳" label="Assinatura"        onPress={() => setPage('subscription')} />
          <SettingsRow emoji="•••" label="Mais"             onPress={() => setPage('more')} last />
        </View>
      </ScrollView>
    </View>
  );

  // Editar perfil
  const renderProfileEdit = () => (
    <View style={[styles.subpage, { paddingTop: insets.top + 8 }]}>
      <View style={styles.subpageHeader}>
        <TouchableOpacity
          onPress={() => setPage('settings')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna às configurações"
        >
          <Text style={styles.subpageBack}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.subpageTitle}>Seu perfil</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, gap: 4 }}>
        <View style={styles.profileEditEmailRow}>
          <Text style={styles.profileEditEmailLabel}>Email</Text>
          <Text style={styles.profileEditEmail}>{userEmail}</Text>
        </View>
        <View style={styles.settingsGroup}>
          <SettingsRow emoji="✏️" label="Nome"  sublabel={userName || 'Não informado'} onPress={() => { setEditingValue(userName); setEditingField('nome'); }} />
          <SettingsRow emoji="🎂" label="Idade" sublabel={userAge || 'Não informada'}  onPress={() => { setEditingValue(userAge);  setEditingField('idade'); }} last />
        </View>
        <View style={[styles.settingsGroup, { marginTop: 24 }]}>
          <TouchableOpacity
            style={styles.dangerRow}
            activeOpacity={0.8}
            onPress={() => setDeleteConfirm(true)}
            accessibilityRole="button"
            accessibilityLabel="Deletar perfil e dados"
            accessibilityHint="Abre confirmação para apagar permanentemente seu perfil e todos os dados"
          >
            <Text style={styles.dangerRowText}>Deletar perfil e dados</Text>
          </TouchableOpacity>
           <TouchableOpacity
            style={styles.dangerRow}
            activeOpacity={0.8}
            onPress={() => setLogoutConfirm(true)}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            accessibilityHint="Abre confirmação para encerrar a sessão"
          >
            <Text style={styles.dangerRowText}>Sair da conta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dangerRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.8}
            onPress={() => setLogoutAllConfirm(true)}
            accessibilityRole="button"
            accessibilityLabel="Sair de todos os dispositivos"
            accessibilityHint="Encerra sua sessão neste e em todos os outros aparelhos conectados"
          >
            <Text style={styles.dangerRowText}>Sair de todos os dispositivos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Editar campo */}
      <Modal visible={editingField !== null} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.alertOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>
              {editingField === 'nome' ? 'Editar nome' : 'Editar idade'}
            </Text>
            <TextInput
              style={styles.editFieldInput}
              value={editingValue}
              onChangeText={setEditingValue}
              placeholder={editingField === 'nome' ? 'Seu nome' : 'Sua idade'}
              placeholderTextColor="rgba(255,255,255,0.25)"
              keyboardType={editingField === 'idade' ? 'numeric' : 'default'}
              maxLength={editingField === 'idade' ? 3 : 40}
              autoFocus
            />
            <View style={styles.alertRow}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                activeOpacity={0.8}
                onPress={() => setEditingField(null)}
              >
                <Text style={styles.alertCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertDangerBtn, { backgroundColor: 'rgba(74,156,82,0.15)', borderColor: 'rgba(74,156,82,0.4)' }]}
                activeOpacity={0.8}
                onPress={() => {
                  saveField(editingField!, editingValue);
                  setEditingField(null);
                }}
              >
                <Text style={[styles.alertDangerBtnText, { color: '#4A9C52' }]}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmar deletar */}
      <Modal visible={deleteConfirm} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Deletar perfil e dados</Text>
            <Text style={styles.alertBody}>
              Isso vai apagar seu perfil e todos os seus dados. Tem certeza?
            </Text>
            <TouchableOpacity
            style={[styles.alertDangerBtn, { marginTop: 4, flex: undefined }]}
            activeOpacity={0.8}
            onPress={() => { setDeleteConfirm(false); handleDeleteAccount(); }}
              accessibilityRole="button"
              accessibilityLabel="Confirmar exclusão"
              accessibilityHint="Apaga permanentemente seu perfil e dados"
            >
              <Text style={styles.alertDangerBtnText}>Deletar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
            style={[styles.alertCancelBtn, { marginTop: 4, flex: undefined }]}
            activeOpacity={0.8}
            onPress={() => setDeleteConfirm(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              accessibilityHint="Fecha o modal sem deletar nada"
            >
              <Text style={styles.alertCancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmar logout */}
      <Modal visible={logoutConfirm} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Sair do ZEREI?</Text>
            <Text style={styles.alertBody}>
              Você vai precisar entrar novamente para usar o app.
            </Text>
            <View style={styles.alertRow}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                activeOpacity={0.8}
                onPress={() => setLogoutConfirm(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                accessibilityHint="Fecha o modal e mantém a sessão ativa"
              >
                <Text style={styles.alertCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertDangerBtn}
                activeOpacity={0.8}
                onPress={handleLogout}
                disabled={isLoggingOut}
                accessibilityRole="button"
                accessibilityLabel="Sair"
                accessibilityHint="Encerra a sessão e volta para a tela inicial"
              >
                {isLoggingOut
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.alertDangerBtnText}>Sair</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmar logout de todos os dispositivos */}
      <Modal visible={logoutAllConfirm} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Sair de todos os dispositivos?</Text>
            <Text style={styles.alertBody}>
              Isso encerra sua sessão aqui e em qualquer outro celular ou aparelho onde você estiver logado.
            </Text>
            <View style={styles.alertRow}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                activeOpacity={0.8}
                onPress={() => setLogoutAllConfirm(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                accessibilityHint="Fecha o modal e mantém as sessões ativas"
              >
                <Text style={styles.alertCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertDangerBtn}
                activeOpacity={0.8}
                onPress={() => { setLogoutAllConfirm(false); handleLogoutAll(); }}
                disabled={isLoggingOutAll}
                accessibilityRole="button"
                accessibilityLabel="Sair de todos os dispositivos"
                accessibilityHint="Encerra todas as sessões e volta para a tela inicial"
              >
                {isLoggingOutAll
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.alertDangerBtnText}>Sair de tudo</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // Notificações
  const renderNotifications = () => (
    <View style={[styles.subpage, { paddingTop: insets.top + 8 }]}>
      <View style={styles.subpageHeader}>
        <TouchableOpacity
          onPress={() => setPage('settings')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna às configurações"
        >
          <Text style={styles.subpageBack}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.subpageTitle}>Notificações</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={{ paddingHorizontal: 20, gap: 0 }}>
        <View style={styles.settingsGroup}>
          {[
            { label: 'Ativar notificações',  value: notifEnabled,  set: setNotifEnabled  },
            { label: 'Posts em destaque',     value: notifFeatured, set: setNotifFeatured },
            { label: 'Todos os novos posts',  value: notifAll,      set: setNotifAll      },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.toggleRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.toggleLabel}>{item.label}</Text>
              <Switch
                value={item.value}
                onValueChange={item.set}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#4A9C52' }}
                thumbColor="#FFFFFF"
                accessibilityLabel={item.label}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // Suporte
  const renderSupport = () => (
    <View style={[styles.subpage, { paddingTop: insets.top + 8 }]}>
      <View style={styles.subpageHeader}>
        <TouchableOpacity
          onPress={() => setPage('settings')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna às configurações"
        >
          <Text style={styles.subpageBack}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.subpageTitle}>Suporte</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.settingsGroup}>
          <SettingsRow emoji="🐛" label="Reportar um bug"   onPress={() => Linking.openURL('mailto:suporte@zerei.app?subject=Bug Report')} />
          <SettingsRow emoji="❓" label="FAQ"                onPress={() => Linking.openURL('https://zerei.app/faq')} />
          <SettingsRow emoji="📧" label="Falar com a gente" onPress={() => Linking.openURL('mailto:suporte@zerei.app')} danger last />
        </View>
      </View>
    </View>
  );

  // Feedback
  const renderFeedback = () => (
    <KeyboardAvoidingView
      style={[styles.subpage, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.subpageHeader}>
        <TouchableOpacity
          onPress={() => setPage('settings')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna às configurações"
        >
          <Text style={styles.subpageBack}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.subpageTitle}>Feedback</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={{ paddingHorizontal: 20, gap: 16, flex: 1 }}>
        {feedbackSent ? (
          <View style={styles.feedbackSuccess}>
            <Text style={styles.feedbackSuccessEmoji}>✅</Text>
            <Text style={styles.feedbackSuccessText}>Obrigado por tornar o ZEREI melhor!</Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Conta o que você achou, o que pode melhorar..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              accessibilityLabel="Campo de feedback"
            />
            <Text style={styles.feedbackHint}>
              Feedbacks úteis e detalhados são lidos pela equipe toda semana.
            </Text>
            <TouchableOpacity
              style={[styles.feedbackBtn, { opacity: feedbackText.trim() ? 1 : 0.4 }]}
              activeOpacity={0.8}
              disabled={!feedbackText.trim()}
              onPress={() => { setFeedbackSent(true); setFeedbackText(''); }}
              accessibilityRole="button"
              accessibilityLabel="Enviar feedback"
              accessibilityHint="Envia seu feedback para a equipe do ZEREI"
            >
              <Text style={styles.feedbackBtnText}>Enviar feedback</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );

  // Assinatura
  const renderSubscription = () => (
    <View style={[styles.subpage, { paddingTop: insets.top + 8 }]}>
      <View style={styles.subpageHeader}>
        <TouchableOpacity
          onPress={() => setPage('settings')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna às configurações"
        >
          <Text style={styles.subpageBack}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.subpageTitle}>Assinatura</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        <View style={styles.subscriptionCurrentCard}>
          <Text style={styles.subscriptionCurrentLabel}>Plano atual</Text>
          <Text style={styles.subscriptionCurrentPlan}>Anual — R$ {PRICING.ANNUAL.toFixed(2).replace('.', ',')}/ano</Text>
        </View>
        <View style={styles.settingsGroup}>
          <SettingsRow
            emoji="♾️"
            label="Cancelar assinatura"
            sublabel="Cancele a renovação automática"
            onPress={() => {
              const url = Platform.OS === 'ios'
                ? 'https://apps.apple.com/account/subscriptions'
                : 'https://play.google.com/store/account/subscriptions';
              Linking.openURL(url);
            }}
            danger
            last
          />
        </View>
      </View>
    </View>
  );

  // Mais
  const renderMore = () => (
    <View style={[styles.subpage, { paddingTop: insets.top + 8 }]}>
      <View style={styles.subpageHeader}>
        <TouchableOpacity
          onPress={() => setPage('settings')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna às configurações"
        >
          <Text style={styles.subpageBack}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.subpageTitle}>Mais</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.settingsGroup}>
          <SettingsRow emoji="⭐" label="Avaliar o ZEREI"         onPress={() => Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com/app/id000000000?action=write-review' : 'market://details?id=app.zerei')} />
          <SettingsRow emoji="📜" label="Termos de uso"           onPress={() => Linking.openURL('https://zerei.app/termos')} />
          <SettingsRow emoji="🔒" label="Política de privacidade" onPress={() => Linking.openURL('https://zerei.app/privacidade')} last />
        </View>
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // RENDER SUBPÁGINA ATIVA
  // ---------------------------------------------------------------------------
  const renderSubpage = (): React.ReactElement | null => {
    switch (page) {
      case 'leaderboard':    return renderLeaderboard();
      case 'achievements':   return renderAchievements();
      case 'settings':       return renderSettings();
      case 'profile_edit':   return renderProfileEdit();
      case 'notifications':  return renderNotifications();
      case 'support':        return renderSupport();
      case 'feedback':       return renderFeedback();
      case 'subscription':   return renderSubscription();
      case 'more':           return renderMore();
      default:               return null;
    }
  };

  if (page !== null) {
    return renderSubpage();
  }

  // ---------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ---------------------------------------------------------------------------
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

 
  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >

        {/* ── Header — Avatar + Nome + Ações ── */}
        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderTop}>
            {/* Avatar com anel pulsante */}
            <TouchableOpacity
              style={styles.avatarContainer}
              activeOpacity={0.8}
              onPress={handlePickAvatar}
            >
              <Animated.View style={[styles.avatarRing, { borderColor: ringColor }]} />
              {avatarUri ? (
                <View style={{ width: 76, height: 76, borderRadius: 38, overflow: 'hidden' }}>
                  <Image source={{ uri: avatarUri }} style={{ width: 76, height: 76 }} />
                </View>
              ) : (
                <Avatar name={userName || '?'} size={76} />
              )}
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditBadgeText}>📷</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.profileHeaderInfo}>
              <Text style={styles.profileName}>{userName || 'Usuário'}</Text>
              <TouchableOpacity
                style={styles.editProfileBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (isProcessingNav.current) return;
                  isProcessingNav.current = true;
                  setPage('profile_edit');
                  setTimeout(() => { isProcessingNav.current = false; }, 500);
                }}
                accessibilityRole="button"
                accessibilityLabel="Editar perfil"
                accessibilityHint="Abre a tela de edição do seu perfil"
              >
                <Text style={styles.editProfileBtnText}>✏️  Editar perfil</Text>
              </TouchableOpacity>
            </View>

            {/* Ícone de configurações */}
            <TouchableOpacity
              style={styles.settingsBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (isProcessingNav.current) return;
                isProcessingNav.current = true;
                setPage('settings');
                setTimeout(() => { isProcessingNav.current = false; }, 500);
              }}
              accessibilityRole="button"
              accessibilityLabel="Configurações"
              accessibilityHint="Abre o menu de configurações"
            >
              <Text style={styles.settingsBtnText}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* removido card de nível */}
        </View>

        {/* ── Badges — scroll horizontal ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Conquistas</Text>
            <TouchableOpacity
              onPress={() => {
                if (isProcessingNav.current) return;
                isProcessingNav.current = true;
                setPage('achievements');
                setTimeout(() => { isProcessingNav.current = false; }, 500);
              }}
              accessibilityRole="button"
              accessibilityLabel="Ver todas as conquistas"
              accessibilityHint="Abre a tela com todas as badges e explicações"
            >
              <Text style={styles.sectionMore}>Ver ›</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={badgesScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScroll}
          >
            {BADGE_TIERS.map((tier, index) => {
              const unlocked = userStreak >= tier.minDay;
              const isCurrent = index === getCurrentTierIndex(userStreak);
              const stars = getBadgeStars(userStreak, tier);
              const starOn  = stars > 0 ? STAR_IMAGES.on[stars - 1]  : null;
              const starOff = STAR_IMAGES.off[2];
              return (
                <TouchableOpacity
                  key={tier.id}
                  style={[styles.badgeItem, isCurrent && styles.badgeItemCurrent]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedBadgeId(tier.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Conquista ${tier.label}`}
                  accessibilityHint="Abre a explicação dessa conquista"
                >
                  {/* Estrelas acima da badge (tiers 1-5 apenas) */}
                  {!tier.isLenda && (
                    <View style={styles.badgeStarsRow}>
                      <Image
                        source={unlocked && stars > 0 ? starOn! : starOff}
                        style={styles.badgeStarImg}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  {/* Imagem da badge — a atual fica maior e com destaque */}
                  <Image
                    source={unlocked ? tier.imageOn : tier.imageOff}
                    style={[styles.badgeImg, isCurrent && styles.badgeImgCurrent]}
                    resizeMode="contain"
                  />
                  {/* Nome e sublabel */}
                  <Text style={[
                    styles.badgeLabel,
                    !unlocked && styles.badgeLabelLocked,
                    isCurrent && styles.badgeLabelCurrent,
                  ]}>
                    {tier.label}
                  </Text>
                  {tier.isLenda && (
                    <Text style={styles.badgeLenda}>LENDA</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Stats ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suas estatísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient colors={['rgba(242,122,94,0.2)', 'rgba(242,122,94,0.05)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{userStreak}</Text>
              <Text style={styles.statLabel}>Streak atual</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient colors={['rgba(61,84,217,0.2)', 'rgba(61,84,217,0.05)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.statEmoji}>⏳</Text>
              <Text style={styles.statValue}>{Math.max(0, STREAK.MAX_DAYS - userStreak)}</Text>
              <Text style={styles.statLabel}>Dias para 90</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient colors={['rgba(74,156,82,0.2)', 'rgba(74,156,82,0.05)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.statEmoji}>📅</Text>
              <Text style={styles.statValue}>{userJoinedDays}</Text>
              <Text style={styles.statLabel}>Dias no ZEREI</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient colors={['rgba(245,197,24,0.15)', 'rgba(245,197,24,0.03)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.statEmoji}>📊</Text>
              <Text style={[styles.statValue, { color: userRelapses === 0 ? '#4A9C52' : '#F27A5E' }]}>
                {userRelapses}
              </Text>
              <Text style={styles.statLabel}>Recaídas</Text>
            </View>
          </View>
        </View>

        {/* ── Leaderboard preview ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionTitleRow}
            activeOpacity={0.8}
            onPress={() => {
              if (isProcessingNav.current) return;
              isProcessingNav.current = true;
              setPage('leaderboard');
              setTimeout(() => { isProcessingNav.current = false; }, 500);
            }}
            accessibilityRole="button"
            accessibilityLabel="Ver leaderboard completo"
            accessibilityHint="Abre a lista completa de rankings por streak"
          >
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <Text style={styles.sectionMore}>Ver tudo ›</Text>
          </TouchableOpacity>
          <View style={styles.leaderCard}>
            {LEADERBOARD.slice(0, 3).map((entry) => (
              <View key={entry.rank} style={styles.leaderRow}>
                <Text style={styles.leaderMedal}>
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                </Text>
                <Text style={styles.leaderName}>{entry.name}</Text>
                <Text style={styles.leaderDays}>{formatStreak(entry.days)}</Text>
              </View>
            ))}
            {/* Posição do usuário */}
            <View style={[styles.leaderRow, styles.leaderRowMe, { marginTop: 8 }]}>
              <View style={[styles.leaderRankBadge, { backgroundColor: '#3D54D9' }]}>
                <Text style={styles.leaderRankText}>9.8k</Text>
              </View>
              <Text style={[styles.leaderName, { color: '#3D54D9', fontFamily: 'Rubik_700Bold' }]}>Você</Text>
              <Text style={styles.leaderDays}>{formatStreak(userStreak)}</Text>
            </View>
          </View>
        </View>

        {/* ── Card de indicação ── */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleShare}
            disabled={isSharing}
            accessibilityRole="button"
            accessibilityLabel="Indicar um amigo"
            accessibilityHint="Compartilha seu código de indicação para convidar amigos"
          >
            <LinearGradient
              colors={['#1A2A6A', '#293CA6', '#3D54D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.referralCard}
            >
              <View style={styles.referralTop}>
                <Text style={styles.referralTitle}>Indique um amigo</Text>
                <Text style={styles.referralSubtitle}>Ajude alguém a começar a jornada</Text>
              </View>
              <View style={styles.referralCodeRow}>
                <View style={styles.referralCodeBox}>
                  <Text style={styles.referralCodeLabel}>Seu código</Text>
                  <Text style={styles.referralCode}>{referralCode}</Text>
                </View>
                <View style={styles.referralShareBtn}>
                  {isSharing
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Text style={styles.referralShareBtnText}>Compartilhar ↗</Text>
                  }
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <BadgeInfoModal
        visible={selectedBadgeId !== null}
        tier={selectedTier}
        unlocked={selectedUnlocked}
        onClose={() => setSelectedBadgeId(null)}
      />
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
  scroll: {
    gap: 24,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  profileHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
  },
  profileHeaderInfo: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  editProfileBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontFamily: 'Rubik_500Medium',
    color: 'rgba(255,255,255,0.6)',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: {
    fontSize: 20,
  },

  // Nível
  levelCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelEmoji: {
    fontSize: 28,
  },
  levelInfo: {
    flex: 1,
    gap: 6,
  },
  levelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelName: {
    fontSize: 15,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
  },
  levelNext: {
    fontSize: 12,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.35)',
  },
  levelBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: '#3D54D9',
    borderRadius: 3,
  },
  levelDays: {
    fontSize: 11,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.35)',
  },

  // ── Seções ────────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Rubik_700Bold',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionMore: {
    fontSize: 13,
    fontFamily: 'Rubik_500Medium',
    color: '#3D54D9',
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  badgesScroll: {
    gap: 12,
    paddingRight: 20,
    alignItems: 'flex-end',
  },
  badgeItem: {
    width: 88,
    alignItems: 'center',
    gap: 4,
  },
  badgeStarsRow: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  badgeStarImg: {
    width: 72,
    height: 24,
  },
  badgeImg: {
    width: 80,
    height: 80,
  },
  badgeLabel: {
    fontSize: 10,
    fontFamily: 'Rubik_600SemiBold',
    color: '#E0EAFF',
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: 'rgba(255,255,255,0.3)',
  },
  badgeLenda: {
    fontSize: 8,
    fontFamily: 'Rubik_700Bold',
    color: '#F5C518',
    letterSpacing: 1,
    textAlign: 'center',
  },
  badgeItemCurrent: {
    width: 104,
  },
  badgeImgCurrent: {
    width: 96,
    height: 96,
  },
  badgeLabelCurrent: {
    color: '#3D54D9',
    fontFamily: 'Rubik_700Bold',
  },
  badgeModalIconWrap: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  badgeModalImg: {
    width: 96,
    height: 96,
  },
  badgeModalCloseBtn: {
    backgroundColor: 'rgba(61,84,217,0.18)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.4)',
  },
  badgeModalCloseBtnText: {
    fontSize: 15,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  achievementCard: {
    width: '31%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  achievementCardCurrent: {
    borderColor: '#3D54D9',
    borderWidth: 1.5,
  },
  achievementStarImg: {
    width: 54,
    height: 18,
    marginBottom: 2,
  },
  achievementImg: {
    width: 64,
    height: 64,
    marginBottom: 4,
  },
  achievementSublabel: {
    fontSize: 10,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Rubik_500Medium',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },

  // ── Leaderboard ───────────────────────────────────────────────────────────
  leaderCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaderRowMe: {
    backgroundColor: 'rgba(61,84,217,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.25)',
  },
  leaderMedal: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  leaderRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderRankText: {
    fontSize: 10,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
  },
  leaderName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Rubik_500Medium',
    color: '#FFFFFF',
  },
  leaderDays: {
    fontSize: 14,
    fontFamily: 'Rubik_600SemiBold',
    color: 'rgba(255,255,255,0.5)',
  },
  leaderboardSubtitle: {
    fontSize: 13,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  // ── Referral ──────────────────────────────────────────────────────────────
  referralCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  referralTop: {
    gap: 4,
  },
  referralTitle: {
    fontSize: 18,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
  },
  referralSubtitle: {
    fontSize: 13,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  referralCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  referralCodeBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  referralCodeLabel: {
    fontSize: 10,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  referralCode: {
    fontSize: 22,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  referralShareBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  referralShareBtnText: {
    fontSize: 13,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
  },

  // ── Subpáginas ────────────────────────────────────────────────────────────
  subpage: {
    flex: 1,
    backgroundColor: colors.background,
  },
  subpageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  subpageBack: {
    fontSize: 14,
    fontFamily: 'Rubik_500Medium',
    color: 'rgba(255,255,255,0.5)',
    width: 80,
  },
  subpageTitle: {
    fontSize: 17,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Settings rows
  settingsGroup: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 14,
  },
  settingsRowEmoji: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  settingsRowContent: {
    flex: 1,
    gap: 2,
  },
  settingsRowLabel: {
    fontSize: 15,
    fontFamily: 'Rubik_500Medium',
    color: '#FFFFFF',
  },
  settingsRowSublabel: {
    fontSize: 12,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.35)',
  },
  settingsRowChevron: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.25)',
    fontFamily: 'Rubik_400Regular',
  },

  // Toggle rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: 'Rubik_500Medium',
    color: '#FFFFFF',
  },

  // Profile edit
  profileEditEmailRow: {
    paddingHorizontal: 4,
    paddingBottom: 16,
    gap: 2,
  },
  profileEditEmailLabel: {
    fontSize: 11,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
  },
  profileEditEmail: {
    fontSize: 14,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  dangerRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dangerRowText: {
    fontSize: 15,
    fontFamily: 'Rubik_500Medium',
    color: colors.danger,
  },

  // Alerts
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  alertBox: {
    backgroundColor: '#1A2240',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertTitle: {
    fontSize: 18,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  alertBody: {
    fontSize: 14,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 21,
  },
  alertRow: {
    flexDirection: 'row',
    gap: 10,
  },
  alertDangerBtn: {
    flex: 1,
    backgroundColor: 'rgba(192,57,43,0.15)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.4)',
  },
  alertDangerBtnText: {
    fontSize: 15,
    fontFamily: 'Rubik_600SemiBold',
    color: colors.danger,
  },
  alertCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  alertCancelBtnText: {
    fontSize: 15,
    fontFamily: 'Rubik_600SemiBold',
    color: 'rgba(255,255,255,0.6)',
  },

  // Feedback
  feedbackInput: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Rubik_400Regular',
    color: '#FFFFFF',
    minHeight: 180,
    textAlignVertical: 'top',
  },
  feedbackHint: {
    fontSize: 12,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 18,
  },
  feedbackBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  feedbackBtnText: {
    fontSize: 16,
    fontFamily: 'Rubik_600SemiBold',
    color: colors.background,
  },
  feedbackSuccess: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  feedbackSuccessEmoji: {
    fontSize: 48,
  },
  feedbackSuccessText: {
    fontSize: 16,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Subscription
  subscriptionCurrentCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.3)',
    padding: 16,
    gap: 4,
  },
  subscriptionCurrentLabel: {
    fontSize: 11,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
  },
  subscriptionCurrentPlan: {
    fontSize: 17,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3D54D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadgeText: {
    fontSize: 12,
  },
  editFieldInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Rubik_400Regular',
    color: '#FFFFFF',
  },
});
