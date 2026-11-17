import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onClose: () => void;
}

const TOPICOS = [
  {
    icon: 'flag-outline' as const,
    titulo: 'Meta alcançável',
    desc: 'Você está se comprometendo só por hoje. Um dia de cada vez.',
  },
  {
    icon: 'sunny-outline' as const,
    titulo: 'Viva normalmente',
    desc: 'Siga seu dia como sempre. O juramento já foi feito.',
  },
  {
    icon: 'trophy-outline' as const,
    titulo: 'O sucesso é inevitável',
    desc: 'As primeiras semanas são as mais difíceis. Depois fica mais fácil.',
  },
];

export default function JureiScreen({ onClose }: Props) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#04070F', '#080C14', '#060912']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} activeOpacity={0.8} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Jurei</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ícone grande */}
        <View style={styles.iconWrap}>
          <Ionicons name="hand-left-outline" size={44} color="#3D54D9" />
        </View>

        <Text style={styles.title}>Faça um juramento hoje</Text>
        <Text style={styles.subtitle}>
          Comprometa-se a se manter firme por hoje. Você receberá um lembrete em 24h.
        </Text>

        {/* Tópicos */}
        <View style={styles.topicos}>
          {TOPICOS.map((t, i) => (
            <View key={i} style={styles.topico}>
              <View style={styles.topicoIconWrap}>
                <Ionicons name={t.icon} size={22} color="#3D54D9" />
              </View>
              <View style={styles.topicoTexto}>
                <Text style={styles.topicoTitulo}>{t.titulo}</Text>
                <Text style={styles.topicoDesc}>{t.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Botão */}
        <TouchableOpacity
          style={styles.mainBtn}
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onClose();
          }}
        >
          <LinearGradient colors={['#3D54D9', '#293CA6']} style={styles.mainBtnGradient}>
            <Text style={styles.mainBtnText}>Jurar agora</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.cancelar}>
          <Text style={styles.cancelarText}>Agora não</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04070F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Rubik_400Regular',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 17,
    color: '#E0EAFF',
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 16,
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(61,84,217,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 44,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 26,
    color: '#E0EAFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
  },
  topicos: {
    width: '100%',
    gap: 20,
    marginBottom: 40,
  },
  topico: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  topicoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(61,84,217,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicoEmoji: {
    fontSize: 20,
  },
  topicoTexto: {
    flex: 1,
    gap: 4,
  },
  topicoTitulo: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 15,
    color: '#E0EAFF',
  },
  topicoDesc: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
  mainBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mainBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  mainBtnText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cancelar: {
    paddingVertical: 8,
  },
  cancelarText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },
});