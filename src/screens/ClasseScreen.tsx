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
  Linking,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 20 * 2 - 12) / 2;

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------
type ContentType = 'artigo' | 'tecnica' | 'video' | 'frase';
type Category    = 'todos' | 'mente' | 'corpo' | 'habitos' | 'emergencia';

interface ContentItem {
  id: string;
  type: ContentType;
  category: Category;
  title: string;
  subtitle: string;
  emoji: string;
  accentColor: string;
  readTime?: string;
  body?: string;        // artigos e técnicas
  steps?: string[];     // técnicas passo a passo
  youtubeId?: string;   // vídeos
  quote?: string;       // frases
  author?: string;
}

// ---------------------------------------------------------------------------
// CONTEÚDO ESTÁTICO
// ---------------------------------------------------------------------------
const DAILY_QUOTE: ContentItem = {
  id: 'daily',
  type: 'frase',
  category: 'mente',
  title: 'Frase do dia',
  subtitle: '',
  emoji: '✨',
  accentColor: '#F5C518',
  quote: 'Você não precisa ser perfeito para começar. Mas precisa começar para ser melhor.',
  author: 'ZEREI',
};

const CONTENT: ContentItem[] = [
  // ── TÉCNICAS ─────────────────────────────────────────────────────────────
  {
    id: 't1',
    type: 'tecnica',
    category: 'emergencia',
    title: 'Regra dos 10 minutos',
    subtitle: 'Quando o impulso bater forte',
    emoji: '⏱️',
    accentColor: '#F27A5E',
    readTime: '2 min',
    body: 'O impulso é como uma onda. Ele sobe, atinge o pico e desce — em geral em menos de 10 minutos. Você não precisa resistir para sempre. Só precisa resistir agora.',
    steps: [
      'Reconheça o impulso sem julgamento: "Estou sentindo vontade. Tudo bem."',
      'Coloque um timer de 10 minutos no celular.',
      'Durante esses 10 minutos, faça qualquer outra coisa: água, caminhada, música.',
      'Quando o timer tocar, avalie: o impulso ainda é tão forte?',
      'Repita se necessário. A onda sempre desce.',
    ],
  },
  {
    id: 't2',
    type: 'tecnica',
    category: 'emergencia',
    title: 'Técnica 5-4-3-2-1',
    subtitle: 'Ancoragem imediata na realidade',
    emoji: '🧠',
    accentColor: '#3D54D9',
    readTime: '3 min',
    body: 'Quando sua mente fica presa num loop, essa técnica usa os 5 sentidos para te trazer de volta ao presente. Funciona melhor quando você sente que está perdendo o controle.',
    steps: [
      '5 coisas que você consegue VER agora ao redor.',
      '4 coisas que você consegue TOCAR — sinta a textura.',
      '3 coisas que você consegue OUVIR neste momento.',
      '2 coisas que você consegue CHEIRAR (ou se lembrar do cheiro).',
      '1 coisa que você consegue PROVAR — tome um gole d\'água.',
    ],
  },
  {
    id: 't3',
    type: 'tecnica',
    category: 'habitos',
    title: 'Substitua, não apenas pare',
    subtitle: 'Como criar um novo padrão',
    emoji: '🔄',
    accentColor: '#4A9C52',
    readTime: '4 min',
    body: 'O cérebro não funciona bem com ausência. Ele precisa de um substituto. Quando você simplesmente "tenta parar", está deixando um vazio — e vazio convida o velho hábito de volta.',
    steps: [
      'Identifique o gatilho: horário, emoção ou situação que antecede o impulso.',
      'Escolha UMA atividade substituta para esse gatilho específico.',
      'Deixe essa atividade fácil demais: tênis perto da cama, app de música na tela inicial.',
      'Nos primeiros 7 dias, foque apenas no substituto — não no que está parando.',
      'Depois de 21 dias, o substituto começa a virar o novo padrão.',
    ],
  },
  {
    id: 't4',
    type: 'tecnica',
    category: 'corpo',
    title: 'Respiração 4-7-8',
    subtitle: 'Desacelera o sistema nervoso em 2 min',
    emoji: '🌬️',
    accentColor: '#293CA6',
    readTime: '2 min',
    body: 'Essa técnica ativa o sistema nervoso parassimpático — o "modo calma" do seu corpo. É usada por atletas de elite e praticantes de meditação para controle de estado emocional.',
    steps: [
      'Sente confortavelmente. Feche os olhos se conseguir.',
      'Inspire pelo nariz contando 4 segundos.',
      'Segure o ar contando 7 segundos.',
      'Expire pela boca contando 8 segundos — faça um som suave.',
      'Repita 4 vezes. Você vai sentir a diferença já na segunda rodada.',
    ],
  },

  // ── ARTIGOS ───────────────────────────────────────────────────────────────
  {
    id: 'a1',
    type: 'artigo',
    category: 'mente',
    title: 'Por que é tão difícil parar?',
    subtitle: 'A ciência por trás do impulso',
    emoji: '🔬',
    accentColor: '#3D54D9',
    readTime: '5 min',
    body: `Não é fraqueza. É biologia.\n\nSeu cérebro tem um sistema de recompensa chamado circuito dopaminérgico. Quando você acessa conteúdo estimulante, ele libera dopamina a mesma substância liberada por comida, sexo e conquistas.\n\nO problema é que conteúdo pornografico foi projetado para maximizar essa liberação. Algoritmos, notificações e rolagem infinita são engenharia de dopamina.\n\nCom o tempo, seu cérebro se adapta: começa a precisar de mais estímulo para sentir o mesmo prazer. Isso se chama tolerância e é o mesmo mecanismo dos vícios químicos.\n\nA boa notícia: o cérebro é plástico. Quando você para de alimentar o circuito, ele se recalibra. Os primeiros 7 dias são os mais difíceis. Depois de 30 dias, a maioria das pessoas relata mais calma, foco e prazer nas coisas simples.\n\nVocê não está lutando contra si mesmo. Está lutando contra engenharia de bilhões de dólares. E está ganhando.`,
  },
  {
    id: 'a2',
    type: 'artigo',
    category: 'habitos',
    title: 'O mito da força de vontade',
    subtitle: 'Por que depender dela é um erro',
    emoji: '💪',
    accentColor: '#F27A5E',
    readTime: '4 min',
    body: `Força de vontade é um recurso finito. Pesquisadores chamam isso de "esgotamento do ego" — quanto mais você usa a força de vontade ao longo do dia, menos você tem disponível.\n\nIsso explica por que a maioria das recaídas acontece à noite. Não é coincidência. É biologia.\n\nO que funciona de verdade não é ter mais força de vontade. É precisar usar menos.\n\nIsso significa:\n\n• Remover gatilhos do ambiente (o que os olhos não veem, o cérebro não ativa)\n• Criar fricção entre você e o comportamento indesejado\n• Ter um plano pronto para os momentos de impulso — sem precisar pensar\n\nOs atletas não confiam na motivação para treinar. Eles confiam nos hábitos e na estrutura. Faça o mesmo.`,
  },
  {
    id: 'a3',
    type: 'artigo',
    category: 'mente',
    title: 'Recaída não é fracasso',
    subtitle: 'Como usar as quedas a seu favor',
    emoji: '🔁',
    accentColor: '#4A9C52',
    readTime: '3 min',
    body: `A maioria das pessoas abandona o processo depois da primeira recaída. Não porque desistiram — mas porque confundiram uma queda com o fim da jornada.\n\nRecaída faz parte do processo de recuperação. Isso não é desculpa — é fisiologia. O cérebro aprende por tentativa e erro. Cada recaída carrega informação: qual foi o gatilho? Que hora do dia? O que você estava sentindo?\n\nO que separa quem consegue de quem não consegue não é quantas vezes caiu. É o que faz depois.\n\nQuando você recai:\n\n1. Não entre em espiral de culpa — ela piora tudo\n2. Registre o contexto: o que aconteceu antes?\n3. Identifique o gatilho específico\n4. Ajuste o plano para esse gatilho\n5. Recomece — o streak zerou, mas o aprendizado não\n\nVocê não está no ponto zero. Está no ponto zero com mais experiência.`,
  },

  // ── VÍDEOS ────────────────────────────────────────────────────────────────
  {
    id: 'v1',
    type: 'video',
    category: 'mente',
    title: 'Como Se Livrar do Vício da Pornô',
    subtitle: 'TEDx-Ed — legendado em PT',
    emoji: '▶️',
    accentColor: '#F27A5E',
    readTime: '19 min',
    youtubeId: 'dbYWKVAeu6Y',
  },
  {
    id: 'v2',
    type: 'video',
    category: 'corpo',
    title: 'Neuroplasticidade na prática',
    subtitle: 'Como o cérebro muda com novos hábitos',
    emoji: '▶️',
    accentColor: '#3D54D9',
    readTime: '4 min',
    youtubeId: 'h1rkL_1V4E4',
  },

  // ── FRASES ────────────────────────────────────────────────────────────────
  {
    id: 'f1',
    type: 'frase',
    category: 'mente',
    title: 'Reflexão',
    subtitle: 'Para guardar',
    emoji: '💬',
    accentColor: '#F5C518',
    quote: 'Disciplina é só amor próprio com outro nome.',
    author: 'Desconhecido',
  },
  {
    id: 'f2',
    type: 'frase',
    category: 'habitos',
    title: 'Reflexão',
    subtitle: 'Para os dias difíceis',
    emoji: '💬',
    accentColor: '#4A9C52',
    quote: 'Não tente ser melhor do que todos os outros. Tente ser melhor do que você era ontem.',
    author: 'William Faulkner',
  },
  {
    id: 'f3',
    type: 'frase',
    category: 'emergencia',
    title: 'Reflexão',
    subtitle: 'Quando o impulso bater',
    emoji: '💬',
    accentColor: '#F27A5E',
    quote: 'O impulso vai passar. Passa sempre. A questão é: quem você quer ser quando ele passar?',
    author: 'ZEREI',
  },
];

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'todos',     label: 'Tudo'       },
  { key: 'emergencia',label: 'Urgente'    },
  { key: 'mente',     label: 'Mente'      },
  { key: 'corpo',     label: 'Corpo'      },
  { key: 'habitos',   label: 'Hábitos'   },
];

const TYPE_LABELS: Record<ContentType, string> = {
  artigo:  'ARTIGO',
  tecnica: 'TÉCNICA',
  video:   'VÍDEO',
  frase:   'FRASE',
};

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
interface Props {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function ClasseScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [activeCategory, setActiveCategory] = useState<Category>('todos');
  const [selectedItem, setSelectedItem]     = useState<ContentItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
const isProcessing = useRef(false);

function handlePress(fn: () => void, delay = 500) {
  if (isProcessing.current) return;
  isProcessing.current = true;
  fn();
  setTimeout(() => { isProcessing.current = false; }, delay);
}

  // Animações de entrada
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  // Filtrar conteúdo
  const filtered = activeCategory === 'todos'
    ? CONTENT
    : CONTENT.filter(c => c.category === activeCategory);

  // Abrir item
  const openItem = (item: ContentItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // ---------------------------------------------------------------------------
  // RENDER CARD
  // ---------------------------------------------------------------------------
  const renderCard = (item: ContentItem, index: number) => {
    const isFullWidth = item.type === 'frase';

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.82}
        style={[
          styles.card,
          isFullWidth ? styles.cardFullWidth : styles.cardHalf,
          { borderColor: item.accentColor + '30' },
        ]}
        onPress={() => handlePress(() => openItem(item))}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        accessibilityHint={`Duplo toque para abrir ${item.type === 'artigo' ? 'artigo' : item.type === 'tecnica' ? 'técnica' : item.type === 'video' ? 'vídeo' : 'frase'}`}
      >
        <LinearGradient
          colors={[item.accentColor + '18', item.accentColor + '06', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Tag de tipo */}
        <View style={[styles.typeTag, { backgroundColor: item.accentColor + '22' }]}>
          <Text style={[styles.typeTagText, { color: item.accentColor }]}>
            {TYPE_LABELS[item.type]}
          </Text>
        </View>

        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>

        {item.readTime && (
          <Text style={styles.cardReadTime}>{item.readTime}</Text>
        )}

        {item.type === 'frase' && item.quote && (
          <Text style={[styles.cardQuotePreview, { color: item.accentColor }]} numberOfLines={2}>
            "{item.quote}"
          </Text>
        )}

        {/* Indicador de acento no canto */}
        <View style={[styles.cardAccent, { backgroundColor: item.accentColor }]} />
      </TouchableOpacity>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER MODAL
  // ---------------------------------------------------------------------------
  const renderModal = () => {
    if (!selectedItem) return null;
    const item = selectedItem;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modal, { paddingTop: insets.top + 8 }]}>
          {/* Header do modal */}
          <View style={styles.modalHeader}>
            <View style={[styles.typeTag, { backgroundColor: item.accentColor + '22' }]}>
              <Text style={[styles.typeTagText, { color: item.accentColor }]}>
                {TYPE_LABELS[item.type]}
              </Text>
            </View>
            <TouchableOpacity
  style={styles.modalCloseBtn}
  activeOpacity={0.8}
  onPress={() => handlePress(() => setModalVisible(false))}
>
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.modalScroll, { paddingBottom: insets.bottom + 32 }]}
          >
            <Text style={styles.modalEmoji}>{item.emoji}</Text>
            <Text style={styles.modalTitle}>{item.title}</Text>
            {item.subtitle ? (
              <Text style={styles.modalSubtitle}>{item.subtitle}</Text>
            ) : null}

            <View style={[styles.modalDivider, { backgroundColor: item.accentColor + '40' }]} />

            {/* FRASE */}
            {item.type === 'frase' && (
              <View style={styles.modalQuoteContainer}>
                <Text style={[styles.modalQuoteMark, { color: item.accentColor }]}>"</Text>
                <Text style={styles.modalQuote}>{item.quote}</Text>
                {item.author && (
                  <Text style={[styles.modalAuthor, { color: item.accentColor }]}>
                    — {item.author}
                  </Text>
                )}
              </View>
            )}

            {/* ARTIGO */}
            {item.type === 'artigo' && item.body && (
              <Text style={styles.modalBody}>{item.body}</Text>
            )}

            {/* TÉCNICA */}
            {item.type === 'tecnica' && (
              <View style={styles.modalTecnica}>
                {item.body && (
                  <Text style={styles.modalBody}>{item.body}</Text>
                )}
                {item.steps && item.steps.length > 0 && (
                  <View style={styles.stepsContainer}>
                    <Text style={styles.stepsTitle}>Passo a passo</Text>
                    {item.steps.map((step, i) => (
                      <View key={i} style={styles.stepRow}>
                        <View style={[styles.stepNumber, { backgroundColor: item.accentColor }]}>
                          <Text style={styles.stepNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* VÍDEO */}
            {item.type === 'video' && item.youtubeId && (
              <View style={styles.videoContainer}>
                <Text style={styles.modalBody}>
                  Toque no botão abaixo para assistir no YouTube. O vídeo tem legenda em português.
                </Text>
                <TouchableOpacity
  style={styles.videoBtn}
  activeOpacity={0.8}
  onPress={() =>
    handlePress(() => Linking.openURL(`https://www.youtube.com/watch?v=${item.youtubeId}`))
  }
>
                  <LinearGradient
                    colors={['#F27A5E', '#D05030']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.videoBtnGradient}
                  >
                    <Text style={styles.videoBtnText}>▶  Assistir no YouTube</Text>
                  </LinearGradient>
                </TouchableOpacity>
                {item.readTime && (
                  <Text style={styles.videoDuration}>Duração: ~{item.readTime}</Text>
                )}
              </View>
            )}

          </ScrollView>
        </View>
      </Modal>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Parte 1 — Header + Frase do dia — altura natural, nunca cresce */}
      <View style={styles.topSection}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backBtnText}>← Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.headerLabel}>CLASSE</Text>
            <Text style={styles.headerSub}>Conhecimento que funciona</Text>
          </View>

          {/* Frase do dia */}
          <TouchableOpacity
            style={styles.dailyCard}
            activeOpacity={0.82}
            onPress={() => handlePress(() => openItem(DAILY_QUOTE))}
          >
            <LinearGradient
              colors={['rgba(245,197,24,0.18)', 'rgba(245,197,24,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dailyGradient}
            >
              <View style={styles.dailyTopRow}>
                <View style={[styles.typeTag, { backgroundColor: 'rgba(245,197,24,0.2)' }]}>
                  <Text style={[styles.typeTagText, { color: '#F5C518' }]}>✨  FRASE DO DIA</Text>
                </View>
              </View>
              <Text style={styles.dailyQuote} numberOfLines={3}>
                "{DAILY_QUOTE.quote}"
              </Text>
              <Text style={styles.dailyAuthor}>— {DAILY_QUOTE.author}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Parte 2 — Filtros — altura fixa, nunca muda */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  activeCategory === cat.key && styles.filterChipActive,
                ]}
                onPress={() => setActiveCategory(cat.key)}
              >
                <Text style={[
                  styles.filterChipText,
                  activeCategory === cat.key && styles.filterChipTextActive,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Parte 3 — Grade de cards — ocupa o resto, rola independente */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* Cards em duas colunas, frases ocupam largura total */}
        {(() => {
          const rows: JSX.Element[] = [];
          let i = 0;
          while (i < filtered.length) {
            const item = filtered[i];
            if (item.type === 'frase') {
              rows.push(
                <View key={item.id} style={styles.gridRow}>
                  {renderCard(item, i)}
                </View>
              );
              i++;
            } else {
              const next = filtered[i + 1];
              if (next && next.type !== 'frase') {
                rows.push(
                  <View key={item.id + next.id} style={styles.gridRow}>
                    {renderCard(item, i)}
                    {renderCard(next, i + 1)}
                  </View>
                );
                i += 2;
              } else {
                rows.push(
                  <View key={item.id} style={styles.gridRow}>
                    {renderCard(item, i)}
                    <View style={styles.cardHalf} />
                  </View>
                );
                i++;
              }
            }
          }
          return rows;
        })()}
      </ScrollView>

      {renderModal()}
    </View>
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

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 4,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backBtnText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 15,
    color: '#3D54D9',
  },
  headerLabel: {
    fontSize: 11,
    fontFamily: 'Rubik_700Bold',
    color: colors.primary,
    letterSpacing: 3,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },

  // ── Frase do dia ─────────────────────────────────────────────────────────
  dailyCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)',
    marginBottom: 16,
  },
  dailyGradient: {
    padding: 20,
    gap: 10,
  },
  dailyTopRow: {
    flexDirection: 'row',
  },
  dailyQuote: {
    fontSize: 16,
    fontFamily: 'Rubik_500Medium',
    color: '#FFFFFF',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  dailyAuthor: {
    fontSize: 12,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(245,197,24,0.7)',
  },

  // ── Filtros ───────────────────────────────────────────────────────────────
  topSection: {
    flexShrink: 0,
  },
  filtersWrapper: {
    height: 52,
    justifyContent: 'center',
    marginBottom: 4,
  },
  filtersRow: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    height: 36,
    minHeight: 36,
    maxHeight: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Rubik_500Medium',
    color: 'rgba(255,255,255,0.75)',
    includeFontPadding: false,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Rubik_600SemiBold',
  },

  // ── Grade ─────────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.backgroundCard,
    padding: 16,
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  cardHalf: {
    width: CARD_WIDTH,
    minHeight: 160,
  },
  cardFullWidth: {
    flex: 1,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 9,
    fontFamily: 'Rubik_700Bold',
    letterSpacing: 1,
  },
  cardEmoji: {
    fontSize: 28,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },
  cardReadTime: {
    fontSize: 11,
    fontFamily: 'Rubik_500Medium',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  cardQuotePreview: {
    fontSize: 12,
    fontFamily: 'Rubik_400Regular',
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 3,
    height: 40,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 18,
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Rubik_500Medium',
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 12,
  },
  modalEmoji: {
    fontSize: 44,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 26,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 15,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    marginVertical: 8,
    borderRadius: 1,
  },
  modalBody: {
    fontSize: 16,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 26,
  },

  // Frase
  modalQuoteContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  modalQuoteMark: {
    fontSize: 64,
    fontFamily: 'Rubik_700Bold',
    lineHeight: 56,
    opacity: 0.6,
  },
  modalQuote: {
    fontSize: 22,
    fontFamily: 'Rubik_500Medium',
    color: '#FFFFFF',
    lineHeight: 32,
    fontStyle: 'italic',
  },
  modalAuthor: {
    fontSize: 14,
    fontFamily: 'Rubik_500Medium',
    marginTop: 8,
  },

  // Técnica
  modalTecnica: {
    gap: 20,
  },
  stepsContainer: {
    gap: 14,
  },
  stepsTitle: {
    fontSize: 13,
    fontFamily: 'Rubik_700Bold',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 13,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 23,
  },

  // Vídeo
  videoContainer: {
    gap: 20,
  },
  videoBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  videoBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  videoBtnText: {
    fontSize: 16,
    fontFamily: 'Rubik_600SemiBold',
    color: '#FFFFFF',
  },
  videoDuration: {
    fontSize: 12,
    fontFamily: 'Rubik_400Regular',
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
});
