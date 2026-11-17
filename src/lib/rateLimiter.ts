import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;

interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null;
  firstAttempt: number;
}

export async function checkRateLimit(
  key: string
): Promise<{ allowed: boolean; waitSeconds: number }> {
  try {
    const raw = await AsyncStorage.getItem(`rl_${key}`);
    const now = Date.now();
    if (!raw) return { allowed: true, waitSeconds: 0 };

    const entry: RateLimitEntry = JSON.parse(raw);

    if (entry.lockedUntil && now < entry.lockedUntil) {
      return {
        allowed: false,
        waitSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
      };
    }

    if (now - entry.firstAttempt > WINDOW_MS) {
      await AsyncStorage.removeItem(`rl_${key}`);
      return { allowed: true, waitSeconds: 0 };
    }

    return { allowed: true, waitSeconds: 0 };
  } catch {
    return { allowed: true, waitSeconds: 0 };
  }
}

export async function recordFailedAttempt(
  key: string
): Promise<{ locked: boolean; waitSeconds: number }> {
  try {
    const now = Date.now();
    const raw = await AsyncStorage.getItem(`rl_${key}`);

    let entry: RateLimitEntry;
    if (!raw) {
      entry = { attempts: 1, lockedUntil: null, firstAttempt: now };
    } else {
      const parsed: RateLimitEntry = JSON.parse(raw);
      if (now - parsed.firstAttempt > WINDOW_MS) {
        entry = { attempts: 1, lockedUntil: null, firstAttempt: now };
      } else {
        entry = { ...parsed, attempts: parsed.attempts + 1 };
      }
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.lockedUntil = now + LOCK_DURATION_MS;
      await AsyncStorage.setItem(`rl_${key}`, JSON.stringify(entry));
      return { locked: true, waitSeconds: Math.ceil(LOCK_DURATION_MS / 1000) };
    }

    await AsyncStorage.setItem(`rl_${key}`, JSON.stringify(entry));
    return { locked: false, waitSeconds: 0 };
  } catch {
    return { locked: false, waitSeconds: 0 };
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`rl_${key}`);
  } catch {}
}

export function formatWaitTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) return `${mins} min ${secs}s`;
  if (mins > 0) return `${mins} minutos`;
  return `${secs} segundos`;
}