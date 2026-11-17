import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

// Fora do Expo Go e com chave configurada, cria o client de verdade.
// Dentro do Expo Go, ou sem chave, fica null e nenhuma chamada é feita.
export const posthog =
  !isExpoGo && apiKey && host ? new PostHog(apiKey, { host }) : null;

if (isExpoGo) {
  console.log('PostHog: rodando no Expo Go, analytics desativado.');
} else if (!apiKey || !host) {
  console.warn(
    'PostHog: EXPO_PUBLIC_POSTHOG_KEY ou EXPO_PUBLIC_POSTHOG_HOST não encontrados no .env'
  );
}

export const identifyUser = (userId: string, properties?: object): void => {
  posthog?.identify(userId, properties || {});
};

export const trackEvent = (event: string, properties?: object): void => {
  posthog?.capture(event, properties || {});
};

export const resetUser = (): void => {
  posthog?.reset();
};

export default { identifyUser, trackEvent, resetUser };