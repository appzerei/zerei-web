import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { PRICING } from '../constants'
import Purchases, { Package } from 'react-native-purchases'
import Constants from 'expo-constants'
import { purchasePackage, restorePurchases, ENTITLEMENT_ID } from '../lib/revenuecat'

const isExpoGo = Constants.appOwnership === 'expo' || Platform.OS === 'web'

type PaywallState = 'base' | 'loading' | 'discount' | 'freetrial'

interface PaywallScreenProps {
  onNext: () => void
  onBack: () => void
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const BG_COLORS: [string, string] = ['#0F1420', '#080C14']

export default function PaywallScreen({ onNext, onBack }: PaywallScreenProps) {
  const insets = useSafeAreaInsets()
  const [state, setState] = useState<PaywallState>('base')
  const freeTrialAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const [annualPkg, setAnnualPkg] = useState<Package | null>(null)
  const [monthlyPkg, setMonthlyPkg] = useState<Package | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  useEffect(() => {
    async function loadOfferings() {
      try {
        const offerings = await Purchases.getOfferings()
        const current = offerings.current
        if (current) {
          const annual  = current.availablePackages.find(p => p.packageType === 'ANNUAL')  ?? null
          const monthly = current.availablePackages.find(p => p.packageType === 'MONTHLY') ?? null
          setAnnualPkg(annual)
          setMonthlyPkg(monthly)
        }
      } catch (e) {
        logError('PaywallScreen.loadOfferings', e);
      }
    }
    loadOfferings()
  }, [])


  const isProcessingContinue  = useRef(false)
  const isProcessingResgatar  = useRef(false)
  const isProcessingFreeTrial = useRef(false)
  const isProcessingHeader    = useRef(false)


  useEffect(() => {
    if (state === 'freetrial') {
      Animated.spring(freeTrialAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start()
    } else {
      freeTrialAnim.setValue(SCREEN_HEIGHT)
    }
  }, [state])

  const handleContinue = async (pkg) => {
    if (isProcessingContinue.current) return
    isProcessingContinue.current = true
    setIsPurchasing(true)
    try {
      const isPremium = await purchasePackage(pkg);
      if (isPremium || isExpoGo) {
        onNext();
      }
    } catch (error) {
      Alert.alert(
        'Erro na compra',
        'Não foi possível completar a compra. Por favor, tente novamente.',
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setIsPurchasing(false)
      isProcessingContinue.current = false;
    }
  };

  const handleResgatar = async (pkg) => {
    if (isProcessingResgatar.current) return
    isProcessingResgatar.current = true
    setIsPurchasing(true)
    try {
      const isPremium = await purchasePackage(pkg);
      if (isPremium || isExpoGo) {
        onNext();
      }
    } catch (error) {
      Alert.alert(
        'Erro na compra',
        'Não foi possível completar a compra. Por favor, tente novamente.',
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setIsPurchasing(false)
      isProcessingResgatar.current = false;
    }
  };

  const isBase = state === 'base' || state === 'loading'
  const isDiscount = state === 'discount'

  return (
    <LinearGradient
      colors={BG_COLORS}
      style={styles.flex}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {isBase ? (
          <TouchableOpacity
            onPress={async () => {
              if (isProcessingHeader.current) return
              isProcessingHeader.current = true
              try {
                const customerInfo = await restorePurchases();
const hasPremium = customerInfo?.entitlements?.active[ENTITLEMENT_ID] !== undefined;
if (hasPremium) {
  Alert.alert(
    'Compras restauradas',
    'Sua assinatura foi restaurada com sucesso.',
    [{ text: 'OK', onPress: onNext }]
  );
} else {
  Alert.alert(
    'Nenhuma compra encontrada',
    'Não encontramos nenhuma assinatura ativa para restaurar.',
    [{ text: 'OK', style: 'cancel' }]
  );
}
              } catch (error) {
                Alert.alert(
                  'Erro ao restaurar',
                  'Não foi possível restaurar suas compras. Por favor, tente novamente.',
                  [{ text: 'OK', style: 'cancel' }]
                );
              } finally {
                setTimeout(() => { isProcessingHeader.current = false }, 500);
              }
            }}
            activeOpacity={0.8}
            style={styles.headerButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.headerRestore}>Restaurar compras</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              if (isProcessingHeader.current) return
              isProcessingHeader.current = true
              setState(isDiscount ? 'freetrial' : 'discount')
              setTimeout(() => { isProcessingHeader.current = false }, 500)
            }}
            activeOpacity={0.8}
            style={styles.headerButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerLogo}>ZEREI</Text>
        <View style={styles.headerButton} />
      </View>

      {/* CONTEÚDO BASE */}
      {isBase && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Adeus ao hábito,{'\n'}olá ZEREI.</Text>
            <Text style={styles.heroSubtitle}>
              Retome o controle da sua mente. Durma melhor, foque mais e sinta de
              novo o que é estar presente de verdade.
            </Text>
          </View>

          <LinearGradient
            colors={['#0F1420', '#080C14'] as [string, string]}
            style={styles.mockupCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.mockupLabel}>SEU PROGRESSO</Text>
            <Text style={styles.mockupDays}>0</Text>
            <Text style={styles.mockupDaysLabel}>dias de sequência</Text>
            <View style={styles.mockupBar}>
              <LinearGradient
                colors={['#3D54D9', '#F27A5E'] as [string, string]}
                style={styles.mockupBarFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.mockupBarCaption}>Sua jornada começa agora</Text>
          </LinearGradient>

          <TouchableOpacity
            onPress={() => handleResgatar(annualPkg)}
            activeOpacity={0.8}
            style={styles.ctaButton}
            disabled={isPurchasing}
          >
            {isPurchasing
              ? <ActivityIndicator color="#E0EAFF" />
              : <Text style={styles.ctaButtonText}>Continuar</Text>
            }
          </TouchableOpacity>

          <View style={styles.bulletsSection}>
            <Text style={styles.bulletsTitle}>Retome o controle</Text>
            <BulletItem emoji="🧠" text="Mente mais clara e pensamentos sem ruído" />
            <BulletItem emoji="😴" text="Sono de verdade — sem despertar às 3h da manhã" />
            <BulletItem emoji="🔥" text="Energia e motivação que você não sentia há anos" />
          </View>

          <View style={styles.testimonialCard}>
            <Text style={styles.starsRow}>★★★★★</Text>
            <Text style={styles.testimonialText}>
              "Tentei parar três vezes antes. Dessa vez chegou na semana 8 e não
              olho para trás. O app me manteve firme quando eu queria desistir."
            </Text>
            <Text style={styles.testimonialAuthor}>— Rodrigo, 27 anos</Text>
          </View>

          <View style={styles.discountCard}>
            <View style={styles.discountBadgeRow}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>🔥 80% OFF</Text>
              </View>
            </View>
            <Text style={styles.discountCardTitle}>Desconto Especial</Text>
            <Text style={styles.discountCardSubtitle}>
              Oferta disponível só agora, enquanto você ainda está aqui.
            </Text>
            <TouchableOpacity
              onPress={() => handleContinue(annualPkg)}
              activeOpacity={0.8}
              style={[styles.ctaButton, { marginTop: 16 }]}
            >
              <Text style={styles.ctaButtonText}>Quero esse desconto</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => handleResgatar(annualPkg)}
            activeOpacity={0.8}
            style={styles.ctaButton}
            disabled={isPurchasing}
          >
            {isPurchasing
              ? <ActivityIndicator color="#E0EAFF" />
              : <Text style={styles.ctaButtonText}>Continuar</Text>
            }
          </TouchableOpacity>

          <Text style={styles.microcopy}>Compra discreta · Cancele quando quiser</Text>
        </ScrollView>
      )}

      {/* CONTEÚDO DISCOUNT */}
      {isDiscount && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.discountScreenTitle}>
            ACOMPANHE SEU{'\n'}PROGRESSO
          </Text>
          <Text style={styles.discountScreenSubtitle}>
            Veja em tempo real como sua mente melhora a cada dia.
          </Text>

          <View style={styles.analyticsCard}>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>ECONOMIZE 80%</Text>
            </View>
            <View style={styles.statsRow}>
              <StatBox value="94%" label="Taxa de sucesso" />
              <View style={styles.statsDivider} />
              <StatBox value="21 dias" label="Para o hábito mudar" />
            </View>
            <View style={styles.analyticsDivider} />
            <View style={styles.planHighlight}>
              <View>
                <Text style={styles.planLabel}>ANUAL</Text>
                <Text style={styles.planPrice}>R$ 7,49</Text>
                <Text style={styles.planPriceCaption}>/mês · cobrado anualmente</Text>
              </View>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>MELHOR OPÇÃO</Text>
              </View>
            </View>
            <View style={styles.analyticsDivider} />
            <View style={styles.planSecondary}>
              <Text style={styles.planSecondaryLabel}>Mensal</Text>
              <Text style={styles.planSecondaryPrice}>R$ {PRICING.MONTHLY.toFixed(2).replace('.', ',')}/mês</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleResgatar(annualPkg)}
            activeOpacity={0.8}
            style={styles.ctaButton}
            disabled={isPurchasing}
          >
            {isPurchasing
              ? <ActivityIndicator color="#E0EAFF" />
              : <Text style={styles.ctaButtonText}>RESGATAR MINHA OFERTA</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (isProcessingFreeTrial.current) return
              isProcessingFreeTrial.current = true
              setState('freetrial')
              setTimeout(() => { isProcessingFreeTrial.current = false }, 500)
            }}
            activeOpacity={0.8}
            style={styles.freeTrialLink}
          >
            <Text style={styles.freeTrialLinkText}>Prefiro testar 3 dias grátis →</Text>
          </TouchableOpacity>

          <View style={styles.guaranteeBox}>
            <Text style={styles.guaranteeIcon}>🛡️</Text>
            <Text style={styles.guaranteeText}>
              Garantia de 7 dias. Se não gostar, devolvemos tudo — sem perguntas.
            </Text>
          </View>

          <Text style={styles.microcopy}>Compra discreta · Cancele quando quiser</Text>
        </ScrollView>
      )}

      {/* LOADING OVERLAY */}
      {state === 'loading' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E0EAFF" />
          <Text style={styles.loadingText}>Preparando sua oferta...</Text>
        </View>
      )}

      {/* FREE TRIAL MODAL */}
      <FreeTrialModal
        visible={state === 'freetrial'}
        freeTrialAnim={freeTrialAnim}
        insets={insets}
        onConfirm={onNext}
        onDismiss={() => setState('discount')}
      />
    </LinearGradient>
  )
}

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────

function BulletItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletEmoji}>{emoji}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

interface FreeTrialModalProps {
  visible: boolean
  freeTrialAnim: Animated.Value
  insets: ReturnType<typeof useSafeAreaInsets>
  onConfirm: () => void
  onDismiss: () => void
}

function FreeTrialModal({
  visible,
  freeTrialAnim,
  insets,
  onConfirm,
  onDismiss,
}: FreeTrialModalProps) {
  if (!visible) return null

  return (
    <Animated.View
      style={[
        styles.freeTrialContainer,
        { paddingBottom: insets.bottom + 24 },
        { transform: [{ translateY: freeTrialAnim }] },
      ]}
    >
      <View style={styles.offerTagRow}>
        <View style={styles.offerTag}>
          <Text style={styles.offerTagText}>OFERTA ÚNICA</Text>
        </View>
      </View>

      <LinearGradient
        colors={['#3D54D9', '#293CA6'] as [string, string]}
        style={styles.trialBadge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.trialBadgeDays}>{PRICING.TRIAL_DAYS}</Text>
        <Text style={styles.trialBadgeLabel}>DIAS{'\n'}GRÁTIS</Text>
      </LinearGradient>

      <Text style={styles.trialTitle}>Experimente o ZEREI{'\n'}por 3 dias</Text>
      <Text style={styles.trialSubtitle}>{PRICING.TRIAL_DAYS} dias grátis, depois R$ {PRICING.ANNUAL.toFixed(2).replace('.', ',')}/ano</Text>
      <Text style={styles.trialNote}>Sem cobrança agora</Text>

      <View style={styles.trialBenefits}>
        <TrialBenefit text="Acesso completo ao app" />
        <TrialBenefit text="Cancele antes e não paga nada" />
        <TrialBenefit text="Suporte prioritário" />
      </View>

      <TouchableOpacity
        onPress={onConfirm}
        activeOpacity={0.8}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaButtonText}>Começar meu teste grátis</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDismiss}
        activeOpacity={0.8}
        style={styles.dismissButton}
      >
        <Text style={styles.dismissButtonText}>Não quero →</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

function TrialBenefit({ text }: { text: string }) {
  return (
    <View style={styles.trialBenefitRow}>
      <Text style={styles.trialBenefitCheck}>✓</Text>
      <Text style={styles.trialBenefitText}>{text}</Text>
    </View>
  )
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerButton: { width: 80 },
  headerRestore: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  headerLogo: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 20,
    color: '#E0EAFF',
    letterSpacing: 3,
  },
  closeButton: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 18,
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 24,
  },

  heroSection: { gap: 12 },
  heroTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: '#E0EAFF',
    lineHeight: 42,
  },
  heroSubtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },

  mockupCard: {
    borderRadius: 20,
    padding: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  mockupLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  mockupDays: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 64,
    color: '#E0EAFF',
    lineHeight: 72,
  },
  mockupDaysLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: -8,
  },
  mockupBar: {
    height: 6,
    backgroundColor: '#1A2240',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  mockupBarFill: {
    width: '5%',
    height: '100%',
    borderRadius: 3,
  },
  mockupBarCaption: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: '#FFFFFF',
  },

  ctaButton: {
    backgroundColor: '#3D54D9',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  ctaButtonText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 16,
    color: '#E0EAFF',
    letterSpacing: 0.5,
  },

  bulletsSection: { gap: 12 },
  bulletsTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 22,
    color: '#E0EAFF',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletEmoji: { fontSize: 20, lineHeight: 26 },
  bulletText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 24,
  },

  testimonialCard: {
    backgroundColor: '#0F1420',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  starsRow: {
    fontSize: 16,
    color: '#3D54D9',
    letterSpacing: 2,
  },
  testimonialText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },

  discountCard: {
    backgroundColor: '#0F1420',
    borderRadius: 20,
    padding: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  discountBadgeRow: { flexDirection: 'row' },
  discountBadge: {
    backgroundColor: 'rgba(242,122,94,0.12)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(242,122,94,0.3)',
  },
  discountBadgeText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 13,
    color: '#F27A5E',
  },
  discountCardTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 22,
    color: '#E0EAFF',
    marginTop: 4,
  },
  discountCardSubtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },

  microcopy: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: -8,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,12,20,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#E0EAFF',
  },

  discountScreenTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: '#E0EAFF',
    lineHeight: 38,
    letterSpacing: 0.5,
  },
  discountScreenSubtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginTop: -8,
  },

  analyticsCard: {
    backgroundColor: '#0F1420',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  saveBadge: {
    backgroundColor: '#4A9C52',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  saveBadgeText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 12,
    color: '#E0EAFF',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: '#E0EAFF',
  },
  statLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statsDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#1A2240',
  },
  analyticsDivider: {
    height: 1,
    backgroundColor: '#1A2240',
  },
  planHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 4,
  },
  planPrice: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 36,
    color: '#E0EAFF',
  },
  planPriceCaption: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: '#FFFFFF',
  },
  planBadge: {
    backgroundColor: 'rgba(61,84,217,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.3)',
  },
  planBadgeText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 11,
    color: '#3D54D9',
    letterSpacing: 0.5,
  },
  planSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planSecondaryLabel: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
  },
  planSecondaryPrice: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },

  freeTrialLink: {
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  freeTrialLinkText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'underline',
  },

  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(74,156,82,0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(74,156,82,0.15)',
  },
  guaranteeIcon: { fontSize: 18 },
  guaranteeText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 22,
  },

  freeTrialContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F1420',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
    borderTopWidth: 1,
    borderColor: '#1A2240',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 20 },
    }),
  },
  offerTagRow: { alignItems: 'center' },
  offerTag: {
    backgroundColor: 'rgba(61,84,217,0.15)',
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(61,84,217,0.35)',
  },
  offerTagText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 12,
    color: '#3D54D9',
    letterSpacing: 2,
  },
  trialBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  trialBadgeDays: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 36,
    color: '#E0EAFF',
    lineHeight: 40,
  },
  trialBadgeLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 11,
    color: 'rgba(224,234,255,0.8)',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 14,
  },
  trialTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 24,
    color: '#E0EAFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  trialSubtitle: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  trialNote: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: '#4A9C52',
    textAlign: 'center',
    marginTop: -8,
  },
  trialBenefits: {
    gap: 8,
    backgroundColor: 'rgba(61,84,217,0.06)',
    borderRadius: 12,
    padding: 16,
  },
  trialBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trialBenefitCheck: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 16,
    color: '#4A9C52',
  },
  trialBenefitText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
})
