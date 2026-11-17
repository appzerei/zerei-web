import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Props {
  onNext: () => void;
  onBack: () => void;
}

interface Question {
  id: number;
  title: string;
  text: string;
  options: string[];
  useScroll: boolean;
}

interface OptionsListProps {
  options: string[];
  selectedOption: number | null;
  onSelect: (index: number) => void;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: 'Pergunta #1',
    text: 'Qual é o seu gênero?',
    options: ['Masculino', 'Feminino', 'Prefiro não dizer'],
    useScroll: false,
  },
  {
    id: 2,
    title: 'Pergunta #2',
    text: 'Com que frequência você consome pornografia?',
    options: ['Raramente', 'Uma vez por semana', 'Todos os dias', 'Várias vezes ao dia'],
    useScroll: false,
  },
  {
    id: 3,
    title: 'Pergunta #3',
    text: 'Como você ficou sabendo do ZEREI?',
    options: ['📸  Instagram', '🎵  TikTok', '✖️  X (Twitter)', '📘  Facebook', '🔍  Google', '📺  TV / Outro'],
    useScroll: true,
  },
  {
    id: 4,
    title: 'Pergunta #4',
    text: 'O hábito já afetou o seu sono ou sua rotina?',
    options: ['Sim, com frequência', 'Às vezes', 'Raramente', 'Nunca percebi'],
    useScroll: false,
  },
  {
    id: 5,
    title: 'Pergunta #5',
    text: 'Você já tentou parar ou reduzir e não conseguiu?',
    options: ['Sim', 'Não'],
    useScroll: false,
  },
  {
    id: 6,
    title: 'Pergunta #6',
    text: 'Esse hábito já afetou seus relacionamentos pessoais?',
    options: ['Sim, claramente', 'Talvez, não tenho certeza', 'Não'],
    useScroll: false,
  },
  {
    id: 7,
    title: 'Pergunta #7',
    text: 'Você percebe que precisa de estímulos cada vez mais intensos para sentir o mesmo efeito?',
    options: ['Sim, definitivamente', 'Um pouco', 'Não'],
    useScroll: false,
  },
  {
    id: 8,
    title: 'Pergunta #8',
    text: 'O que te faz querer mudar esse hábito?',
    options: [
      'Quero me sentir mais presente',
      'Quero melhorar meus relacionamentos',
      'Quero ter mais energia e foco',
      'Quero me respeitar mais',
    ],
    useScroll: false,
  },
  {
    id: 9,
    title: 'Pergunta #9',
    text: 'Você já tentou mudar esse comportamento antes?',
    options: ['Sim, várias vezes', 'Sim, uma ou duas vezes', 'Nunca tentei de verdade'],
    useScroll: false,
  },
  {
    id: 10,
    title: 'Pergunta #10',
    text: 'Você já gastou dinheiro para acessar esse tipo de conteúdo?',
    options: ['Sim', 'Não'],
    useScroll: false,
  },
];

function OptionsList({ options, selectedOption, onSelect }: OptionsListProps): React.ReactElement {
  return (
    <>
      {options.map((option, index) => {
        const isSelected = selectedOption === index;
        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.8}
            onPress={() => onSelect(index)}
            style={[
              styles.optionWrapper,
              isSelected && styles.optionSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={option}
            accessibilityHint={isSelected ? 'Opção selecionada' : 'Seleciona esta resposta e avança para a próxima pergunta'}
          >
            <LinearGradient
              colors={isSelected ? ['#0F1A2E', '#0A1428'] : ['#0F1420', '#0C1228']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.optionGradient}
            >
              <View style={[styles.optionBadge, isSelected && styles.optionBadgeSelected]}>
                <Text style={styles.optionBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
              {isSelected && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

export default function QuizScreen({ onNext, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const progressAnim = useRef(new Animated.Value(1 / 10)).current;
  const isProcessing = useRef<boolean>(false);

  const question = QUESTIONS[currentQuestion];

  const animateProgress = (nextIndex: number): void => {
    Animated.timing(progressAnim, {
      toValue: (nextIndex + 1) / 10,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSelect = (index: number): void => {
    if (selectedOption !== null) return;
    if (isProcessing.current) return;
    isProcessing.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOption(index);

    setTimeout(() => {
      if (currentQuestion === 9) {
        onNext();
      } else {
        const next = currentQuestion + 1;
        animateProgress(next);
        setCurrentQuestion(next);
        setSelectedOption(null);
      }
      isProcessing.current = false;
    }, 300);
  };

  const handleBack = (): void => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 500);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentQuestion === 0) {
      onBack();
    } else {
      const prev = currentQuestion - 1;
      animateProgress(prev - 1 >= 0 ? prev : 0);
      setCurrentQuestion(prev);
      setSelectedOption(null);
    }
  };

  const handleSkip = (): void => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setTimeout(() => { isProcessing.current = false; }, 500);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentQuestion === 9) {
      onNext();
    } else {
      const next = currentQuestion + 1;
      animateProgress(next);
      setCurrentQuestion(next);
      setSelectedOption(null);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080C14' }]} />
        <View style={styles.grain} />
      </View>

      {/* Header */}
      <View style={[styles.header, { marginTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint={currentQuestion === 0 ? 'Retorna à tela anterior' : 'Volta para a pergunta anterior'}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFillWrapper, { width: progressWidth }]}>
            <LinearGradient
              colors={['#3D54D9', '#293CA6', '#3D54D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <View style={styles.langBadge}>
          <Text style={styles.langText}>🇧🇷 PT</Text>
        </View>
      </View>

      {/* Conteúdo */}
      {question.useScroll ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.questionTitle}>{question.title}</Text>
          <Text style={styles.questionText}>{question.text}</Text>
          <View style={styles.optionsContainer}>
            <OptionsList
              options={question.options}
              selectedOption={selectedOption}
              onSelect={handleSelect}
            />
          </View>
          <TouchableOpacity
            onPress={handleSkip}
            style={[styles.skipButton, { marginBottom: 40 + insets.bottom }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Pular pergunta"
            accessibilityHint="Avança para a próxima pergunta sem responder"
          >
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.staticContent}>
          <View style={styles.textBlock}>
            <Text style={styles.questionTitle}>{question.title}</Text>
            <Text style={styles.questionText}>{question.text}</Text>
          </View>
          <View style={styles.optionsContainer}>
            <OptionsList
              options={question.options}
              selectedOption={selectedOption}
              onSelect={handleSelect}
            />
          </View>
          <TouchableOpacity
            onPress={handleSkip}
            style={[styles.skipButton, { marginBottom: 40 + insets.bottom }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Pular pergunta"
            accessibilityHint="Avança para a próxima pergunta sem responder"
          >
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3D54D9',
    opacity: 0.02,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  backIcon: {
    fontSize: 22,
    color: '#E0EAFF',
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#1A2240',
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFillWrapper: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  langBadge: {
    backgroundColor: '#0F1420',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 20,
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  langText: {
    color: '#E0EAFF',
    fontSize: 13,
    fontFamily: 'Rubik_400Regular',
  },

  // Conteúdo estático
  staticContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  textBlock: {
    marginTop: 40,
  },
  questionTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 30,
    color: '#E0EAFF',
  },
  questionText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 18 * 1.45,
    marginTop: 14,
  },
  optionsContainer: {
    marginTop: 28,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  // Opções
  optionWrapper: {
    borderRadius: 32,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.2)',
    overflow: 'hidden',
  },
  optionSelected: {
    borderColor: 'rgba(61,84,217,0.7)',
  },
  optionGradient: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  optionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3D54D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionBadgeSelected: {
    backgroundColor: '#4A9C52',
  },
  optionBadgeText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 14,
    color: '#E0EAFF',
    fontWeight: 'bold',
  },
  optionText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 17,
    color: '#E0EAFF',
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    color: '#4A9C52',
    marginLeft: 8,
  },

  // Skip
  skipButton: {
    alignItems: 'center',
    marginTop: 40,
  },
  skipText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
