// src/constants/index.ts

export const STREAK = {
  MAX_DAYS: 90,
  RELAPSE_RESET: true,
} as const;

export const PRICING = {
  ANNUAL: 89.90,
  MONTHLY: 19.90,
  TRIAL_DAYS: 3,
} as const;

export const NOTIFICATIONS = {
  MORNING_HOUR: 8,
  AFTERNOON_HOUR: 14,
  EVENING_HOUR: 21,
} as const;

export const SUPABASE_TABLES = {
  PROFILES: 'profiles',
  POSTS: 'posts',
  COMMENTS: 'comments',
} as const;

export const STORAGE_KEYS = {
  LAST_STEP: 'zerei_last_step',
  USER_ID: 'zerei_user_id',
} as const;

export const FEATURES: { ZARA_ENABLED: boolean } = {
  ZARA_ENABLED: false,
};