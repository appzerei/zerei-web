import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SecureStore tem limite de 2048 bytes por chave.
// Tokens de sessão do Supabase normalmente cabem nesse limite,
// mas adicionamos um aviso caso algum dia isso mude.
const MAX_SAFE_SIZE = 2048;

// No navegador o SecureStore não existe, então usamos o localStorage,
// que é o padrão do Supabase na web.
const isWeb = Platform.OS === 'web';

export const SecureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('[SecureStorageAdapter] Erro ao ler:', key, error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (isWeb) {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      if (value.length > MAX_SAFE_SIZE) {
        console.warn('[SecureStorageAdapter] Valor grande demais para SecureStore:', key, value.length);
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('[SecureStorageAdapter] Erro ao salvar:', key, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (isWeb) {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('[SecureStorageAdapter] Erro ao remover:', key, error);
    }
  },
};