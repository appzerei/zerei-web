import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/theme';

interface Props {
  navigation?: { goBack: () => void; navigate: (screen: string) => void };
}

export default function ZaraEmConstrucaoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const isProcessing = useRef(false);

  const ir = (tela: string): void => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    navigation?.navigate(tela);
    setTimeout(() => { isProcessing.current = false; }, 500);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => ir('Dashboard')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Volta para o início do app"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Circle cx={60} cy={60} r={56} fill="rgba(61,84,217,0.12)" />
          <Circle cx={60} cy={60} r={38} fill="rgba(61,84,217,0.28)" />
          <Circle cx={60} cy={60} r={20} fill={colors.primary} />
          <Circle cx={86} cy={34} r={6} fill={colors.accentCoral} />
        </Svg>

        <Text style={styles.title}>A Zara está{'\n'}em construção.</Text>
        <Text style={styles.body}>
          Estamos preparando ela com cuidado para que ajude de verdade. Quando
          estiver pronta, ela aparece aqui.
        </Text>
        <Text style={styles.body}>
          Enquanto isso, se bater a vontade, o Botão de Pânico está pronto
          para te ajudar agora.
        </Text>
        <Text style={styles.cvv}>
          Se você está passando por um sofrimento muito intenso, o CVV atende
          24 horas pelo 188.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => ir('PanicButton')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Abrir o Botão de Pânico"
        >
          <Text style={styles.btnPrimaryText}>Abrir o Botão de Pânico</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => ir('Dashboard')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao início"
        >
          <Text style={styles.btnSecondaryText}>Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(61,84,217,0.08)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.text },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
  },
  body: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(224,234,255,0.75)',
    textAlign: 'center',
  },
  cvv: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(224,234,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: { paddingHorizontal: 24, gap: 12 },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 17,
    color: colors.text,
  },
  btnSecondary: {
    backgroundColor: 'rgba(61,84,217,0.12)',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: colors.text,
  },
});