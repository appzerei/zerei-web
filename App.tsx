import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg';
import * as Notifications from 'expo-notifications';

import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from '@expo-google-fonts/rubik';

import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from './src/theme/theme';
import { supabase } from './src/lib/supabase';
import { STORAGE_KEYS, FEATURES } from './src/constants';
import Impact1Screen      from './src/screens/Impact1Screen';
import QuizScreen         from './src/screens/QuizScreen';
import LoadingScreen      from './src/screens/LoadingScreen';
import ResultScreen       from './src/screens/ResultScreen';
import SymptomsScreen     from './src/screens/SymptomsScreen';
import RewiringScreen     from './src/screens/RewiringScreen';
import GoalsScreen        from './src/screens/GoalsScreen';
import CarouselScreen     from './src/screens/CarouselScreen';
import TestimonialsScreen from './src/screens/TestimonialsScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import PlanScreen         from './src/screens/PlanScreen';
import PaywallScreen      from './src/screens/PaywallScreen';
import DashboardScreen    from './src/screens/DashboardScreen';
import LoginScreen        from './src/screens/LoginScreen';
import RegisterScreen     from './src/screens/RegisterScreen';
import PanicButtonScreen  from './src/screens/PanicButtonScreen';
import ZARAScreen          from './src/screens/ZARAScreen';
import ZaraEmConstrucaoScreen from './src/screens/ZaraEmConstrucaoScreen';
import AnalyticsScreen    from './src/screens/AnalyticsScreen';
import LibraryScreen      from './src/screens/LibraryScreen';
import ClasseScreen       from './src/screens/ClasseScreen';
import SoundscapesScreen  from './src/screens/SoundscapesScreen';
import ChallengeScreen    from './src/screens/ChallengeScreen';
import CommunityScreen    from './src/screens/CommunityScreen';
import ProfileScreen      from './src/screens/ProfileScreen';
import ZereiSplashScreen from './src/screens/SplashScreen';
import * as Sentry from '@sentry/react-native';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from './src/lib/posthog';


Sentry.init({
  dsn: 'https://6f69a6710e464239198dba103cc010b4@o4511363418030080.ingest.de.sentry.io/4511363428515920',

  // Desativado intencionalmente — app trata tema sensível (saúde mental/comportamental),
  // evitamos coletar IP e dados pessoais automaticamente por privacidade
  sendDefaultPii: false,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Só ativa o PostHogProvider quando o client existe de verdade.
// No Expo Go (posthog === null) renderiza os filhos direto, sem provider.
function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  if (!posthog) return <>{children}</>;
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

SplashScreen.preventAutoHideAsync();

// ─── Handler global de notificações ──────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Tipos de step ────────────────────────────────────────────────────────────
type OnboardingStep =
  | 'splash'
  | 'impact1'
  | 'login'
  | 'register'
  | 'quiz'
  | 'loading'
  | 'result'
  | 'symptoms'
  | 'rewiring'
  | 'goals'
  | 'carousel'
  | 'testimonials'
  | 'notification'
  | 'plan'
  | 'paywall';

type AppStep = 'dashboard' | 'analytics' | 'library' | 'community' | 'profile';
type OverlayStep = 'panicButton' | 'zara' | 'classe' | 'soundscapes' | 'challenge';
type Step = OnboardingStep | AppStep | OverlayStep;

const APP_TABS: AppStep[] = ['dashboard', 'analytics', 'library', 'community', 'profile'];

// ─── Ícones SVG da Tab Bar ────────────────────────────────────────────────────
function IconHome({ active }: { active: boolean }) {
  const c = active ? '#3D54D9' : 'rgba(255,255,255,0.35)';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M9 21V12h6v9"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconAnalytics({ active }: { active: boolean }) {
  const c = active ? '#3D54D9' : 'rgba(255,255,255,0.35)';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={12} width={4} height={9} rx={1} stroke={c} strokeWidth={1.8} />
      <Rect x={10} y={7} width={4} height={14} rx={1} stroke={c} strokeWidth={1.8} />
      <Rect x={17} y={3} width={4} height={18} rx={1} stroke={c} strokeWidth={1.8} />
    </Svg>
  );
}

function IconLibrary({ active }: { active: boolean }) {
  const c = active ? '#3D54D9' : 'rgba(255,255,255,0.35)';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7} height={18} rx={1} stroke={c} strokeWidth={1.8} />
      <Rect x={14} y={3} width={7} height={18} rx={1} stroke={c} strokeWidth={1.8} />
    </Svg>
  );
}

function IconCommunity({ active }: { active: boolean }) {
  const c = active ? '#3D54D9' : 'rgba(255,255,255,0.35)';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  const c = active ? '#3D54D9' : 'rgba(255,255,255,0.35)';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={c} strokeWidth={1.8} />
      <Path
        d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Tab Bar Component ────────────────────────────────────────────────────────
const TAB_CONFIG: {
  step: AppStep;
  label: string;
  Icon: React.FC<{ active: boolean }>;
}[] = [
  { step: 'dashboard',  label: 'Home',       Icon: IconHome      },
  { step: 'analytics',  label: 'Dados',      Icon: IconAnalytics },
  { step: 'library',    label: 'Biblioteca', Icon: IconLibrary   },
  { step: 'community',  label: 'Comunidade', Icon: IconCommunity },
  { step: 'profile',    label: 'Perfil',     Icon: IconProfile   },
];

function BottomTabBar({
  activeStep,
  onPress,
}: {
  activeStep: AppStep;
  onPress: (step: AppStep) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        tabStyles.bar,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 },
      ]}
    >
      {TAB_CONFIG.map(({ step, label, Icon }) => {
        const active = activeStep === step;
        return (
          <TouchableOpacity
            key={step}
            style={tabStyles.item}
            activeOpacity={0.7}
            onPress={() => onPress(step)}
          >
            <View style={[tabStyles.iconWrap, active && tabStyles.iconWrapActive]}>
              <Icon active={active} />
            </View>
            <Text style={[tabStyles.label, active && tabStyles.labelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#060A12',
    borderTopWidth: 1,
    borderTopColor: '#1A2240',
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(61,84,217,0.12)',
  },
  label: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
  },
  labelActive: {
    fontFamily: 'Rubik_600SemiBold',
    color: '#3D54D9',
  },
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default Sentry.wrap(function App() {
  const [step, setStep] = useState<Step>('splash');
// TEMPORÁRIO — forçar onboarding

  const [streakVersion, setStreakVersion] = useState(0);
  const [userDisplayName, setUserDisplayName] = useState('');
  const handleRelapsed = useCallback(async () => {
    const { supabase } = await import('./src/lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStep('paywall'); return; }

    const now = new Date().toISOString();

    // Use a transaction-like approach to avoid race conditions
    // First, try to update using Supabase's increment function if available
    try {
      // Try to use Supabase's built-in increment functionality via RPC
      // Note: This assumes you have an RPC function called 'increment_relapses' or similar
      // If not available, we'll fall back to the read-then-write approach
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ streak_start_date: now })
        .eq('id', user.id);

      // For the relapses_count, we'll use a separate approach since direct increment in update isn't atomic
      // Instead, we'll try to use an RPC function for atomic increment if available
      if (!updateError) {
        // Try to use RPC for atomic increment
        const { error: rpcError } = await supabase
          .rpc('increment_relapses_count', { user_id: user.id });

        if (!rpcError) {
          setStreakVersion(v => v + 1);
setStep('dashboard');
return;
        }
        // If RPC failed, fall back to read-then-write with a retry mechanism
      } else {
        throw updateError;
      }
    } catch (rpcError) {
      // Continue to fallback approach
    }

    // Fallback: read-then-write with validation and retry mechanism
    let retries = 3;
    while (retries > 0) {
      try {
        const { data: profile, error: selectError } = await supabase
          .from('profiles')
          .select('relapses_count')
          .eq('id', user.id)
          .single();

        if (selectError) throw selectError;

        const newRelapsesCount = (profile?.relapses_count ?? 0) + 1;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ streak_start_date: now, relapses_count: newRelapsesCount })
          .eq('id', user.id);

        if (!updateError) {
          setStreakVersion(v => v + 1);
          setStep('dashboard');

          return;
        }

        // If we get an error, it might be a race condition - retry
        retries--;
        if (retries === 0) throw updateError;

        // Wait a bit before retrying to reduce contention
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error('Failed to update relapse count after retries:', error);
          // Still proceed to dashboard to avoid blocking the user
          setStreakVersion(v => v + 1);
          setStep('dashboard');

          return;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }, []);
    
  const APP_STEPS_PERSISTIDOS: AppStep[] = ['dashboard', 'analytics', 'library', 'community', 'profile'];

  useEffect(() => {
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      if (profile?.full_name) setUserDisplayName(profile.full_name);
            const saved = await AsyncStorage.getItem(STORAGE_KEYS.LAST_STEP);
            if (saved && APP_STEPS_PERSISTIDOS.includes(saved as AppStep)) {
              setStep(saved as AppStep);
            } else {
              setStep('dashboard');
            }
          } else {

        await AsyncStorage.removeItem(STORAGE_KEYS.LAST_STEP);
        // Não muda o step — deixa a splash rodar
        // Impact1 será definido pelo onFinish da ZereiSplashScreen
      }
    };
    setTimeout(() => checkSession(), 5000);
  }, []);

  const handleSetStep = useCallback((novoStep: Step) => {
    setStep(novoStep);
    if (APP_STEPS_PERSISTIDOS.includes(novoStep as AppStep)) {
      AsyncStorage.setItem(STORAGE_KEYS.LAST_STEP, novoStep);
    }
  }, []);

  const handlePaywallNext = useCallback(() => handleSetStep('dashboard'), []);
  const handlePaywallBack = useCallback(() => setStep('plan'), []);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {}
    );
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        setStep('dashboard');
      }
    );
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const isAppTab = APP_TABS.includes(step as AppStep);

  const fakeNav = {
    navigate: (screen: string) => {
      if (screen === 'PanicButton') setStep('panicButton');
      if (screen === 'ZARA')        setStep('zara');
      if (screen === 'Classe')      setStep('classe');
      if (screen === 'Soundscapes') setStep('soundscapes');
      if (screen === 'Challenge')   setStep('challenge');
      if (screen === 'Analytics')   handleSetStep('analytics');
      if (screen === 'Library')     handleSetStep('library');
      if (screen === 'Community')   handleSetStep('community');
      if (screen === 'Profile')     handleSetStep('profile');
      if (screen === 'Dashboard')   handleSetStep('dashboard');
    },
    replace: (screen: string) => {
      if (screen === 'Impact1') setStep('impact1');
    },
    goBack: () => handleSetStep('library'),
  };

  return (
    <PostHogProviderWrapper>
      <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        onLayout={onLayoutRootView}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />

        <View style={{ flex: 1 }}>

         {/* ── Onboarding ── */}
{step === 'splash' && (
  <ZereiSplashScreen onFinish={() => setStep('impact1')} />
)}

{step === 'impact1' && (
  <Impact1Screen
              onNext={() => setStep('quiz')}
              onLogin={() => setStep('login')}
            />
          )}

          {step === 'login' && (
            <LoginScreen
              onBack={() => setStep('impact1')}
              onSuccess={() => setStep('dashboard')}
              onRegister={() => setStep('register')}
            />
          )}

{step === 'register' && (
  <RegisterScreen
    onBack={() => setStep('login')}
    onSuccess={async () => {
      setStreakVersion(v => v + 1);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('quiz');
    }}
  />
)}

          {step === 'quiz' && (
            <QuizScreen
              onNext={() => setStep('loading')}
              onBack={() => setStep('impact1')}
            />
          )}

          {step === 'loading' && (
            <LoadingScreen
              onNext={() => setStep('result')}
              onBack={() => setStep('quiz')}
            />
          )}

          {step === 'result' && (
            <ResultScreen
              onNext={() => setStep('symptoms')}
              onBack={() => setStep('loading')}
            />
          )}

          {step === 'symptoms' && (
            <SymptomsScreen
              onNext={() => setStep('rewiring')}
              onBack={() => setStep('result')}
            />
          )}

          {step === 'rewiring' && (
            <RewiringScreen
              onNext={() => setStep('carousel')}
              onBack={() => setStep('symptoms')}
            />
          )}

          {step === 'goals' && (
            <GoalsScreen
              onNext={() => setStep('carousel')}
              onBack={() => setStep('rewiring')}
            />
          )}

          {step === 'carousel' && (
            <CarouselScreen
              onNext={() => setStep('testimonials')}
              onBack={() => setStep('rewiring')}
            />
          )}

          {step === 'testimonials' && (
            <TestimonialsScreen
              onNext={() => setStep('notification')}
              onBack={() => setStep('carousel')}
            />
          )}

          {step === 'notification' && (
            <NotificationScreen
              onNext={() => setStep('plan')}
              onBack={() => setStep('testimonials')}
            />
          )}

          {step === 'plan' && (
            <PlanScreen
            onNext={() => setStep('paywall')}
            onBack={() => setStep('notification')}
            userName={userDisplayName}
          />
          )}

          {step === 'paywall' && (
            <PaywallScreen
              onNext={handlePaywallNext}
               onBack={handlePaywallBack}
            />
          )}

          {/* ── App Tabs ── */}
          {step === 'dashboard' && (
            <DashboardScreen navigation={fakeNav} streakVersion={streakVersion} />
          )}

          {step === 'analytics' && (
            <AnalyticsScreen navigation={fakeNav} streakVersion={streakVersion} />
          )}

          {step === 'library' && (
            <LibraryScreen navigation={fakeNav} />
          )}

          {step === 'community' && (
            <CommunityScreen navigation={fakeNav} />
          )}

          {step === 'profile' && (
            <ProfileScreen navigation={fakeNav} />
          )}

          {/* ── Overlays (sem tab bar) ── */}
          {step === 'panicButton' && (
            <PanicButtonScreen
              onClose={() => setStep('dashboard')}
              onRelapsed={handleRelapsed}
            />
          )}

{step === 'zara' && (
  FEATURES.ZARA_ENABLED
    ? <ZARAScreen navigation={fakeNav} />
    : <ZaraEmConstrucaoScreen navigation={fakeNav} />
)}

          {step === 'classe' && (
            <ClasseScreen navigation={fakeNav} />
          )}

          {step === 'soundscapes' && (
            <SoundscapesScreen navigation={fakeNav} />
          )}

{step === 'challenge' && (
  <ChallengeScreen onBack={() => setStep('library')} />
)}

          {/* ── Bottom Tab Bar — só nos app tabs ── */}
          {isAppTab && (
            <BottomTabBar
              activeStep={step as AppStep}
              onPress={(s) => handleSetStep(s)}
            />
          )}

        </View>
      </SafeAreaView>
    </SafeAreaProvider>
    </PostHogProviderWrapper>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
