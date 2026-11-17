import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NOTIFICATIONS } from '../constants';
import { logError } from '../utils/logger';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

interface DailyReminder {
  hour: number;
  minute: number;
  title: string;
  body: string;
}

const DAILY_REMINDERS: DailyReminder[] = [
  {
    hour: NOTIFICATIONS.MORNING_HOUR,
    minute: 0,
    title: 'Bom dia 💪',
    body: 'Mais um dia limpo. Você está construindo algo real.',
  },
  {
    hour: NOTIFICATIONS.AFTERNOON_HOUR,
    minute: 0,
    title: 'Check-in da tarde',
    body: 'Como você está se sentindo agora? Abra o app e registre.',
  },
  {
    hour: NOTIFICATIONS.EVENING_HOUR,
    minute: 0,
    title: 'Fechando o dia 🌙',
    body: 'Você chegou até aqui. Isso já é uma vitória.',
  },
];

async function scheduleDailyReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const reminder of DAILY_REMINDERS) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
      },
    });
  }
}

function BellIcon(): React.ReactElement {
  return (
    <View style={styles.bellWrapper}>
      <View style={styles.haloOuter} />
      <View style={styles.haloInner} />

      <Svg width={72} height={72} viewBox="0 0 72 72" style={styles.bellSvg}>
        <Path
          d="M36 8C36 8 20 16 20 34V50H52V34C52 16 36 8 36 8Z"
          fill="#F5C518"
          opacity={0.95}
        />
        <Rect x="33" y="4" width="6" height="6" rx="3" fill="#F5C518" />
        <Rect x="16" y="48" width="40" height="5" rx="2.5" fill="#F5C518" />
        <Circle cx="36" cy="57" r="4" fill="#F5C518" />
        <Path
          d="M28 22C28 22 26 28 26 34"
          stroke="rgba(224,234,255,0.3)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>

      <View style={styles.notifDot} />
    </View>
  );
}

export default function NotificationScreen({ onNext, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isProcessingActivate = useRef<boolean>(false);
  const isProcessingSkip = useRef<boolean>(false);
  const isProcessingVoltar = useRef<boolean>(false);

  const handleActivate = async (): Promise<void> => {
    if (isProcessingActivate.current) return;
    isProcessingActivate.current = true;
    setIsLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await scheduleDailyReminders();
      }
    } catch (error) {
      logError('NotificationScreen.handleActivate', error);
      Alert.alert('Aviso', 'Não conseguimos ativar as notificações. Você pode ativar depois nas configurações.');
    } finally {
      setIsLoading(false);
      isProcessingActivate.current = false;
    }
    onNext();
  };

  const handleSkip = async (): Promise<void> => {
    if (isProcessingSkip.current) return;
    isProcessingSkip.current = true;
    setIsLoading(true);
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      logError('NotificationScreen.handleSkip', error);
    } finally {
      setIsLoading(false);
      isProcessingSkip.current = false;
    }
    onNext();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>

      <View style={{ marginTop: insets.top + 8 }}>
        <TouchableOpacity
          onPress={() => {
            if (isProcessingVoltar.current) return;
            isProcessingVoltar.current = true;
            onBack();
            setTimeout(() => { isProcessingVoltar.current = false; }, 500);
          }}
          style={styles.backButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna à tela anterior"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        Fique no caminho com lembretes
      </Text>

      <Text style={styles.subtitle}>
        Receba lembretes gentis e motivação para nunca perder o foco nos seus objetivos.
      </Text>

      <View style={styles.bellArea}>
        <BellIcon />
        <Text style={styles.bellCaption}>lembretes no momento certo</Text>
      </View>

      <View style={styles.timesRow}>
        {DAILY_REMINDERS.map((r) => (
          <View key={r.hour} style={styles.timeChip}>
            <Text style={styles.timeText}>
              {String(r.hour).padStart(2, '0')}h
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={handleActivate}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={styles.btnPrimaryText}>Ativar notificações</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSkip}
        activeOpacity={0.8}
        style={styles.btnSecondary}
        disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={styles.btnSecondaryText}>Agora não</Text>
        }
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(61,84,217,0.08)',
    borderWidth: 1,
    borderColor: '#1A2240',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  backIcon: {
    fontSize: 18,
    color: '#E0EAFF',
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 34,
    color: '#E0EAFF',
    lineHeight: 34 * 1.15,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 18 * 1.4,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  bellArea: {
    alignItems: 'center',
    marginTop: 52,
  },
  bellWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(245,197,24,0.06)',
  },
  haloInner: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245,197,24,0.10)',
  },
  bellSvg: {
    zIndex: 1,
  },
  notifDot: {
    position: 'absolute',
    top: 22,
    right: 24,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F27A5E',
    borderWidth: 2,
    borderColor: '#080C14',
    zIndex: 2,
  },
  bellCaption: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginTop: 16,
    textTransform: 'lowercase',
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(245,197,24,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.2)',
  },
  timeText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 14,
    color: '#F5C518',
  },
  btnPrimary: {
    backgroundColor: '#3D54D9',
    height: 56,
    borderRadius: 28,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 18,
    color: '#E0EAFF',
  },
  btnSecondary: {
    alignItems: 'center',
    marginTop: 14,
  },
  btnSecondaryText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
