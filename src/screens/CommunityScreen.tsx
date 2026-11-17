import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { logError } from '../utils/logger';
import { colors } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// SEU USER ID DE OWNER — troque pelo seu ID real do Supabase
// ---------------------------------------------------------------------------
const OWNER_ID = '1cd5abdb-30de-44bc-8755-56c6f86df5dd';

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------
type Tab    = 'forum' | 'teams' | 'friends';
type Filter = 'novo' | 'streak' | 'destaque';

interface Comment {
  id: string;
  authorId: string;
  author: string;
  streakDays: number;
  body: string;
  timeAgo: string;
}

interface Post {
  id: string;
  authorId: string;
  author: string;
  streakDays: number;
  timeAgo: string;
  title: string;
  body: string;
  upvotes: number;
  upvotedByMe: boolean;
  supportCount: number;
  commentCount: number;
  comments: Comment[];
  isConquest?: boolean;
}

interface TeamMessage {
  id: string;
  userId: string;
  author: string;
  streakDays: number;
  body: string;
  timeAgo: string;
  isAdmin?: boolean;
}

interface Team {
  id: string;
  name: string;
  description: string;
  emoji: string;
  members: number;
  joined: boolean;
  adminName: string;
  fakeMessages: TeamMessage[];
}

interface Friend {
  id: string;
  name: string;
  streakDays: number;
  status: 'accepted' | 'pending_sent' | 'pending_received';
}

// ---------------------------------------------------------------------------
// MENSAGENS FAKE POR GRUPO
// ---------------------------------------------------------------------------
const FAKE_MESSAGES: Record<string, TeamMessage[]> = {
  'recomeco': [
    { id: 'f1', author: 'Rafael Admin', streakDays: 0, body: 'Bem-vindo ao Recomeço Diário! Aqui ninguém julga. Cada dia é uma nova chance.', timeAgo: '3d atrás', isAdmin: true },
    { id: 'f2', author: 'Marcos', streakDays: 1, body: 'Dia 1 de novo pra mim. Caí ontem mas hoje me levantei cedo e vim aqui primeiro.', timeAgo: '2d atrás' },
    { id: 'f3', author: 'João Pedro', streakDays: 3, body: 'Dia 3! Pequeno mas já sinto diferença no sono.', timeAgo: '1d atrás' },
    { id: 'f4', author: 'Felipe', streakDays: 0, body: 'Acabei de instalar o app. Nunca falei sobre isso com ninguém. Bom saber que não sou o único.', timeAgo: '14h atrás' },
    { id: 'f5', author: 'Rafael Admin', streakDays: 0, body: 'Felipe, você deu o passo mais difícil que é reconhecer. Estamos aqui.', timeAgo: '13h atrás', isAdmin: true },
    { id: 'f6', author: 'Caio', streakDays: 7, body: '1 semana! Quem diria que chegar na semana 1 fosse tão difícil. Valeu galera.', timeAgo: '6h atrás' },
  ],
  'maratona90': [
    { id: 'f1', author: 'Bruno Admin', streakDays: 90, body: 'Grupo dos guerreiros. Aqui é foco total nos 90 dias. Sem desculpa, sem recaída.', timeAgo: '5d atrás', isAdmin: true },
    { id: 'f2', author: 'Thiago', streakDays: 45, body: 'Dia 45. Metade do caminho. O desejo ainda aparece mas já não controla mais.', timeAgo: '4d atrás' },
    { id: 'f3', author: 'André', streakDays: 32, body: 'Semana 4 concluída. O treino na academia ajudou muito nesses dias.', timeAgo: '3d atrás' },
    { id: 'f4', author: 'Rodrigo', streakDays: 61, body: 'Dia 61. Dormindo melhor, mais focado no trabalho. Parece que o cérebro voltou a funcionar.', timeAgo: '2d atrás' },
    { id: 'f5', author: 'Bruno Admin', streakDays: 90, body: 'Rodrigo isso é exatamente o que acontece. Após 60 dias o rewiring começa a ser real.', timeAgo: '1d atrás', isAdmin: true },
    { id: 'f6', author: 'Leonardo', streakDays: 88, body: 'Dia 88. Dois dias pra marca histórica. Não acredito que cheguei até aqui.', timeAgo: '5h atrás' },
  ],
  'menteafiada': [
    { id: 'f1', author: 'Daniel Admin', streakDays: 120, body: 'Bem-vindos. Aqui compartilhamos técnicas reais de controle mental. Sem achismo, só o que funciona.', timeAgo: '6d atrás', isAdmin: true },
    { id: 'f2', author: 'Gustavo', streakDays: 22, body: 'A técnica 4-7-8 do app salvou minha noite ontem. Sério, 3 ciclos e o impulso foi embora.', timeAgo: '4d atrás' },
    { id: 'f3', author: 'Paulo', streakDays: 55, body: 'Meditação matinal por 10 minutos mudou minha relação com os gatilhos. Recomendo muito.', timeAgo: '3d atrás' },
    { id: 'f4', author: 'Daniel Admin', streakDays: 120, body: 'Paulo tem razão. Meditação cedo é a diferença entre reagir e responder ao impulso.', timeAgo: '2d atrás', isAdmin: true },
    { id: 'f5', author: 'Victor', streakDays: 14, body: 'Dica: quando o impulso vier, vai fazer flexão até cansar. Funcionou pra mim hoje.', timeAgo: '1d atrás' },
    { id: 'f6', author: 'Lucas', streakDays: 38, body: 'App de meditação + ZEREI = combinação perfeita. Nunca fui tão consistente.', timeAgo: '3h atrás' },
  ],
  'noitedificil': [
    { id: 'f1', author: 'Mateus Admin', streakDays: 75, body: 'Esse grupo existe pra noite. Sempre tem alguém aqui. Você não está sozinho.', timeAgo: '7d atrás', isAdmin: true },
    { id: 'f2', author: 'Igor', streakDays: 5, body: 'Meia noite e o impulso veio forte. Abri o app e vim aqui. Ajuda saber que tem gente.', timeAgo: '3d atrás' },
    { id: 'f3', author: 'Mateus Admin', streakDays: 75, body: 'Igor boa escolha. Fica aqui, conversa, passa o tempo. O impulso dura 15min.', timeAgo: '3d atrás', isAdmin: true },
    { id: 'f4', author: 'Henrique', streakDays: 19, body: '1h da manhã insônia total. Mas não recaí. Joguei Blocos no app por 20min e passou.', timeAgo: '2d atrás' },
    { id: 'f5', author: 'Rafael', streakDays: 8, body: 'Sexta à noite sempre foi meu gatilho. Hoje fiz diferente, vim aqui primeiro.', timeAgo: '22h atrás' },
    { id: 'f6', author: 'Diego', streakDays: 12, body: 'É quase meia noite. Quem tiver acordado manda um sinal. Precisando de apoio hoje.', timeAgo: '1h atrás' },
  ],
  'paisemarido': [
    { id: 'f1', author: 'Carlos Admin', streakDays: 200, body: 'Aqui é pra quem tem família e sabe o peso da responsabilidade. Recuperar é um ato de amor.', timeAgo: '8d atrás', isAdmin: true },
    { id: 'f2', author: 'Fábio', streakDays: 30, body: 'Minha filha de 4 anos veio me dar um abraço hoje de manhã. Esse é o motivo real.', timeAgo: '5d atrás' },
    { id: 'f3', author: 'Ricardo', streakDays: 47, body: 'Minha esposa percebeu que estou mais presente. Ela não sabe do app mas perguntou o que mudou.', timeAgo: '4d atrás' },
    { id: 'f4', author: 'Carlos Admin', streakDays: 200, body: 'Ricardo isso é o maior prêmio que existe. Continua.', timeAgo: '3d atrás', isAdmin: true },
    { id: 'f5', author: 'Marcelo', streakDays: 15, body: 'Casei faz 2 anos e nunca contei isso pra ninguém. Aqui me sinto seguro pra falar.', timeAgo: '2d atrás' },
    { id: 'f6', author: 'Sergio', streakDays: 63, body: 'Dia 63. Fui ao parque com meu filho hoje sem o celular. Coisa mais simples e mais importante.', timeAgo: '4h atrás' },
  ],
};

// Chave do grupo para buscar as mensagens fake
const TEAM_MSG_KEY: Record<string, string> = {
  'Recomeço Diário': 'recomeco',
  'Maratona 90 Dias': 'maratona90',
  'Mente Afiada': 'menteafiada',
  'Noite Difícil': 'noitedificil',
  'Pais e Marido': 'paisemarido',
};

const TEAM_ADMIN: Record<string, string> = {
  'Recomeço Diário': 'Rafael Admin',
  'Maratona 90 Dias': 'Bruno Admin',
  'Mente Afiada': 'Daniel Admin',
  'Noite Difícil': 'Mateus Admin',
  'Pais e Marido': 'Carlos Admin',
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const AVATAR_COLORS = ['#3D54D9', '#F27A5E', '#4A9C52', '#F5C518', '#9B59B6', '#E67E22'];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function timeAgoFromDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function calcStreak(startDate: string | null): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const color = avatarColor(name);
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color + '30',
      borderWidth: 1.5, borderColor: color + '60',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.42, fontFamily: 'Rubik_700Bold', color }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function StreakBadge({ days }: { days: number }) {
  return (
    <View style={styles.streakBadge}>
      <Text style={styles.streakBadgeText}>🔥 {days}d</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
export default function CommunityScreen() {
  const insets = useSafeAreaInsets();

  const [myId, setMyId]         = useState<string | null>(null);
  const [myName, setMyName]     = useState('');
  const [myStreak, setMyStreak] = useState(0);

  const [tab, setTab]       = useState<Tab>('forum');
  const [filter, setFilter] = useState<Filter>('novo');

  const [posts, setPosts]     = useState<Post[]>([]);
  const [teams, setTeams]     = useState<Team[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  const [loadingPosts, setLoadingPosts]     = useState(true);
  const [loadingTeams, setLoadingTeams]     = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const [selectedPost, setSelectedPost]             = useState<Post | null>(null);
  const [postModalVisible, setPostModalVisible]     = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [profileUser, setProfileUser]               = useState<{ id: string; name: string; streakDays: number; posts: Post[] } | null>(null);
  const [profileVisible, setProfileVisible]         = useState(false);
  const [filterVisible, setFilterVisible]           = useState(false);

  // Estado do grupo aberto
  const [selectedTeam, setSelectedTeam]           = useState<Team | null>(null);
  const [teamModalVisible, setTeamModalVisible]   = useState(false);
  const [teamMessages, setTeamMessages]           = useState<TeamMessage[]>([]);
  const [teamMsgText, setTeamMsgText]             = useState('');
  const [submittingTeamMsg, setSubmittingTeamMsg] = useState(false);

  // Criar grupo
  const [createTeamVisible, setCreateTeamVisible] = useState(false);
  const [newTeamName, setNewTeamName]             = useState('');
  const [newTeamDesc, setNewTeamDesc]             = useState('');
  const [newTeamEmoji, setNewTeamEmoji]           = useState('👥');
  const [submittingTeam, setSubmittingTeam]       = useState(false);

  const isProcessing = useRef(false);

  const [newTitle, setNewTitle]           = useState('');
  const [newBody, setNewBody]             = useState('');
  const [isConquestNew, setIsConquestNew] = useState(false);
  const [submitting, setSubmitting]       = useState(false);

  const [commentText, setCommentText]               = useState('');
  const [submittingComment, setSubmittingComment]   = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isOwner = myId === OWNER_ID;

  function handlePress(fn: () => void, delay = 500) {
    if (isProcessing.current) return;
    isProcessing.current = true;
    fn();
    setTimeout(() => { isProcessing.current = false; }, delay);
  }

  // ---------------------------------------------------------------------------
  // CARREGAR SESSÃO
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const init = async (tentativa = 0) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (tentativa < 8) setTimeout(() => init(tentativa + 1), 1500);
          return;
        }
        setMyId(session.user.id);

const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, streak_start_date')
  .eq('id', session.user.id)
  .single();

setMyName(profile?.full_name ?? 'Você');
setMyStreak(calcStreak(profile?.streak_start_date ?? null));

      } catch (error) {
        logError('CommunityScreen.init', error);
      }
    };
    init();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // ---------------------------------------------------------------------------
  // CARREGAR POSTS
  // ---------------------------------------------------------------------------
  const loadPosts = useCallback(async () => {
    if (!myId) return;
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, user_id, title, body, upvotes, support_count, is_conquest, created_at,
          profiles!posts_user_id_fkey(full_name, streak_start_date),
          likes(user_id),
          comments(id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: Post[] = (data ?? []).map((p: any) => ({
        id: p.id,
        authorId: p.user_id,
        author: p.profiles?.full_name ?? 'Anônimo',
        streakDays: calcStreak(p.profiles?.streak_start_date ?? null),
        timeAgo: timeAgoFromDate(p.created_at),
        title: p.title,
        body: p.body ?? '',
        upvotes: p.upvotes ?? 0,
        upvotedByMe: (p.likes ?? []).some((l: any) => l.user_id === myId),
        supportCount: p.support_count ?? 0,
        commentCount: (p.comments ?? []).length,
        comments: [],
        isConquest: p.is_conquest ?? false,
      }));

      setPosts(mapped);
    } catch (error) {
      logError('CommunityScreen.loadPosts', error);
    } finally {
      setLoadingPosts(false);
    }
  }, [myId]);

  useEffect(() => { if (myId) loadPosts(); }, [myId, loadPosts]);

  // ---------------------------------------------------------------------------
  // CARREGAR COMENTÁRIOS
  // ---------------------------------------------------------------------------
  const loadComments = useCallback(async (postId: string): Promise<Comment[]> => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, user_id, body, created_at,
          profiles!comments_user_id_fkey(full_name, streak_start_date)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((c: any) => ({
        id: c.id,
        authorId: c.user_id,
        author: c.profiles?.full_name ?? 'Anônimo',
        streakDays: calcStreak(c.profiles?.streak_start_date ?? null),
        body: c.body,
        timeAgo: timeAgoFromDate(c.created_at),
      }));
    } catch (error) {
      logError('CommunityScreen.loadComments', error);
      return [];
    }
  }, []);

  // ---------------------------------------------------------------------------
  // CARREGAR GRUPOS
  // ---------------------------------------------------------------------------
  const loadTeams = useCallback(async () => {
    if (!myId) return;
    setLoadingTeams(true);
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, description, emoji');

      if (teamsError) throw teamsError;

      const { data: membersData } = await supabase
        .from('team_members')
        .select('team_id');

      const { data: myTeams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', myId);

      const myTeamIds = new Set((myTeams ?? []).map((m: any) => m.team_id));

      const memberCount: Record<string, number> = {};
      (membersData ?? []).forEach((m: any) => {
        memberCount[m.team_id] = (memberCount[m.team_id] ?? 0) + 1;
      });

      const mapped: Team[] = (teamsData ?? []).map((t: any) => {
        const msgKey = TEAM_MSG_KEY[t.name] ?? '';
        return {
          id: t.id,
          name: t.name,
          description: t.description ?? '',
          emoji: t.emoji ?? '👥',
          members: memberCount[t.id] ?? 0,
          joined: myTeamIds.has(t.id),
          adminName: TEAM_ADMIN[t.name] ?? 'Admin',
          fakeMessages: FAKE_MESSAGES[msgKey] ?? [],
        };
      });

      setTeams(mapped);
    } catch (error) {
      logError('CommunityScreen.loadTeams', error);
    } finally {
      setLoadingTeams(false);
    }
  }, [myId]);

  useEffect(() => { if (myId) loadTeams(); }, [myId, loadTeams]);

  // ---------------------------------------------------------------------------
  // CARREGAR AMIGOS
  // ---------------------------------------------------------------------------
  const loadFriends = useCallback(async () => {
    if (!myId) return;
    setLoadingFriends(true);
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id, requester_id, addressee_id, status,
          requester:profiles!friendships_requester_id_fkey(full_name, streak_start_date),
          addressee:profiles!friendships_addressee_id_fkey(full_name, streak_start_date)
        `)
        .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);

      if (error) throw error;

      const mapped: Friend[] = (data ?? []).map((f: any) => {
        const isRequester = f.requester_id === myId;
        const otherProfile = isRequester ? f.addressee : f.requester;
        const otherId = isRequester ? f.addressee_id : f.requester_id;

        let status: Friend['status'];
        if (f.status === 'accepted') status = 'accepted';
        else if (isRequester) status = 'pending_sent';
        else status = 'pending_received';

        return {
          id: otherId,
          name: otherProfile?.full_name ?? 'Anônimo',
          streakDays: calcStreak(otherProfile?.streak_start_date ?? null),
          status,
        };
      });

      setFriends(mapped);
    } catch (error) {
      logError('CommunityScreen.loadFriends', error);
    } finally {
      setLoadingFriends(false);
    }
  }, [myId]);

  useEffect(() => { if (myId) loadFriends(); }, [myId, loadFriends]);

  // ---------------------------------------------------------------------------
  // ABRIR GRUPO
  // ---------------------------------------------------------------------------
  const openTeam = useCallback(async (team: Team) => {
    setSelectedTeam(team);
    setTeamModalVisible(true);
    setTeamMessages([]);
  
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select('id, user_id, body, created_at, profiles(full_name)')
        .eq('team_id', team.id)
        .order('created_at', { ascending: true });
  
      if (error) throw error;
  
      const realMessages: TeamMessage[] = (data ?? []).map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        author: m.profiles?.full_name ?? 'Usuário',
        streakDays: 0,
        body: m.body,
        timeAgo: 'agora',
        isAdmin: m.user_id === OWNER_ID,
      }));
  
      setTeamMessages(realMessages);
    } catch (error) {
      logError('CommunityScreen.openTeam', error);
      Alert.alert('Erro', 'Não foi possível carregar as mensagens do grupo.');
    }
  }, []);

  // ---------------------------------------------------------------------------
  // ENTRAR / SAIR DO GRUPO
  // ---------------------------------------------------------------------------
  const toggleTeam = useCallback(async (teamId: string) => {
    if (!myId) return;
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    setTeams(prev => prev.map(t => t.id !== teamId ? t : {
      ...t,
      joined: !t.joined,
      members: t.joined ? t.members - 1 : t.members + 1,
    }));

    try {
      if (team.joined) {
        await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', myId);
      } else {
        await supabase.from('team_members').insert({ team_id: teamId, user_id: myId });
      }
    } catch (error: any) {
      logError('CommunityScreen.toggleTeam', error);
      setTeams(prev => prev.map(t => t.id !== teamId ? t : {
        ...t, joined: team.joined, members: team.members,
      }));
      if (error?.code === '42501' || error?.message?.includes('row-level security')) {
        Alert.alert('Acesso restrito', 'Sua conta está suspensa da comunidade e não pode entrar em grupos.');
      }
    }
  }, [myId, teams]);

  // ---------------------------------------------------------------------------
  // ENVIAR MENSAGEM NO GRUPO
  // ---------------------------------------------------------------------------
  const sendTeamMessage = useCallback(async () => {
    const text = teamMsgText.trim().slice(0, 1000);
    if (!text || !selectedTeam || !myId) return;
    setSubmittingTeamMsg(true);
  
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .insert({ team_id: selectedTeam.id, user_id: myId, body: text })
        .select('id')
        .single();
  
      if (error) throw error;
  
      const newMsg: TeamMessage = {
        id: data.id,
        userId: myId,
        author: myName || 'Você',
        streakDays: myStreak,
        body: text,
        timeAgo: 'agora',
        isAdmin: myId === OWNER_ID,
      };
  
      setTeamMessages(prev => [...prev, newMsg]);
      setTeamMsgText('');
      Keyboard.dismiss();
    } catch (error: any) {
      logError('CommunityScreen.sendTeamMessage', error);
      if (error?.code === '42501' || error?.message?.includes('row-level security')) {
        Alert.alert('Acesso restrito', 'Sua conta está suspensa da comunidade e não pode enviar mensagens.');
      } else {
        Alert.alert('Erro', 'Não foi possível enviar sua mensagem. Tente novamente.');
      }
    } finally {
      setSubmittingTeamMsg(false);
    }
  }, [teamMsgText, selectedTeam, myName, myStreak, myId]);

  // ---------------------------------------------------------------------------
  // CRIAR GRUPO
  // ---------------------------------------------------------------------------
  const submitNewTeam = useCallback(async () => {
    if (!newTeamName.trim() || !myId) return;
    setSubmittingTeam(true);

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          description: newTeamDesc.trim(),
          emoji: newTeamEmoji,
          created_by: myId,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Entrar automaticamente como admin/membro
      await supabase.from('team_members').insert({
        team_id: data.id,
        user_id: myId,
        role: 'admin',
      });

      const newTeam: Team = {
        id: data.id,
        name: newTeamName.trim(),
        description: newTeamDesc.trim(),
        emoji: newTeamEmoji,
        members: 1,
        joined: true,
        adminName: myName,
        fakeMessages: [],
      };

      setTeams(prev => [...prev, newTeam]);
      setNewTeamName('');
      setNewTeamDesc('');
      setNewTeamEmoji('👥');
      setCreateTeamVisible(false);
    } catch (error) {
      logError('CommunityScreen.submitNewTeam', error);
      Alert.alert('Erro', 'Não foi possível criar o grupo. Tente novamente.');
    } finally {
      setSubmittingTeam(false);
    }
  }, [newTeamName, newTeamDesc, newTeamEmoji, myId, myName]);

  // ---------------------------------------------------------------------------
  // EXCLUIR GRUPO (só owner)
  // ---------------------------------------------------------------------------
  const deleteTeam = useCallback(async (teamId: string) => {
    if (!isOwner) return;
    Alert.alert('Excluir grupo', 'Tem certeza? Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('team_members').delete().eq('team_id', teamId);
            await supabase.from('teams').delete().eq('id', teamId);
            setTeams(prev => prev.filter(t => t.id !== teamId));
            setTeamModalVisible(false);
          } catch (error) {
            logError('CommunityScreen.deleteTeam', error);
          }
        },
      },
    ]);
  }, [isOwner]);

  // ---------------------------------------------------------------------------
  // AÇÕES — POSTS
  // ---------------------------------------------------------------------------
  const toggleUpvote = useCallback(async (postId: string) => {
    if (!myId) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const wasUpvoted = post.upvotedByMe;
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p, upvotedByMe: !wasUpvoted,
      upvotes: wasUpvoted ? p.upvotes - 1 : p.upvotes + 1,
    }));
    if (selectedPost?.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev, upvotedByMe: !wasUpvoted,
        upvotes: wasUpvoted ? prev.upvotes - 1 : prev.upvotes + 1,
      } : null);
    }

    try {
      if (wasUpvoted) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', myId);
        await supabase.from('posts').update({ upvotes: post.upvotes - 1 }).eq('id', postId);
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: myId });
        await supabase.from('posts').update({ upvotes: post.upvotes + 1 }).eq('id', postId);
      }
    } catch (error) {
      logError('CommunityScreen.toggleUpvote', error);
      setPosts(prev => prev.map(p => p.id !== postId ? p : {
        ...p, upvotedByMe: wasUpvoted, upvotes: post.upvotes,
      }));
    }
  }, [myId, posts, selectedPost]);

  const sendSupport = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, supportCount: p.supportCount + 1 }));
    try {
      await supabase.from('posts').update({ support_count: post.supportCount + 1 }).eq('id', postId);
    } catch (error) {
      logError('CommunityScreen.sendSupport', error);
    }
  }, [posts]);

  const submitComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || !selectedPost || !myId) return;
    setSubmittingComment(true);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: selectedPost.id, user_id: myId, body: text })
        .select('id, created_at')
        .single();

      if (error) throw error;

      const newComment: Comment = {
        id: data.id,
        authorId: myId,
        author: myName,
        streakDays: myStreak,
        body: text,
        timeAgo: 'agora',
      };

      setSelectedPost(prev => prev ? {
        ...prev,
        comments: [...prev.comments, newComment],
        commentCount: prev.commentCount + 1,
      } : null);

      setPosts(prev => prev.map(p => p.id === selectedPost.id
        ? { ...p, commentCount: p.commentCount + 1 } : p
      ));

      setCommentText('');
      Keyboard.dismiss();
    } catch (error) {
      logError('CommunityScreen.submitComment', error);
      Alert.alert('Erro', 'Não foi possível enviar o comentário.');
    } finally {
      setSubmittingComment(false);
    }
  }, [commentText, selectedPost, myId, myName, myStreak]);

  const submitPost = useCallback(async () => {
    if (!newTitle.trim() || !myId) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: myId,
          title: newTitle.trim(),
          body: newBody.trim(),
          is_conquest: isConquestNew,
          upvotes: 0,
          support_count: 0,
        })
        .select('id, created_at')
        .single();

      if (error) throw error;

      const newPost: Post = {
        id: data.id,
        authorId: myId,
        author: myName,
        streakDays: myStreak,
        timeAgo: 'agora',
        title: newTitle.trim(),
        body: newBody.trim(),
        upvotes: 0,
        upvotedByMe: false,
        supportCount: 0,
        commentCount: 0,
        comments: [],
        isConquest: isConquestNew,
      };

      setPosts(prev => [newPost, ...prev]);
      setNewTitle('');
      setNewBody('');
      setIsConquestNew(false);
      setCreateModalVisible(false);
    } catch (error) {
      logError('CommunityScreen.submitPost', error);
      Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }, [newTitle, newBody, isConquestNew, myId, myName, myStreak]);

  const acceptFriend = useCallback(async (friendId: string) => {
    if (!myId) return;
    try {
      await supabase.from('friendships')
        .update({ status: 'accepted' })
        .eq('requester_id', friendId)
        .eq('addressee_id', myId);
      setFriends(prev => prev.map(f => f.id === friendId ? { ...f, status: 'accepted' } : f));
    } catch (error) {
      logError('CommunityScreen.acceptFriend', error);
    }
  }, [myId]);

  const ignoreFriend = useCallback(async (friendId: string) => {
    if (!myId) return;
    try {
      await supabase.from('friendships').delete()
        .eq('requester_id', friendId).eq('addressee_id', myId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
    } catch (error) {
      logError('CommunityScreen.ignoreFriend', error);
    }
  }, [myId]);

  const addFriend = useCallback(async (targetId: string) => {
    if (!myId || targetId === myId) return;
    const already = friends.find(f => f.id === targetId);
    if (already) return;
    try {
      await supabase.from('friendships').insert({
        requester_id: myId,
        addressee_id: targetId,
        status: 'pending',
      });
      Alert.alert('Pedido enviado!', 'Quando ele aceitar, vocês serão amigos.');
    } catch (error) {
      logError('CommunityScreen.addFriend', error);
    }
  }, [myId, friends]);

  const openPost = useCallback(async (post: Post) => {
    setSelectedPost(post);
    setPostModalVisible(true);
    const comments = await loadComments(post.id);
    setSelectedPost(prev => prev ? { ...prev, comments } : null);
  }, [loadComments]);

  const openProfile = useCallback(async (authorId: string, name: string, streakDays: number) => {
    const userPosts = posts.filter(p => p.authorId === authorId);
    setProfileUser({ id: authorId, name, streakDays, posts: userPosts });
    setProfileVisible(true);
  }, [posts]);

  const filteredPosts = [...posts].sort((a, b) => {
    if (filter === 'destaque') return b.upvotes - a.upvotes;
    if (filter === 'streak')   return b.streakDays - a.streakDays;
    return 0;
  });

  // ---------------------------------------------------------------------------
  // RENDER CARD DE POST
  // ---------------------------------------------------------------------------
  const renderPostCard = (post: Post) => (
    <TouchableOpacity
      key={post.id}
      style={styles.postCard}
      activeOpacity={0.88}
      onPress={() => handlePress(() => openPost(post))}
    >
      {post.isConquest && (
        <View style={styles.conquestTag}>
          <Text style={styles.conquestTagText}>🏆 CONQUISTA</Text>
        </View>
      )}

      <View style={styles.postAuthorRow}>
        <TouchableOpacity
          style={styles.postAuthorLeft}
          activeOpacity={0.7}
          onPress={() => handlePress(() => openProfile(post.authorId, post.author, post.streakDays))}
        >
          <Avatar name={post.author} size={34} />
          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>{post.author}</Text>
            <StreakBadge days={post.streakDays} />
          </View>
        </TouchableOpacity>
        <Text style={styles.postTimeAgo}>{post.timeAgo}</Text>
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      {post.body ? (
        <Text style={styles.postBody} numberOfLines={3}>{post.body}</Text>
      ) : null}

      <View style={styles.postDivider} />

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postActionBtn}
          activeOpacity={0.7}
          onPress={() => toggleUpvote(post.id)}
        >
          <View style={[styles.postActionGradient, post.upvotedByMe && styles.postActionActive]}>
            <Ionicons
              name={post.upvotedByMe ? 'heart' : 'heart-outline'}
              size={15}
              color={post.upvotedByMe ? '#F27A5E' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.postActionCount, post.upvotedByMe && { color: '#F27A5E' }]}>
              {post.upvotes}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postActionBtn}
          activeOpacity={0.7}
          onPress={() => handlePress(() => openPost(post))}
        >
          <View style={styles.postActionGradient}>
            <Ionicons name="chatbubble-outline" size={15} color="rgba(255,255,255,0.5)" />
            <Text style={styles.postActionCount}>{post.commentCount}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.postActionBtn}>
          <View style={styles.postActionGradient}>
            <Ionicons name="bar-chart-outline" size={15} color="rgba(255,255,255,0.5)" />
            <Text style={styles.postActionCount}>
              {Math.max(post.upvotes + post.commentCount + post.supportCount, 1) * 3}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.postActionBtn}
          activeOpacity={0.7}
          onPress={() => sendSupport(post.id)}
        >
          <View style={styles.postActionGradient}>
            <Ionicons name="hand-right-outline" size={15} color="rgba(255,255,255,0.5)" />
            <Text style={styles.postActionCount}>{post.supportCount}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ---------------------------------------------------------------------------
  // RENDER ABA GRUPOS
  // ---------------------------------------------------------------------------
  const renderTeams = () => {
    if (loadingTeams) return (
      <View style={styles.loadingCenter}><ActivityIndicator color="#3D54D9" /></View>
    );

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.teamsList, { paddingBottom: insets.bottom + 100 }]}
      >
        {teams.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.teamCard, t.joined && styles.teamCardJoined]}
            activeOpacity={0.85}
            onPress={() => openTeam(t)}
          >
            <Text style={styles.teamEmoji}>{t.emoji}</Text>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{t.name}</Text>
              <Text style={styles.teamDesc} numberOfLines={2}>{t.description}</Text>
              <View style={styles.teamMeta}>
                <Text style={styles.teamMembers}>{t.members.toLocaleString('pt-BR')} membros</Text>
                {t.adminName ? (
                  <Text style={styles.teamAdminLabel}>admin: {t.adminName}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.teamBtn, t.joined && styles.teamBtnJoined]}
              activeOpacity={0.8}
              onPress={() => toggleTeam(t.id)}
            >
              <Text style={[styles.teamBtnText, t.joined && styles.teamBtnTextJoined]}>
                {t.joined ? 'Sair' : 'Entrar'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.createTeamBtn}
          activeOpacity={0.85}
          onPress={() => setCreateTeamVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#3D54D9" />
          <Text style={styles.createTeamBtnText}>Criar novo grupo</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER ABA AMIGOS
  // ---------------------------------------------------------------------------
  const renderFriends = () => {
    if (loadingFriends) return (
      <View style={styles.loadingCenter}><ActivityIndicator color="#3D54D9" /></View>
    );

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.friendsList, { paddingBottom: insets.bottom + 80 }]}
      >
        {friends.map(f => (
          <View key={f.id} style={styles.friendCard}>
            <Avatar name={f.name} size={44} />
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{f.name}</Text>
              <StreakBadge days={f.streakDays} />
            </View>
            <View style={styles.friendStatus}>
              {f.status === 'accepted' && (
                <View style={styles.friendAccepted}>
                  <Text style={styles.friendAcceptedText}>Amigo ✓</Text>
                </View>
              )}
              {f.status === 'pending_sent' && (
                <View style={styles.friendPending}>
                  <Text style={styles.friendPendingText}>Pendente...</Text>
                </View>
              )}
              {f.status === 'pending_received' && (
                <View style={styles.friendReceivedRow}>
                  <TouchableOpacity style={styles.friendAcceptBtn} activeOpacity={0.8} onPress={() => acceptFriend(f.id)}>
                    <Text style={styles.friendAcceptBtnText}>Aceitar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.friendIgnoreBtn} activeOpacity={0.8} onPress={() => ignoreFriend(f.id)}>
                    <Text style={styles.friendIgnoreBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
        {friends.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>Nenhum amigo ainda.</Text>
            <Text style={styles.emptySubtext}>Toque no nome de alguém no feed para adicionar.</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ---------------------------------------------------------------------------
  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comunidade</Text>
      </View>

      <View style={styles.tabs}>
        {(['forum', 'teams', 'friends'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'forum' ? 'Fórum' : t === 'teams' ? 'Grupos' : 'Amigos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'forum' && (
        <TouchableOpacity
          style={styles.filterRow}
          activeOpacity={0.8}
          onPress={() => handlePress(() => setFilterVisible(true))}
        >
          <Text style={styles.filterLabel}>Filtrar:</Text>
          <Text style={styles.filterValue}>
            {filter === 'novo' ? 'Novo' : filter === 'streak' ? 'Mesmo Streak' : 'Em Destaque'} ▾
          </Text>
        </TouchableOpacity>
      )}

      {tab === 'forum' && (
        loadingPosts
          ? <View style={styles.loadingCenter}><ActivityIndicator color="#3D54D9" /></View>
          : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.feedList, { paddingBottom: insets.bottom + 80 }]}
            >
              {filteredPosts.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📝</Text>
                  <Text style={styles.emptyText}>Nenhum post ainda.</Text>
                  <Text style={styles.emptySubtext}>Seja o primeiro a compartilhar.</Text>
                </View>
              )}
              {filteredPosts.map(renderPostCard)}
            </ScrollView>
          )
      )}
      {tab === 'teams'   && renderTeams()}
      {tab === 'friends' && renderFriends()}

      {tab === 'forum' && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 80 }]}
          activeOpacity={0.8}
          onPress={() => handlePress(() => setCreateModalVisible(true))}
        >
          <LinearGradient colors={['#3D54D9', '#293CA6']} style={styles.fabGradient}>
            <Text style={styles.fabIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ── MODAL: FILTRO ── */}
      <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={() => setFilterVisible(false)}>
        <TouchableOpacity style={styles.filterOverlay} activeOpacity={1} onPress={() => setFilterVisible(false)}>
          <View style={styles.filterSheet}>
            {([
              { key: 'novo', label: 'Novo' },
              { key: 'streak', label: 'Mesmo Streak' },
              { key: 'destaque', label: 'Em Destaque' },
            ] as { key: Filter; label: string }[]).map(f => (
              <TouchableOpacity
                key={f.key}
                style={styles.filterOption}
                activeOpacity={0.8}
                onPress={() => { setFilter(f.key); setFilterVisible(false); }}
              >
                <Text style={[styles.filterOptionText, filter === f.key && { color: '#3D54D9' }]}>{f.label}</Text>
                {filter === f.key && <Text style={styles.filterCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── MODAL: GRUPO ABERTO ── */}
      <Modal
        visible={teamModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTeamModalVisible(false)}
      >
        {selectedTeam && (
          <KeyboardAvoidingView
            style={[styles.modalContainer, { paddingTop: insets.top + 8 }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalBackBtn} activeOpacity={0.8} onPress={() => setTeamModalVisible(false)}>
                <Text style={styles.modalBackText}>← Voltar</Text>
              </TouchableOpacity>
              <View style={styles.teamModalTitle}>
                <Text style={styles.teamModalTitleEmoji}>{selectedTeam.emoji}</Text>
                <Text style={styles.teamModalTitleText}>{selectedTeam.name}</Text>
              </View>
              {isOwner && (
                <TouchableOpacity style={styles.modalBackBtn} activeOpacity={0.8} onPress={() => deleteTeam(selectedTeam.id)}>
                  <Ionicons name="trash-outline" size={18} color="#F27A5E" />
                </TouchableOpacity>
              )}
              {!isOwner && <View style={{ width: 60 }} />}
            </View>

            {/* Info do grupo */}
            <View style={styles.teamModalInfo}>
              <Text style={styles.teamModalDesc}>{selectedTeam.description}</Text>
              <View style={styles.teamModalMeta}>
                <Text style={styles.teamModalMembers}>{selectedTeam.members} membros</Text>
                <View style={styles.teamModalAdminBadge}>
                  <Ionicons name="shield-checkmark-outline" size={11} color="#3D54D9" />
                  <Text style={styles.teamModalAdminText}>{selectedTeam.adminName}</Text>
                </View>
              </View>
            </View>

            <View style={styles.teamModalDivider} />

            {/* Mensagens */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.teamMsgList}
            >
              {teamMessages.length === 0 && (
                <View style={styles.emptyComments}>
                  <Text style={styles.emptyCommentsEmoji}>💬</Text>
                  <Text style={styles.emptyCommentsText}>Seja o primeiro a escrever.</Text>
                </View>
              )}
              {teamMessages.map(msg => (
                <View key={msg.id} style={styles.teamMsgRow}>
                  <Avatar name={msg.author} size={32} />
                  <View style={[styles.teamMsgBubble, msg.isAdmin && styles.teamMsgBubbleAdmin]}>
                    <View style={styles.teamMsgHeader}>
                      <Text style={[styles.teamMsgAuthor, msg.isAdmin && { color: '#3D54D9' }]}>{msg.author}</Text>
                      {msg.isAdmin && (
                        <View style={styles.adminTag}>
                          <Text style={styles.adminTagText}>admin</Text>
                        </View>
                      )}
                      <Text style={styles.teamMsgTime}>{msg.timeAgo}</Text>
                      {isOwner && (
                        <TouchableOpacity
                          style={styles.msgOwnerActions}
                          activeOpacity={0.7}
                          onPress={() => {
                            Alert.alert(
                              'Moderar',
                              `Mensagem de ${msg.author}`,
                              [
                                {
                                  text: '🗑️ Apagar mensagem',
                                  onPress: async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('team_messages')
                                        .delete()
                                        .eq('id', msg.id);
                                
                                      if (error) throw error;
                                      setTeamMessages(prev => prev.filter(m => m.id !== msg.id));
                                    } catch (e) {
                                      logError('CommunityScreen.deleteMessage', e);
                                      Alert.alert('Erro', 'Não foi possível apagar a mensagem.');
                                    }
                                  },
                                },
                                {
                                  text: '🚫 Banir usuário',
                                  style: 'destructive',
                                  onPress: () => {
                                    Alert.alert(
                                      'Banir usuário',
                                      `Banir ${msg.author} de todos os grupos?`,
                                      [
                                        { text: 'Cancelar', style: 'cancel' },
                                        {
                                          text: 'Banir',
                                          style: 'destructive',
                                          onPress: async () => {
                                            try {
                                              const { error } = await supabase
                                                .from('banned_users')
                                                .insert({
                                                  banned_user_id: msg.userId,
                                                  banned_by: myId,
                                                  reason: 'Banido pelo admin',
                                                });
                                
                                              if (error) throw error;
                                
                                              setTeamMessages(prev => prev.filter(m => m.userId !== msg.userId));
                                              Alert.alert('Feito', `${msg.author} foi banido.`);
                                            } catch (e) {
                                              logError('CommunityScreen.banUser', e);
                                              Alert.alert('Erro', 'Não foi possível banir o usuário.');
                                            }
                                          },
                                        },
                                      ]
                                    );
                                  },
                                },
                                { text: 'Cancelar', style: 'cancel' },
                              ]
                            );
                          }}
                        >
                          <Ionicons name="ellipsis-horizontal" size={14} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.teamMsgBody}>{msg.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Input de mensagem */}
            <View style={[styles.commentInputWrapper, { paddingBottom: insets.bottom + 8 }]}>
              <TextInput
                style={styles.commentInput}
                placeholder="Escreve algo pro grupo..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={teamMsgText}
                onChangeText={setTeamMsgText}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[styles.commentSendBtn, { opacity: teamMsgText.trim() && !submittingTeamMsg ? 1 : 0.4 }]}
                activeOpacity={0.8}
                onPress={sendTeamMessage}
                disabled={!teamMsgText.trim() || submittingTeamMsg}
              >
                <LinearGradient colors={['#3D54D9', '#293CA6']} style={styles.commentSendGradient}>
                  {submittingTeamMsg
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Text style={styles.commentSendIcon}>↑</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>

      {/* ── MODAL: CRIAR GRUPO ── */}
      <Modal
        visible={createTeamVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateTeamVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { paddingTop: insets.top + 8 }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalBackBtn} activeOpacity={0.8} onPress={() => setCreateTeamVisible(false)}>
              <Text style={styles.modalBackText}>✕ Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Criar Grupo</Text>
            <TouchableOpacity
              style={[styles.createPostBtn, { opacity: newTeamName.trim() && !submittingTeam ? 1 : 0.4 }]}
              activeOpacity={0.8}
              onPress={submitNewTeam}
              disabled={!newTeamName.trim() || submittingTeam}
            >
              {submittingTeam
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.createPostBtnText}>Criar</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.createModalScroll} keyboardShouldPersistTaps="handled">
            {/* Emoji */}
            <Text style={styles.createTeamLabel}>Emoji do grupo</Text>
            <View style={styles.emojiRow}>
              {['👥', '💪', '🧠', '🌙', '❤️', '🔥', '🏆', '🌿', '⚡', '🎯'].map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, newTeamEmoji === e && styles.emojiBtnActive]}
                  activeOpacity={0.8}
                  onPress={() => setNewTeamEmoji(e)}
                >
                  <Text style={styles.emojiBtnText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.createDivider} />

            <TextInput
              style={styles.createTitleInput}
              placeholder="Nome do grupo"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={newTeamName}
              onChangeText={setNewTeamName}
              maxLength={60}
            />
            <View style={styles.createDivider} />
            <TextInput
              style={styles.createBodyInput}
              placeholder="Descrição — do que se trata esse grupo?"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={newTeamDesc}
              onChangeText={setNewTeamDesc}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL: POST ABERTO ── */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPostModalVisible(false)}
      >
        {selectedPost && (
          <KeyboardAvoidingView
            style={[styles.modalContainer, { paddingTop: insets.top + 8 }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalBackBtn} activeOpacity={0.8} onPress={() => handlePress(() => setPostModalVisible(false))}>
                <Text style={styles.modalBackText}>← Voltar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalPost}>
                <View style={styles.postAuthorRow}>
                  <TouchableOpacity
                    style={styles.postAuthorLeft}
                    activeOpacity={0.7}
                    onPress={() => handlePress(() => {
                      setPostModalVisible(false);
                      openProfile(selectedPost.authorId, selectedPost.author, selectedPost.streakDays);
                    })}
                  >
                    <Avatar name={selectedPost.author} size={36} />
                    <View style={styles.postAuthorInfo}>
                      <Text style={styles.postAuthorName}>{selectedPost.author}</Text>
                      <StreakBadge days={selectedPost.streakDays} />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.postTimeAgo}>{selectedPost.timeAgo}</Text>
                </View>
                <Text style={styles.modalPostTitle}>{selectedPost.title}</Text>
                {selectedPost.body ? <Text style={styles.modalPostBody}>{selectedPost.body}</Text> : null}

                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.postActionBtn} activeOpacity={0.7} onPress={() => toggleUpvote(selectedPost.id)}>
                    <View style={[styles.postActionGradient, selectedPost.upvotedByMe && styles.postActionActive]}>
                      <Ionicons name={selectedPost.upvotedByMe ? 'heart' : 'heart-outline'} size={15} color={selectedPost.upvotedByMe ? '#F27A5E' : 'rgba(255,255,255,0.5)'} />
                      <Text style={[styles.postActionCount, selectedPost.upvotedByMe && { color: '#F27A5E' }]}>{selectedPost.upvotes}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postActionBtn} activeOpacity={0.7} onPress={() => sendSupport(selectedPost.id)}>
                    <View style={styles.postActionGradient}>
                      <Ionicons name="hand-right-outline" size={15} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.postActionCount}>{selectedPost.supportCount}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.commentsSection}>
                <Text style={styles.commentsSectionTitle}>Comentários ({selectedPost.comments.length})</Text>
                {selectedPost.comments.length === 0 ? (
                  <View style={styles.emptyComments}>
                    <Text style={styles.emptyCommentsEmoji}>💬</Text>
                    <Text style={styles.emptyCommentsText}>Nenhum comentário ainda.</Text>
                    <Text style={styles.emptyCommentsSubtext}>Seja o primeiro a responder.</Text>
                  </View>
                ) : (
                  selectedPost.comments.map(c => (
                    <View key={c.id} style={styles.commentCard}>
                      <Avatar name={c.author} size={28} />
                      <View style={styles.commentContent}>
                        <View style={styles.commentAuthorRow}>
                          <Text style={styles.commentAuthor}>{c.author}</Text>
                          <StreakBadge days={c.streakDays} />
                          <Text style={styles.commentTime}>{c.timeAgo}</Text>
                        </View>
                        <Text style={styles.commentBody}>{c.body}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            <View style={[styles.commentInputWrapper, { paddingBottom: insets.bottom + 8 }]}>
              <TextInput
                style={styles.commentInput}
                placeholder="Escreve um comentário..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[styles.commentSendBtn, { opacity: commentText.trim() && !submittingComment ? 1 : 0.4 }]}
                activeOpacity={0.8}
                onPress={() => handlePress(submitComment)}
                disabled={!commentText.trim() || submittingComment}
              >
                <LinearGradient colors={['#3D54D9', '#293CA6']} style={styles.commentSendGradient}>
                  {submittingComment
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Text style={styles.commentSendIcon}>↑</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>

      {/* ── MODAL: CRIAR POST ── */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { paddingTop: insets.top + 8 }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalBackBtn} activeOpacity={0.8} onPress={() => handlePress(() => setCreateModalVisible(false))}>
              <Text style={styles.modalBackText}>✕ Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Criar Post</Text>
            <TouchableOpacity
              style={[styles.createPostBtn, { opacity: newTitle.trim() && !submitting ? 1 : 0.4 }]}
              activeOpacity={0.8}
              onPress={() => handlePress(submitPost)}
              disabled={!newTitle.trim() || submitting}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.createPostBtnText}>Publicar</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.createModalScroll} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.createTitleInput}
              placeholder="Título"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={newTitle}
              onChangeText={setNewTitle}
              maxLength={100}
              multiline
            />
            <View style={styles.createDivider} />
            <TextInput
              style={styles.createBodyInput}
              placeholder="O que está na sua cabeça?"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={newBody}
              onChangeText={setNewBody}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <View style={styles.createDivider} />
            <TouchableOpacity style={styles.conquestToggleRow} activeOpacity={0.8} onPress={() => setIsConquestNew(v => !v)}>
              <Text style={styles.conquestToggleText}>🏆 Marcar como conquista</Text>
              <View style={[styles.conquestToggleBox, isConquestNew && styles.conquestToggleBoxOn]}>
                {isConquestNew && <Text style={styles.conquestToggleCheck}>✓</Text>}
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL: PERFIL ── */}
      <Modal
        visible={profileVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setProfileVisible(false)}
      >
        {profileUser && (
          <View style={[styles.modalContainer, { paddingTop: insets.top + 8 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalBackBtn} activeOpacity={0.8} onPress={() => handlePress(() => setProfileVisible(false))}>
                <Text style={styles.modalBackText}>← Voltar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.profileScroll, { paddingBottom: insets.bottom + 32 }]}>
              <View style={styles.profileTop}>
                <Avatar name={profileUser.name} size={72} />
                <Text style={styles.profileName}>{profileUser.name}</Text>
                <View style={styles.profileStats}>
                  <View style={styles.profileStat}>
                    <Text style={styles.profileStatValue}>{profileUser.streakDays}</Text>
                    <Text style={styles.profileStatLabel}>Streak (d)</Text>
                  </View>
                  <View style={styles.profileStat}>
                    <Text style={styles.profileStatValue}>{profileUser.posts.length}</Text>
                    <Text style={styles.profileStatLabel}>Posts</Text>
                  </View>
                  <View style={styles.profileStat}>
                    <Text style={styles.profileStatValue}>{profileUser.posts.reduce((s, p) => s + p.upvotes, 0)}</Text>
                    <Text style={styles.profileStatLabel}>Apoios</Text>
                  </View>
                </View>

                {profileUser.id !== myId && (
                  <TouchableOpacity style={styles.addFriendBtn} activeOpacity={0.8} onPress={() => addFriend(profileUser.id)}>
                    <LinearGradient colors={['#3D54D9', '#293CA6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addFriendGradient}>
                      <Text style={styles.addFriendText}>+ Adicionar amigo</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.profilePostsTitle}>Posts</Text>
              {profileUser.posts.length === 0 ? (
                <View style={styles.emptyState}><Text style={styles.emptyText}>Nenhum post ainda.</Text></View>
              ) : (
                profileUser.posts.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.profilePostCard}
                    activeOpacity={0.85}
                    onPress={() => handlePress(() => { setProfileVisible(false); openPost(p); })}
                  >
                    <Text style={styles.profilePostTitle}>{p.title}</Text>
                    {p.body ? <Text style={styles.profilePostBody} numberOfLines={2}>{p.body}</Text> : null}
                    <View style={styles.profilePostMeta}>
                      <Text style={styles.profilePostMetaText}>▲ {p.upvotes}</Text>
                      <Text style={styles.profilePostMetaText}>💬 {p.commentCount}</Text>
                      <Text style={styles.profilePostMetaText}>{p.timeAgo}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// ESTILOS
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontFamily: 'Rubik_700Bold', color: '#FFFFFF', letterSpacing: -0.5 },

  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tabBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border },
  tabBtnActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  tabBtnText: { fontSize: 14, fontFamily: 'Rubik_500Medium', color: 'rgba(255,255,255,0.45)' },
  tabBtnTextActive: { color: colors.background, fontFamily: 'Rubik_600SemiBold' },

  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10, gap: 6 },
  filterLabel: { fontSize: 13, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.4)' },
  filterValue: { fontSize: 13, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },

  feedList: { paddingHorizontal: 16, gap: 12 },

  postCard: { backgroundColor: colors.backgroundCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
  conquestTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(245,197,24,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(245,197,24,0.3)' },
  conquestTagText: { fontSize: 10, fontFamily: 'Rubik_700Bold', color: '#F5C518', letterSpacing: 0.5 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  postAuthorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  postAuthorInfo: { gap: 3 },
  postAuthorName: { fontSize: 14, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  streakBadge: { backgroundColor: 'rgba(242,122,94,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  streakBadgeText: { fontSize: 10, fontFamily: 'Rubik_600SemiBold', color: '#F27A5E' },
  postTimeAgo: { fontSize: 11, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.3)' },
  postTitle: { fontSize: 16, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF', lineHeight: 22 },
  postBody: { fontSize: 14, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.65)', lineHeight: 21 },
  postActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  postDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 4 },
  postActionActive: { backgroundColor: 'rgba(242,122,94,0.12)' },
  postActionBtn: { borderRadius: 10, overflow: 'hidden' },
  postActionGradient: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)' },
  postActionIcon: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  postActionCount: { fontSize: 13, fontFamily: 'Rubik_500Medium', color: 'rgba(255,255,255,0.5)' },

  fab: { position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 26, overflow: 'hidden', shadowColor: '#3D54D9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  fabGradient: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  fabIcon: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Rubik_400Regular', lineHeight: 32 },

  teamsList: { paddingHorizontal: 16, gap: 10 },
  teamCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 12 },
  teamCardJoined: { borderColor: 'rgba(61,84,217,0.4)' },
  teamEmoji: { fontSize: 28 },
  teamInfo: { flex: 1, gap: 2 },
  teamName: { fontSize: 14, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  teamDesc: { fontSize: 12, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.45)', lineHeight: 17 },
  teamMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  teamMembers: { fontSize: 11, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.3)' },
  teamAdminLabel: { fontSize: 10, fontFamily: 'Rubik_400Regular', color: 'rgba(61,84,217,0.7)' },
  teamBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#3D54D9' },
  teamBtnJoined: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  teamBtnText: { fontSize: 13, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  teamBtnTextJoined: { color: 'rgba(255,255,255,0.45)' },

  createTeamBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(61,84,217,0.4)', backgroundColor: 'rgba(61,84,217,0.08)', marginTop: 4 },
  createTeamBtnText: { fontSize: 14, fontFamily: 'Rubik_500Medium', color: '#3D54D9' },

  teamModalTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamModalTitleEmoji: { fontSize: 18 },
  teamModalTitleText: { fontSize: 16, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  teamModalInfo: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  teamModalDesc: { fontSize: 13, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.55)', lineHeight: 20 },
  teamModalMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teamModalMembers: { fontSize: 12, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.35)' },
  teamModalAdminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(61,84,217,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  teamModalAdminText: { fontSize: 11, fontFamily: 'Rubik_500Medium', color: '#3D54D9' },
  teamModalDivider: { height: 1, backgroundColor: colors.border },
  teamMsgList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 14 },
  teamMsgRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  teamMsgBubble: { flex: 1, backgroundColor: colors.backgroundCard, borderRadius: 12, padding: 12, gap: 4, borderWidth: 1, borderColor: colors.border },
  teamMsgBubbleAdmin: { borderColor: 'rgba(61,84,217,0.3)', backgroundColor: 'rgba(61,84,217,0.06)' },
  teamMsgHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  teamMsgAuthor: { fontSize: 13, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  adminTag: { backgroundColor: 'rgba(61,84,217,0.2)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  adminTagText: { fontSize: 9, fontFamily: 'Rubik_700Bold', color: '#3D54D9', letterSpacing: 0.5 },
  teamMsgTime: { fontSize: 11, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' },
  teamMsgBody: { fontSize: 14, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.75)', lineHeight: 20 },

  createTeamLabel: { fontSize: 12, fontFamily: 'Rubik_500Medium', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 10 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { borderColor: '#3D54D9', backgroundColor: 'rgba(61,84,217,0.15)' },
  emojiBtnText: { fontSize: 22 },

  friendsList: { paddingHorizontal: 16, gap: 10 },
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 12 },
  friendInfo: { flex: 1, gap: 4 },
  friendName: { fontSize: 15, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  friendStatus: { alignItems: 'flex-end' },
  friendAccepted: { backgroundColor: 'rgba(74,156,82,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  friendAcceptedText: { fontSize: 12, fontFamily: 'Rubik_500Medium', color: '#4A9C52' },
  friendPending: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  friendPendingText: { fontSize: 12, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.35)' },
  friendReceivedRow: { flexDirection: 'row', gap: 8 },
  friendAcceptBtn: { backgroundColor: '#3D54D9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  friendAcceptBtnText: { fontSize: 13, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  friendIgnoreBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  friendIgnoreBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 16, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  emptySubtext: { fontSize: 13, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingHorizontal: 32 },

  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalBackBtn: { paddingVertical: 4, minWidth: 60 },
  modalBackText: { fontSize: 14, fontFamily: 'Rubik_500Medium', color: 'rgba(255,255,255,0.6)' },
  modalHeaderTitle: { fontSize: 16, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  modalScroll: { paddingHorizontal: 16, paddingTop: 20, gap: 20, paddingBottom: 20 },
  modalPost: { gap: 10 },
  modalPostTitle: { fontSize: 22, fontFamily: 'Rubik_700Bold', color: '#FFFFFF', lineHeight: 28, letterSpacing: -0.3 },
  modalPostBody: { fontSize: 15, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.75)', lineHeight: 23 },

  commentsSection: { gap: 12 },
  commentsSectionTitle: { fontSize: 13, fontFamily: 'Rubik_700Bold', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  emptyComments: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyCommentsEmoji: { fontSize: 36 },
  emptyCommentsText: { fontSize: 15, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  emptyCommentsSubtext: { fontSize: 13, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.35)' },
  commentCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  commentContent: { flex: 1, backgroundColor: colors.backgroundCard, borderRadius: 12, padding: 12, gap: 4, borderWidth: 1, borderColor: colors.border },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  commentAuthor: { fontSize: 13, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  commentTime: { fontSize: 11, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' },
  commentBody: { fontSize: 14, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.75)', lineHeight: 20 },
  commentInputWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  commentInput: { flex: 1, backgroundColor: colors.backgroundCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: 'Rubik_400Regular', color: '#FFFFFF', maxHeight: 90, minHeight: 44 },
  commentSendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  commentSendGradient: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  commentSendIcon: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Rubik_700Bold' },

  createModalScroll: { paddingHorizontal: 20, paddingTop: 24, gap: 0 },
  createPostBtn: { backgroundColor: '#3D54D9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  createPostBtnText: { fontSize: 14, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  createTitleInput: { fontSize: 22, fontFamily: 'Rubik_700Bold', color: '#FFFFFF', paddingVertical: 8, minHeight: 56 },
  createDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  createBodyInput: { fontSize: 16, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.8)', lineHeight: 24, minHeight: 120 },
  conquestToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  conquestToggleText: { fontSize: 15, fontFamily: 'Rubik_500Medium', color: 'rgba(255,255,255,0.7)' },
  conquestToggleBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  conquestToggleBoxOn: { backgroundColor: '#3D54D9', borderColor: '#3D54D9' },
  conquestToggleCheck: { fontSize: 13, color: '#FFFFFF', fontFamily: 'Rubik_700Bold' },

  filterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', paddingTop: 140, paddingHorizontal: 20 },
  filterSheet: { backgroundColor: '#1A2240', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  filterOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterOptionText: { fontSize: 15, fontFamily: 'Rubik_500Medium', color: '#FFFFFF' },
  filterCheck: { fontSize: 14, color: '#3D54D9', fontFamily: 'Rubik_600SemiBold' },

  profileScroll: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  profileTop: { alignItems: 'center', gap: 12 },
  profileName: { fontSize: 24, fontFamily: 'Rubik_700Bold', color: '#FFFFFF', letterSpacing: -0.3 },
  profileStats: { flexDirection: 'row', gap: 32, marginTop: 4 },
  profileStat: { alignItems: 'center', gap: 2 },
  profileStatValue: { fontSize: 26, fontFamily: 'Rubik_700Bold', color: '#FFFFFF', letterSpacing: -1 },
  profileStatLabel: { fontSize: 11, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.4)' },
  addFriendBtn: { borderRadius: 12, overflow: 'hidden', width: '100%', marginTop: 4 },
  addFriendGradient: { paddingVertical: 14, alignItems: 'center' },
  addFriendText: { fontSize: 15, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  profilePostsTitle: { fontSize: 13, fontFamily: 'Rubik_700Bold', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 },
  profilePostCard: { backgroundColor: colors.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 },
  profilePostTitle: { fontSize: 15, fontFamily: 'Rubik_600SemiBold', color: '#FFFFFF' },
  profilePostBody: { fontSize: 13, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.5)', lineHeight: 19 },
  profilePostMeta: { flexDirection: 'row', gap: 14, marginTop: 4 },
  profilePostMetaText: { fontSize: 12, fontFamily: 'Rubik_400Regular', color: 'rgba(255,255,255,0.3)' },
  msgOwnerActions: { marginLeft: 'auto', padding: 4 },
});
