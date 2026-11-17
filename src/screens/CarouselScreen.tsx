import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Ellipse,
  Circle,
  Path,
  Line,
  Rect,
} from 'react-native-svg';

const { width } = Dimensions.get('window');

interface CarouselScreenProps {
  onNext: () => void;
  onBack: () => void;
}

interface Slide {
  bgColors: [string, string, string];
  illustration: React.ReactElement;
  title: string;
  body: string;
  boldParts: string[];
  cta: string;
}

interface BodyTextProps {
  text: string;
  boldParts: string[];
}

function BrainIllustration(): React.ReactElement {
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Ellipse cx={90} cy={158} rx={52} ry={10} fill="#000000" opacity={0.2} />
      <Path
        d="M90,30 C55,30 30,52 30,80 C30,100 40,114 56,122 C58,138 70,148 82,148 L98,148 C110,148 122,138 124,122 C140,114 150,100 150,80 C150,52 125,30 90,30 Z"
        fill="#FCA5A5"
      />
      <Path d="M70,55 C70,55 75,68 70,80" stroke="#F87171" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M90,48 C90,48 98,62 90,76" stroke="#F87171" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M110,55 C110,55 105,68 110,80" stroke="#F87171" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M60,88 C68,82 82,88 90,82 C98,76 112,82 120,88" stroke="#F87171" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M55,104 C65,98 80,106 90,100 C100,94 115,102 125,96" stroke="#F87171" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d="M90,30 L90,148" stroke="#F87171" strokeWidth={2} fill="none" opacity={0.4} />
    </Svg>
  );
}

function HeartIllustration(): React.ReactElement {
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Ellipse cx={90} cy={158} rx={50} ry={9} fill="#000000" opacity={0.2} />
      <Path
        d="M90,140 C90,140 38,104 38,72 C38,52 52,38 68,38 C78,38 87,44 90,52"
        fill="#D1D5DB"
      />
      <Path
        d="M90,140 C90,140 142,104 142,72 C142,52 128,38 112,38 C102,38 93,44 90,52"
        fill="#D1D5DB"
      />
      <Path
        d="M90,52 L85,80 L95,95 L83,115 L90,140"
        stroke="#991B1B"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SadBlobIllustration(): React.ReactElement {
  return (
    <Svg width={160} height={180} viewBox="0 0 160 180">
      <Ellipse cx={80} cy={162} rx={42} ry={8} fill="#000000" opacity={0.2} />
      <Circle cx={80} cy={90} r={52} fill="#60A5FA" />
      <Circle cx={66} cy={84} r={5} fill="#1E3A8A" />
      <Circle cx={94} cy={84} r={5} fill="#1E3A8A" />
      <Path
        d="M68,106 C72,100 88,100 92,106"
        stroke="#1E3A8A"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <Rect x={62} y={138} width={10} height={22} rx={5} fill="#60A5FA" />
      <Rect x={88} y={138} width={10} height={22} rx={5} fill="#60A5FA" />
      <Line x1={80} y1={38} x2={80} y2={16} stroke="#60A5FA" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={80} cy={12} r={5} fill="#93C5FD" />
    </Svg>
  );
}

function GenderIllustration(): React.ReactElement {
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Ellipse cx={90} cy={166} rx={52} ry={9} fill="#000000" opacity={0.2} />
      <Circle cx={72} cy={88} r={44} fill="#F9A8D4" opacity={0.9} />
      <Circle cx={108} cy={88} r={44} fill="#93C5FD" opacity={0.9} />
      <Path
        d="M90,52 C100,62 100,114 90,124 C80,114 80,62 90,52 Z"
        fill="#E879F9"
        opacity={0.5}
      />
      <Line x1={72} y1={132} x2={72} y2={158} stroke="#DB2777" strokeWidth={3} strokeLinecap="round" />
      <Line x1={60} y1={148} x2={84} y2={148} stroke="#DB2777" strokeWidth={3} strokeLinecap="round" />
      <Line x1={140} y1={50} x2={118} y2={72} stroke="#1D4ED8" strokeWidth={3} strokeLinecap="round" />
      <Line x1={130} y1={44} x2={148} y2={44} stroke="#1D4ED8" strokeWidth={3} strokeLinecap="round" />
      <Line x1={148} y1={44} x2={148} y2={62} stroke="#1D4ED8" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

function PlantIllustration(): React.ReactElement {
  return (
    <Svg width={180} height={200} viewBox="0 0 180 200">
      <Ellipse cx={90} cy={178} rx={58} ry={14} fill="#78350F" />
      <Path
        d="M90,178 C90,178 90,120 90,100"
        stroke="#15803D"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Path
        d="M90,130 C72,118 55,108 58,90 C68,100 80,110 90,130 Z"
        fill="#22C55E"
      />
      <Path
        d="M90,120 C108,106 126,98 122,80 C112,92 100,104 90,120 Z"
        fill="#16A34A"
      />
      <Path
        d="M90,100 C78,80 75,60 90,50 C105,60 102,80 90,100 Z"
        fill="#22C55E"
      />
      <Circle cx={62} cy={100} r={10} fill="#F472B6" />
      <Circle cx={62} cy={100} r={5} fill="#FDE68A" />
      <Circle cx={118} cy={88} r={10} fill="#F472B6" />
      <Circle cx={118} cy={88} r={5} fill="#FDE68A" />
      <Circle cx={90} cy={46} r={12} fill="#FB7185" />
      <Circle cx={90} cy={46} r={6} fill="#FDE68A" />
    </Svg>
  );
}

const SLIDES: Slide[] = [
  {
    bgColors: ['#CC0000', '#CC0000', '#CC0000'],
    illustration: <BrainIllustration />,
    title: 'Pornô sequestrou seu cérebro',
    body: 'O pornô libera uma substância no cérebro chamada dopamina. Ela te faz sentir bem. É por isso que você sente prazer quando consome esse tipo de conteúdo.',
    boldParts: ['dopamina'],
    cta: 'Próximo',
  },
  {
    bgColors: ['#CC0000', '#CC0000', '#CC0000'],
    illustration: <HeartIllustration />,
    title: 'Pornô destrói relacionamentos',
    body: 'O pornô hábito reduz seu interesse por conexões reais e substitui pela necessidade de mais estímulo digital.',
    boldParts: ['conexões reais'],
    cta: 'Próximo',
  },
  {
    bgColors: ['#CC0000', '#CC0000', '#CC0000'],
    illustration: <SadBlobIllustration />,
    title: 'Te deixa pra baixo',
    body: 'O nível elevado de dopamina faz você precisar de cada vez mais pra sentir o mesmo prazer. É por isso que tantos usuários relatam se sentir apáticos, sem energia e isolados.',
    boldParts: ['apáticos, sem energia e isolados'],
    cta: 'Próximo',
  },
  {
    bgColors: ['#CC0000', '#CC0000', '#CC0000'],
    illustration: <GenderIllustration />,
    title: 'Pornô prejudica sua vida íntima',
    body: 'Mais de 50% das pessoas com esse hábito relatam perda de interesse em relações reais e uma queda geral na libido.',
    boldParts: ['50%', 'perda de interesse', 'queda geral na libido'],
    cta: 'Próximo',
  },
  {
    bgColors: ['#0F1A3A', '#132250', '#1A2E6A'],
    illustration: <PlantIllustration />,
    title: 'Tem saída',
    body: 'A recuperação é real. Ao quebrar esse ciclo, seu cérebro consegue resetar sua sensibilidade à dopamina, o que leva a relacionamentos mais saudáveis e mais energia pra vida.',
    boldParts: ['A recuperação é real', 'relacionamentos mais saudáveis', 'mais energia pra vida'],
    cta: 'Ver meu plano',
  },
];

function BodyText({ text, boldParts }: BodyTextProps): React.ReactElement {
  if (boldParts.length === 0) {
    return <Text style={styles.slideBody}>{text}</Text>;
  }

  const regex = new RegExp(
    `(${boldParts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'g'
  );
  const parts = text.split(regex);

  return (
    <Text style={styles.slideBody}>
      {parts.map((part, i) =>
        boldParts.includes(part)
          ? <Text key={i} style={styles.slideBodyBold}>{part}</Text>
          : <Text key={i}>{part}</Text>
      )}
    </Text>
  );
}

export default function CarouselScreen({ onNext }: CarouselScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const isProcessing = useRef<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const dotScales = useRef(
    SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1.2 : 1))
  ).current;

  const goToIndex = (index: number): void => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    dotScales.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === index ? 1.2 : 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    setCurrentIndex(index);
  };

  const handleNext = (): void => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 300);
    if (currentIndex === SLIDES.length - 1) {
      onNext();
    } else {
      goToIndex(currentIndex + 1);
    }
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }): void => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== currentIndex) {
      dotScales.forEach((anim, i) => {
        Animated.timing(anim, {
          toValue: i === index ? 1.2 : 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
      setCurrentIndex(index);
    }
  };

  const slide = SLIDES[currentIndex];

  return (
    <LinearGradient
      colors={slide.bgColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.logoWrapper, { marginTop: insets.top + 20 }]}>
        <Text style={styles.logo}>ZEREI</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.illustrationWrapper}>
              {s.illustration}
            </View>
            <View style={{ height: 40 }} />
            <Text style={styles.slideTitle}>{s.title}</Text>
            <View style={styles.bodyWrapper}>
              <BodyText text={s.body} boldParts={s.boldParts} />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              i === currentIndex ? styles.dotActive : styles.dotInactive,
              { transform: [{ scale: dotScales[i] }] },
            ]}
          />
        ))}
      </View>

      <View style={[styles.ctaWrapper, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleNext}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={slide.cta}
          accessibilityHint={slide.cta === 'Próximo' ? 'Avança para a próxima slide' : 'Navega para a tela de planos'}
        >
          <LinearGradient
            colors={['#3D54D9', '#293CA6'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {slide.cta} {'>'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 20,
    color: '#E0EAFF',
    letterSpacing: 3,
  },
  scrollView: {
    flexGrow: 0,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 20,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  slideTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: '#E0EAFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    paddingHorizontal: 4,
  },
  bodyWrapper: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  slideBody: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 17,
    color: 'rgba(224,234,255,0.80)',
    textAlign: 'center',
    lineHeight: 17 * 1.45,
  },
  slideBodyBold: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 17,
    color: '#E0EAFF',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    borderRadius: 99,
  },
  dotActive: {
    width: 8,
    height: 8,
    backgroundColor: '#3D54D9',
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(61,84,217,0.30)',
  },
  ctaWrapper: {
    paddingHorizontal: 28,
  },
  ctaButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  ctaGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 17,
    color: '#FFFFFF',
  },
});
