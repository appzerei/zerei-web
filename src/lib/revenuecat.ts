import Purchases, { PurchasesError, CustomerInfo, Offering, Package } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo' || Platform.OS === 'web';

const initializeRevenueCat = () => {
  if (isExpoGo) {
    console.log('RevenueCat: rodando no Expo Go, usando modo simulado.');
    return;
  }

  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_KEY_IOS ?? '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_KEY_ANDROID ?? '',
    default: '',
  });

  if (!apiKey) {
    console.warn('RevenueCat API key não encontrada nas variáveis de ambiente');
    return;
  }

  Purchases.configure({ apiKey });
};

initializeRevenueCat();

export const ENTITLEMENT_ID = 'premium';

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (isExpoGo) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Erro ao buscar customer info:', error);
    throw error;
  }
}

export async function purchasePackage(pkg: Package): Promise<boolean> {
  if (isExpoGo) {
    console.log('RevenueCat: compra simulada no Expo Go');
    return false;
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    const purchasesError = error as PurchasesError;
    if (purchasesError.code === PurchasesError.ErrorCode.UserCancelled) {
      return false;
    }
    console.error('Erro ao comprar pacote:', error);
    throw error;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (isExpoGo) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    console.error('Erro ao restaurar compras:', error);
    throw error;
  }
}