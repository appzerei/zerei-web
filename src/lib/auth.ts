import { supabase } from './supabase';

// Derruba a sessão atual E todas as outras sessões ativas desse usuário
// (outros celulares, outros logins). Usa isso em "sair de todos os dispositivos"
// ou depois de detectar comportamento suspeito.
export async function signOutEverywhere(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    console.warn('[signOutEverywhere] erro ao encerrar sessões:', error.message);
    return { error: error.message };
  }
  return { error: null };
}