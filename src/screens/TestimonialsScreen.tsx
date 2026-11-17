import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TestimonialsScreenProps {
  onNext: () => void;
  onBack: () => void;
}


const TESTIMONIALS = [
  {
    name: 'Rafael Mendes',
    photo: require('../assets/testimonials/rafael.jpg'),
    headline: 'Melhorei minha vida de forma drástica',
    body: 'Resetar meu equilíbrio de dopamina, parando com conteúdo muito estimulante, melhorou minha motivação, estabilidade emocional e prazer nas coisas simples do dia a dia.',
  },
  {
    name: 'Pedro Alves',
    photo: require('../assets/testimonials/pedro.jpg'),
    headline: 'Esse tipo de conteúdo não tem nada de bom',
    body: 'Ele não tem nenhum papel educativo. É só uma janela aberta para um mercado que traz vazio e dependência, sem nenhum benefício real.',
  },
  {
    name: 'Lucas',
    photo: require('../assets/testimonials/lucas.jpg'),
    headline: 'Parar me permitiu mudar meu jeito de ver as coisas pequenas da vida',
    body: 'Eu estava chegando à conclusão de que a vida era chata e sem sentido. Parar me permitiu mudar minha mentalidade sobre as pequenas coisas.',
  },
  {
    name: 'Finch',
    photo: require('../assets/testimonials/finch.jpg'),
    headline: 'Estou finalmente vivendo meu potencial e é incrível',
    body: 'Meu foco e produtividade no trabalho melhoraram muito. Estou finalmente chegando no meu potencial e a sensação é incrível.',
  },
  {
    name: 'Anônimo',
    photo: require('../assets/testimonials/anonimo1.jpg'),
    headline: 'A vida voltou a ter cor, e estou animado com o futuro',
    body: 'Estou redescobrir hobbies e interesses que tinha esquecido. A vida voltou a ter cor, e estou animado com o que vem pela frente.',
  },
  {
    name: 'Anônimo',
    photo: require('../assets/testimonials/anonimo2.jpg'),
    headline: 'Estou mais presente nas conversas',
    body: 'Meus relacionamentos com amigos e família ficaram mais profundos. Estou mais presente nas conversas, e as pessoas ao redor perceberam a mudança.',
  },
  {
    name: 'Anônimo',
    photo: require('../assets/testimonials/anonimo3.jpg'),
    headline: 'Essa decisão mudou minha vida de formas que nunca imaginei',
    body: 'Um ano depois, posso dizer com certeza que essa decisão mudou minha vida para melhor de formas que nunca imaginei. A jornada não foi fácil, mas valeu cada passo.',
  },
];

const AVATAR_COLORS = ['#3D54D9', '#F27A5E', '#4A9C52', '#F5C518', '#9B59B6', '#E67E22'];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function Avatar({ photo }: { photo: any }) {
  return (
    <Image
      source={photo}
      style={styles.avatar}
    />
  );
}

function VerifiedBadge() {
  return (
    <View style={styles.verifiedBadge}>
      <Text style={styles.verifiedCheck}>✓</Text>
    </View>
  );
}

function TestimonialCard({ item }: { item: typeof TESTIMONIALS[0] }) {
  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardHeader}>
        <Avatar photo={item.photo} />
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.name}</Text>
          <VerifiedBadge />
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.headline}>{item.headline}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </View>
  );
}

export default function TestimonialsScreen({ onNext, onBack }: TestimonialsScreenProps) {
  const insets = useSafeAreaInsets();
const isProcessing = useRef(false);

function handlePress(fn: () => void) {
  if (isProcessing.current) return;
  isProcessing.current = true;
  fn();
  setTimeout(() => { isProcessing.current = false; }, 500);
}
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { marginTop: insets.top + 12 }]}>
      <TouchableOpacity
  onPress={() => handlePress(onBack)}
  style={styles.backButton}
  activeOpacity={0.8}
>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={[StyleSheet.absoluteFill, styles.titleContainer]} pointerEvents="none">
          <Text style={styles.headerTitle}>Benefícios da Mudança</Text>
        </View>
      </View>

      {/* Lista */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 96 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {TESTIMONIALS.map((item, index) => (
          <TestimonialCard key={index} item={item} />
        ))}
      </ScrollView>

      {/* CTA fixo */}
      <View style={[styles.ctaWrapper, { bottom: 0 }]}>
      <TouchableOpacity
  style={styles.ctaButton}
  onPress={() => handlePress(onNext)}
  activeOpacity={0.8}
>
          <Text style={styles.ctaText}>Continuar</Text>
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
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(61,84,217,0.08)',
    borderWidth: 1,
    borderColor: '#1A2240',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  backIcon: {
    fontSize: 18,
    color: '#E0EAFF',
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 20,
    color: '#E0EAFF',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Card wrapper
  cardWrapper: { marginBottom: 24 },

  // Linha do autor
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1A2240',
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarLetter: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 15,
    color: '#E0EAFF',
  },

  // Selo verificado
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4A9C52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    fontSize: 10,
    color: '#E0EAFF',
    fontWeight: 'bold',
    lineHeight: 13,
  },

  // Card
  card: {
    backgroundColor: '#0F1420',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  headline: {
    fontFamily: 'Rubik_500Medium',
    fontWeight: 'bold',
    fontSize: 17,
    color: '#E0EAFF',
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 8,
    lineHeight: 22,
  },

  // CTA fixo
  ctaWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#080C14',
    borderTopWidth: 1,
    borderTopColor: '#1A2240',
  },
  ctaButton: {
    backgroundColor: '#3D54D9',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 17,
    color: '#E0EAFF',
  },
});
