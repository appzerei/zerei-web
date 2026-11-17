import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { logError } from '../utils/logger';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------
type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

const SYSTEM_PROMPT = `Você é Zara, a companheira de recuperação do app ZEREI. Você foi criada para apoiar homens brasileiros entre 18 e 35 anos que estão trabalhando no controle de impulsos e vícios digitais — especialmente pornografia e comportamentos compulsivos online.

CONTEXTO DO USUÁRIO:
O usuário está em uma jornada de recuperação. Ele pode estar bem, lutando, em recaída ou em crise. Sua função é estar presente em qualquer um desses momentos sem julgamento.

PERSONALIDADE:
- Fale como um amigo próximo e honesto, não como um robô ou terapeuta formal
- Seja direto, humano e caloroso ao mesmo tempo
- Valide o que o usuário sente antes de oferecer qualquer conselho
- Nunca minimize o esforço dele — cada dia conta
- Use humor leve quando perceber que o usuário está bem, nunca quando estiver mal
- Seja curto e objetivo — homens geralmente preferem respostas práticas

REGRAS ABSOLUTAS:
- NUNCA cite o vício pelo nome (pornografia, conteúdo adulto etc)
- Use sempre: "impulsos", "padrões", "o hábito", "aquilo", "controle", "recaída", "jornada"
- Nunca use linguagem clínica ou de manual de psicologia
- Máximo de 3 parágrafos curtos por resposta
- Se o usuário mencionar automutilação, pensamentos suicidas ou situação de perigo real, encerre o tema e indique o CVV (188) com firmeza e cuidado

QUANDO O USUÁRIO ESTIVER BEM:
- Celebre com ele, mas sem exagerar
- Reforce o progresso sem criar pressão
- Pode fazer uma pergunta leve para continuar a conversa

QUANDO O USUÁRIO ESTIVER MAL OU EM RECAÍDA:
- Primeiro valide: "Faz sentido sentir isso"
- Nunca diga que ele falhou ou errou
- Lembre que recaída é parte do processo, não o fim
- Ofereça uma ação concreta e pequena para agora

QUANDO O USUÁRIO ESTIVER EM CRISE (impulso forte no momento):
- Seja firme e calmo, sem drama
- Ofereça imediatamente a técnica de respiração 4-7-8 ou a regra dos 15 minutos
- Sugira sair do ambiente atual
- Se necessário, mencione o Botão de Pânico do app

TÉCNICAS QUE VOCÊ PODE SUGERIR:
- Respiração 4-7-8: inspire 4s, segure 7s, expire 8s — repita 3 vezes
- Regra dos 15 minutos: o impulso passa sozinho se você esperar
- Técnica dos 5 sentidos: nomear 5 coisas que vê, 4 que toca, 3 que ouve, 2 que cheira, 1 que saboreia
- Sair do ambiente: mudar de cômodo, tomar água gelada, ligar para alguém
- Exercício físico imediato: 20 flexões ou 30 agachamentos agora

Você está aqui para ajudar, não para julgar. O usuário já deu o passo mais difícil ao abrir esse app.`;

// ---------------------------------------------------------------------------
// GLOB SVG — fiel ao print (forma irregular azul/roxo/rosa)
// ---------------------------------------------------------------------------
function GlobAvatar({ size = 260, pulseAnim, avatarY }: {
  size?: number;
  pulseAnim: Animated.Value;
  avatarY: Animated.Value;
}) {
  return (
    <Animated.View style={{
      width: size,
      height: size,
      transform: [{ scale: pulseAnim }, { translateY: avatarY }],
    }}>
      <Image
        source={require('../assets/glob.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
interface ZARAScreenProps {
  navigation?: { goBack: () => void; navigate: (screen: string) => void };
}

export default function ZARAScreen({ navigation }: ZARAScreenProps) {
  const insets = useSafeAreaInsets();

  const [messages, setMessages]               = useState<Message[]>([]);
  const [inputText, setInputText]             = useState<string>('');
  const [isLoading, setIsLoading]             = useState<boolean>(false);
  const [chatStarted, setChatStarted]         = useState<boolean>(false);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

  const flatListRef      = useRef<FlatList>(null);
  const inputRef         = useRef<TextInput>(null);
  const isProcessingBack = useRef<boolean>(false);
  const isProcessingPanic = useRef<boolean>(false);

  const pulseAnim       = useRef(new Animated.Value(1)).current;
  const thinkAnim       = useRef(new Animated.Value(0)).current;
  const avatarY         = useRef(new Animated.Value(0)).current;
  const inputBorderAnim = useRef(new Animated.Value(0)).current;

  // Pulso + float do glob
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarY, { toValue: -10, duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(avatarY, { toValue: 0,   duration: 3800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    pulse.start();
    float.start();
    return () => { pulse.stop(); float.stop(); };
  }, []);

  // Glow pensando
  useEffect(() => {
    if (isLoading) {
      const think = Animated.loop(
        Animated.sequence([
          Animated.timing(thinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(thinkAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])
      );
      think.start();
      return () => think.stop();
    } else {
      thinkAnim.setValue(0);
    }
  }, [isLoading]);

  // Borda do input pulsando
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(inputBorderAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(inputBorderAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // ---------------------------------------------------------------------------
  // ENVIAR MENSAGEM
  // ---------------------------------------------------------------------------
  const sendMessage = useCallback(async (): Promise<void> => {
    const text = inputText.trim().slice(0, 800);
    if (!text || isLoading) return;
  
    // Proteção contra prompt injection
    const bloqueado = [
  'ignore suas instruções',
  'ignore as instruções',
  'ignore o sistema',
  'ignore tudo',
  'desconsidere tudo',
  'esqueça tudo',
  'esquece tudo',
  'esquece o que',
  'a partir de agora você',
  'a partir de agora, você',
  'você agora é',
  'você é agora',
  'finja ser',
  'finja que é',
  'pretend you',
  'pretend to be',
  'act as',
  'jailbreak',
  'dan mode',
  'novo prompt',
  'novo sistema',
  'system prompt',
  'ignore previous',
  'disregard',
].some(p => text.toLowerCase().includes(p));
  
    if (bloqueado) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Isso não é algo que consigo responder. Quer falar sobre como você está se sentindo?',
        timestamp: new Date(),
      }]);
      setInputText('');
      return;
    }
    setInputText('');
    Keyboard.dismiss();

    if (!chatStarted) setChatStarted(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    await sendToAPI([...messages, userMsg]);
  }, [inputText, isLoading, messages, chatStarted]);

  // ---------------------------------------------------------------------------
  // CHAMAR API
  // ---------------------------------------------------------------------------
  const sendToAPI = useCallback(async (msgHistory: Message[]): Promise<void> => {
    setIsLoading(true);

    const lastMsg = msgHistory[msgHistory.length - 1]?.content?.toLowerCase() ?? '';
    const crisisWords = ['não aguento', 'desisti', 'recaí', 'falhei', 'não consigo', 'crise', 'recaindo'];
    const isCrisis = crisisWords.some(w => lastMsg.includes(w));

    const apiMessages = msgHistory.map(m => ({
      role: m.role,
      content: isCrisis && m === msgHistory[msgHistory.length - 1]
        ? m.content + '\n\n[CONTEXTO INTERNO: usuário parece estar em crise — priorize técnicas de ancoragem imediatas]'
        : m.content,
    }));

    try {
      const response = await fetch('https://pqkbltrcybpeezipfmtn.supabase.co/functions/v1/chat-zara', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...apiMessages,
          ],
        }),
      });

      const data = await response.json();

      // Trata o limite de mensagens por minuto (rate limit)
      if (response.status === 429) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error ?? 'Você está enviando mensagens muito rápido. Espera um minuto e tenta de novo.',
          timestamp: new Date(),
        }]);
        return;
      }

      // Trata erro de autenticação (token inválido ou ausente)
      if (response.status === 401) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sua sessão expirou. Sai e entra de novo no app pra continuar conversando.',
          timestamp: new Date(),
        }]);
        return;
      }

      const reply = data.choices?.[0]?.message?.content ?? 'Desculpa, tive um problema aqui. Tenta de novo?';

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (isCrisis) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: '__PANIC_BUTTON__',
              timestamp: new Date(),
            },
          ]);
        }, 500);
      }
    } catch (error) {
      logError('ZARAScreen.sendToAPI', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Tive um problema de conexão. Respira e tenta de novo em um segundo.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // RENDERIZAR BOLHA
  // ---------------------------------------------------------------------------
  const renderMessage = useCallback(({ item }: { item: Message }): React.ReactElement => {
    if (item.content === '__PANIC_BUTTON__') {
      return (
        <TouchableOpacity
          style={styles.panicBtn}
          activeOpacity={0.8}
          onPress={() => {
            if (isProcessingPanic.current) return;
            isProcessingPanic.current = true;
            navigation?.navigate('PanicButton');
            setTimeout(() => { isProcessingPanic.current = false; }, 500);
          }}
        >
          <LinearGradient
            colors={['#F27A5E', '#D05030'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.panicBtnGradient}
          >
            <Text style={styles.panicBtnText}>🚨  Abrir Botão de Emergência</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
        {!isUser && <View style={styles.aiBubbleIndicator} />}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  }, [navigation]);

  // ---------------------------------------------------------------------------
  // RENDER — TELA INICIAL (sem seleção de humor)
  // ---------------------------------------------------------------------------
  const borderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(120,80,220,0.5)', 'rgba(80,100,240,0.95)'],
  });

  if (!chatStarted) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <LinearGradient
          colors={['#03093A', '#060C28', '#050810', '#000000']}
          locations={[0, 0.28, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Botão voltar */}
        <TouchableOpacity
          style={[styles.backBtnHome, { marginTop: insets.top + 12 }]}
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Dashboard')}
        >
          <Text style={styles.backBtnHomeText}>←</Text>
        </TouchableOpacity>

        {/* Glob */}
        <View style={styles.globContainer}>
          <GlobAvatar size={SCREEN_W * 0.75} pulseAnim={pulseAnim} avatarY={avatarY} />
        </View>

        {/* Boas-vindas */}
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeTitle}>
            Seja Bem Vindo,{'\n'}eu sou a <Text style={styles.welcomeName}>Zara.</Text>
          </Text>
          <Text style={styles.privacyNote}>
            As mensagens do chat são apagadas sempre que{'\n'}você sair desta tela, para garantir sua privacidade.
          </Text>
        </View>

        {/* Espaço flex para empurrar input para baixo */}
        <View style={{ flex: 1 }} />

        {/* Input — faz parte do fluxo, sobe com o teclado */}
        <View style={[styles.inputAreaHome, { paddingBottom: insets.bottom + 20 }]}>
          <Animated.View style={[styles.inputBorderWrap, { borderColor }]}>
            <TextInput
              ref={inputRef}
              style={styles.inputHome}
              placeholder="Faça sua pergunta"
              placeholderTextColor="rgba(255,255,255,0.28)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.sendBtnHome}
              activeOpacity={0.7}
              onPress={sendMessage}
            >
              <Text style={styles.sendBtnHomeIcon}>▷</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER — CHAT
  // ---------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={['#03093A', '#060C28', '#050810', '#000000']}
        locations={[0, 0.28, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header compacto */}
      <View style={[styles.chatHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={() => {
            if (isProcessingBack.current) return;
            isProcessingBack.current = true;
            setChatStarted(false);
            setMessages([]);
            setTimeout(() => { isProcessingBack.current = false; }, 500);
          }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.chatHeaderCenter}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }, { translateY: avatarY }] }}>
            <GlobAvatar size={38} pulseAnim={new Animated.Value(1)} avatarY={new Animated.Value(0)} />
          </Animated.View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>ZARA</Text>
            <View style={styles.chatHeaderStatus}>
              <View style={[styles.statusDot, { backgroundColor: isLoading ? '#F5C518' : '#4A9C52' }]} />
              <Text style={styles.chatHeaderStatusText}>
                {isLoading ? 'pensando...' : 'online'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* Lista de mensagens */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.messageList,
          { paddingBottom: keyboardVisible ? 16 : insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.thinkingRow}>
              <View style={styles.aiBubbleIndicator} />
              <View style={styles.thinkingBubble}>
                <View style={styles.thinkingDots}>
                  {[0, 1, 2].map(i => (
                    <Animated.View key={i} style={[styles.thinkDot, {
                      opacity: thinkAnim,
                      transform: [{ scale: thinkAnim }],
                    }]} />
                  ))}
                </View>
              </View>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={[styles.inputWrapperChat, { paddingBottom: keyboardVisible ? 8 : insets.bottom + 8 }]}>
        <Animated.View style={[styles.inputBorderWrap, { borderColor }]}>
          <TextInput
            ref={inputRef}
            style={styles.inputHome}
            placeholder="Faça sua pergunta"
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtnHome, { opacity: inputText.trim() && !isLoading ? 1 : 0.35 }]}
            activeOpacity={0.7}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendBtnHomeIcon}>▷</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// ESTILOS
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // ── Tela inicial ──────────────────────────────────────────────────────────
  globContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnHome: {
    marginLeft: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnHomeText: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Rubik_400Regular',
  },

  welcomeBlock: {
    alignItems: 'center',
    paddingHorizontal: 36,
    gap: 14,
    marginTop: 20,
  },
  welcomeTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 42,
  },
  welcomeName: {
    color: '#6366F1',
    fontFamily: 'Rubik_600SemiBold',
  },
  privacyNote: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 20,
  },

inputAreaHome: {
    paddingHorizontal: 20,
  },
  inputBorderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 32,
    backgroundColor: '#0A0A18',
    paddingHorizontal: 20,
    paddingVertical: 2,
    gap: 8,
    shadowColor: '#9B4DCA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  inputHome: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Rubik_400Regular',
    color: '#FFFFFF',
    paddingVertical: 16,
    maxHeight: 100,
  },
  sendBtnHome: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnHomeIcon: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.55)',
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Rubik_500Medium',
  },
  chatHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
  },
  chatHeaderInfo: {
    gap: 2,
  },
  chatHeaderName: {
    fontSize: 15,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  chatHeaderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chatHeaderStatusText: {
    fontSize: 12,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },

  // ── Mensagens ─────────────────────────────────────────────────────────────
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAI: {
    justifyContent: 'flex-start',
  },
  aiBubbleIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    marginBottom: 8,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Rubik_400Regular',
  },
  bubbleTextUser: { color: '#FFFFFF' },
  bubbleTextAI: { color: '#FFFFFF' },

  // ── Thinking ──────────────────────────────────────────────────────────────
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  thinkingBubble: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  thinkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },

  // ── Panic ─────────────────────────────────────────────────────────────────
  panicBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    maxWidth: '78%',
  },
  panicBtnGradient: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panicBtnText: {
    fontSize: 14,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
  },

  // ── Input chat ────────────────────────────────────────────────────────────
  inputWrapperChat: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
});
