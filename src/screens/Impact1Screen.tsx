import React, { useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const PARTICLES = [
  { top: 0.04, left: 0.12, size: 2,   color: '#3D54D9', opacity: 0.35 },
  { top: 0.07, left: 0.78, size: 1.5, color: '#E0EAFF', opacity: 0.20 },
  { top: 0.11, left: 0.45, size: 2.5, color: '#3D54D9', opacity: 0.28 },
  { top: 0.09, left: 0.92, size: 1.5, color: '#E0EAFF', opacity: 0.18 },
  { top: 0.15, left: 0.28, size: 2,   color: '#3D54D9', opacity: 0.40 },
  { top: 0.18, left: 0.65, size: 3,   color: '#3D54D9', opacity: 0.30 },
  { top: 0.22, left: 0.08, size: 1.5, color: '#E0EAFF', opacity: 0.20 },
  { top: 0.20, left: 0.55, size: 2,   color: '#3D54D9', opacity: 0.32 },
  { top: 0.26, left: 0.85, size: 2.5, color: '#E0EAFF', opacity: 0.18 },
  { top: 0.31, left: 0.38, size: 1.5, color: '#3D54D9', opacity: 0.28 },
  { top: 0.33, left: 0.72, size: 2,   color: '#E0EAFF', opacity: 0.18 },
  { top: 0.35, left: 0.18, size: 3,   color: '#3D54D9', opacity: 0.35 },
  { top: 0.40, left: 0.95, size: 1.5, color: '#E0EAFF', opacity: 0.20 },
  { top: 0.38, left: 0.50, size: 2,   color: '#3D54D9', opacity: 0.30 },
  { top: 0.44, left: 0.03, size: 2.5, color: '#3D54D9', opacity: 0.28 },
  { top: 0.47, left: 0.82, size: 2,   color: '#E0EAFF', opacity: 0.18 },
  { top: 0.50, left: 0.30, size: 1.5, color: '#3D54D9', opacity: 0.32 },
  { top: 0.53, left: 0.60, size: 3,   color: '#3D54D9', opacity: 0.25 },
  { top: 0.56, left: 0.15, size: 2,   color: '#E0EAFF', opacity: 0.18 },
  { top: 0.60, left: 0.42, size: 2.5, color: '#3D54D9', opacity: 0.35 },
  { top: 0.58, left: 0.90, size: 1.5, color: '#E0EAFF', opacity: 0.18 },
  { top: 0.63, left: 0.70, size: 2,   color: '#3D54D9', opacity: 0.30 },
  { top: 0.66, left: 0.25, size: 3,   color: '#3D54D9', opacity: 0.32 },
  { top: 0.69, left: 0.55, size: 1.5, color: '#E0EAFF', opacity: 0.18 },
  { top: 0.72, left: 0.08, size: 2,   color: '#3D54D9', opacity: 0.28 },
  { top: 0.70, left: 0.88, size: 2.5, color: '#E0EAFF', opacity: 0.18 },
  { top: 0.75, left: 0.35, size: 2,   color: '#3D54D9', opacity: 0.38 },
  { top: 0.78, left: 0.65, size: 1.5, color: '#3D54D9', opacity: 0.28 },
  { top: 0.80, left: 0.50, size: 3,   color: '#E0EAFF', opacity: 0.18 },
  { top: 0.83, left: 0.20, size: 2,   color: '#3D54D9', opacity: 0.32 },
  { top: 0.82, left: 0.75, size: 2.5, color: '#3D54D9', opacity: 0.28 },
  { top: 0.86, left: 0.40, size: 1.5, color: '#E0EAFF', opacity: 0.18 },
  { top: 0.88, left: 0.92, size: 2,   color: '#3D54D9', opacity: 0.35 },
  { top: 0.91, left: 0.10, size: 3,   color: '#3D54D9', opacity: 0.25 },
  { top: 0.90, left: 0.58, size: 1.5, color: '#E0EAFF', opacity: 0.18 },
  { top: 0.94, left: 0.30, size: 2,   color: '#3D54D9', opacity: 0.32 },
  { top: 0.93, left: 0.80, size: 2.5, color: '#3D54D9', opacity: 0.28 },
  { top: 0.97, left: 0.48, size: 2,   color: '#E0EAFF', opacity: 0.18 },
  { top: 0.96, left: 0.15, size: 1.5, color: '#3D54D9', opacity: 0.38 },
  { top: 0.98, left: 0.70, size: 3,   color: '#3D54D9', opacity: 0.25 },
];

interface Props {
  onNext: () => void;
  onLogin: () => void;
}

export default function Impact1Screen({ onNext, onLogin }: Props) {
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

      <LinearGradient
        colors={['#080C14', '#0C1120', '#080C14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlay} />

      {PARTICLES.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: p.top * height,
            left: p.left * width,
            width: p.size,
            height: p.size,
            borderRadius: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* ── Logo ── */}
      <View style={[styles.logoWrapper, { marginTop: insets.top + 16 }]}>
        <Text style={styles.logo}>ZEREI</Text>
      </View>

      {/* ── Conteúdo central ── */}
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.subtitle}>
        Vamos começar verificando se você tem algum problema com pornografia.
        </Text>

        <View style={styles.socialProof}>
        <View style={styles.starsRow}>
  {[0,1,2,3,4].map((i) => (
    <Image
      key={i}
      source={require('../assets/star1.png')}
      style={styles.star}
    />
  ))}
</View>

          <Text style={styles.socialText}>4.9 · Mais de 17.538 usuários</Text>
        </View>
      </View>

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>

        <TouchableOpacity
  style={styles.btnPrimary}
  onPress={() => handlePress(onNext)}
  activeOpacity={0.8}
  accessibilityRole="button"
  accessibilityLabel="Começar"
  accessibilityHint="Inicia o processo de cadastro"
>
          <Text style={styles.btnPrimaryText}>Começar</Text>
          <View style={styles.btnArrow}>
            <Text style={styles.btnArrowText}>›</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
  style={styles.btnSecondary}
  onPress={() => handlePress(onLogin)}
  activeOpacity={0.8}
>
          <Text style={styles.btnSecondaryText}>Já tenho uma conta</Text>
        </TouchableOpacity>

        <View style={styles.termsRow}>
          <Text style={styles.termsText}>Ao continuar, você concorda com os nossos </Text>
          <Text style={styles.termsLink}>Termos de Uso</Text>
          <Text style={styles.termsText}> e </Text>
          <Text style={styles.termsLink}>Política de Privacidade</Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61,84,217,0.03)',
  },

  // Logo
  logoWrapper: {
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 22,
    color: '#E0EAFF',
    letterSpacing: 5,
  },

  // Conteúdo
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'flex-end',
    paddingBottom: 72,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 37,
    lineHeight: 45,
    color: '#E0EAFF',
  },
  subtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 18,
    lineHeight: 28,
    color: '#FFFFFF',
    marginTop: 12,
  },

  // Social proof
  socialProof: {
    marginTop: 32,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 7,
  },
  star: {
    width: 32,
    height: 32,
  },
  socialText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    gap: 12,
  },

  // Botão primário
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 56,
    width: '100%',
    paddingHorizontal: 24,
    position: 'relative',
  },
  btnPrimaryText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 17,
    color: '#080C14',
  },
  btnArrow: {
    position: 'absolute',
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#293CA6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnArrowText: {
    fontSize: 22,
    color: '#E0EAFF',
    lineHeight: 26,
    marginTop: -2,
  },

  // Botão secundário
  btnSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#000000',
  },
  btnSecondaryText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Termos
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: 4,
  },
  termsText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: '#2A3A6A',
  },
  termsLink: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: '#3D54D9',
  },
});