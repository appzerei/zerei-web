import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

// ─── Dados dos cards ──────────────────────────────────────────────────────────
const LIBRARY_ITEMS = [
  {
    id: 'desafio',
    title: 'Desafio de 30 dias',
    subtitle: '30 dias pra largar a pornografia\ne seus malefícios',
    screen: 'Challenge',
    accentColor: '#3D54D9',
    numberLabel: '30',
    type: 'number' as const,
  },
  {
    id: 'soundscapes',
    title: 'Soundscapes',
    subtitle: null,
    screen: 'Soundscapes',
    accentColor: '#2A7A4B',
    imageKey: 'forest',
    type: 'image' as const,
    hasPlayButton: true,
  },
  {
    id: 'classe',
    title: 'Classe',
    subtitle: null,
    screen: 'Classe',
    accentColor: '#4A3520',
    imageKey: 'classroom',
    type: 'image' as const,
    hasPlayButton: false,
    buttonLabel: 'Começar Agora',
  },
  {
    id: 'zara',
    title: 'Zara - IA',
    subtitle: null,
    screen: 'ZARA',
    accentColor: '#1A1A2E',
    type: 'zara' as const,
    buttonLabel: 'Começar Agora',
  },
];

export default function LibraryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNavigate = (screen: string) => {
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#060912', '#080C14', '#0A0F1C']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.inner,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.title}>Biblioteca</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
        >
          {/* Card 1 — Desafio de 30 dias */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.card, styles.cardDesafio]}
            onPress={() => handleNavigate('Challenge')}
          >
            <LinearGradient
              colors={['#1A2580', '#0F1650', '#080C30']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Desafio de 30 dias</Text>
              <Text style={styles.cardSubtitle}>
                30 dias pra largar a pornografia{'\n'}e seus malefícios
              </Text>
              <TouchableOpacity
                style={styles.btnSmall}
                activeOpacity={0.8}
                onPress={() => handleNavigate('Challenge')}
              >
                <Text style={styles.btnSmallText}>Começar Agora</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.bigNumber}>30</Text>
          </TouchableOpacity>

          {/* Card 2 — Soundscapes */}
<TouchableOpacity
  activeOpacity={0.88}
  style={[styles.card, styles.cardSoundscapes]}
  onPress={() => handleNavigate('Soundscapes')}
>
<Image
  source={require('../assets/card_soundscapes.png')}
  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: 130 }}
  resizeMode="cover"
/>
  <LinearGradient
    colors={['rgba(8,12,20,0.5)', 'rgba(8,12,20,0.2)', 'transparent']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={StyleSheet.absoluteFill}
  />
            <View style={styles.cardContentRow}>
              <Text style={styles.cardTitleWhite}>Soundscapes</Text>
              <TouchableOpacity
                style={styles.btnPlay}
                activeOpacity={0.8}
                onPress={() => handleNavigate('Soundscapes')}
              >
                <Text style={styles.btnPlayIcon}>▶</Text>
                <Text style={styles.btnPlayText}> Start</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Card 3 — Classe */}
<TouchableOpacity
  activeOpacity={0.88}
  style={[styles.card, styles.cardClasse]}
  onPress={() => handleNavigate('Classe')}
>
<Image
  source={require('../assets/card_classe.png')}
  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: 130 }}
  resizeMode="cover"
/>
  <LinearGradient
    colors={['rgba(8,12,20,0.7)', 'rgba(8,12,20,0.35)', 'transparent']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={StyleSheet.absoluteFill}
  />
            <View style={styles.cardContentRow}>
              <Text style={styles.cardTitleWhite}>Classe</Text>
              <TouchableOpacity
                style={styles.btnSmallOutline}
                activeOpacity={0.8}
                onPress={() => handleNavigate('Classe')}
              >
                <Text style={styles.btnSmallOutlineText}>Começar Agora</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Card 4 — Zara IA */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.card, styles.cardZara]}
            onPress={() => handleNavigate('ZARA')}
          >
            <LinearGradient
              colors={['#050810', '#080C14', '#0A0F20']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.zaraRow}>
              <View style={styles.zaraLeft}>
                <Text style={styles.cardTitleWhite}>Zara - IA</Text>
                <TouchableOpacity
                  style={styles.btnSmallOutline}
                  activeOpacity={0.8}
                  onPress={() => handleNavigate('ZARA')}
                >
                  <Text style={styles.btnSmallOutlineText}>Começar Agora</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require('../assets/glob.png')}
                style={styles.zaraGlob}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  inner: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: '#E0EAFF',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },

  // ── Cards base ───────────────────────────────────────────────────────────────
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  // ── Card Desafio ─────────────────────────────────────────────────────────────
  cardDesafio: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 18,
    color: '#E0EAFF',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: 'rgba(224,234,255,0.6)',
    lineHeight: 18,
  },
  bigNumber: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 88,
    color: 'rgba(61,84,217,0.35)',
    lineHeight: 88,
    marginRight: -8,
  },

  // ── Card Soundscapes ─────────────────────────────────────────────────────────
  cardSoundscapes: {
    height: 130,
    justifyContent: 'flex-end',
  },
  cardContentRow: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 10,
  },

  // ── Card Classe ───────────────────────────────────────────────────────────────
  cardClasse: {
    height: 130,
    justifyContent: 'flex-end',
  },

  // ── Card Zara ─────────────────────────────────────────────────────────────────
  cardZara: {
    height: 130,
  },
  zaraRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  zaraLeft: {
    flex: 1,
    gap: 10,
  },
  zaraGlob: {
    width: 100,
    height: 100,
    marginRight: -10,
  },

  // ── Textos dos cards ──────────────────────────────────────────────────────────
  cardTitleWhite: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // ── Botões ────────────────────────────────────────────────────────────────────
  btnSmall: {
    alignSelf: 'flex-start',
    backgroundColor: '#3D54D9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginTop: 4,
  },
  btnSmallText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  btnSmallOutline: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(61,84,217,0.25)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.5)',
  },
  btnSmallOutlineText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 12,
    color: '#E0EAFF',
  },
  btnPlay: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
  },
  btnPlayIcon: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  btnPlayText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
});
