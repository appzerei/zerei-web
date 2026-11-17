// src/types/index.ts
export interface UserProfile {
    id: string;
    full_name: string;
    streak_start_date: string | null;
    relapses_count: number;
  }
  
  export interface Navigation {
    navigate: (screen: string) => void;
    replace: (screen: string) => void;
    goBack: () => void;
  }