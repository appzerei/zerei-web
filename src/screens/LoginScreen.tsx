import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';
import { supabase } from '../lib/supabase';
import { logError } from '../utils/logger';
import { trackEvent, identifyUser } from '../lib/analytics';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  formatWaitTime,
} from '../lib/rateLimiter';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  onRegister: () => void;
}

const isEmailValido = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function LoginScreen({ onBack, onSuccess, onRegister }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState<{
    email?: string;
    senha?: string;
    geral?: string;
  }>({});
  const [telaEsqueci, setTelaEsqueci] = useState(false);
  const [emailRecupero, setEmailRecupero] = useState('');
  const [loadingRecupero, setLoadingRecupero] = useState(false);
  const [statusRecupero, setStatusRecupero] = useState
    'idle' | 'sucesso' | 'erro'
  >('idle');
  const isProcessingLogin = useRef(false);
  const isProcessingRecupero = useRef(false);
  const isProcessingNavegacao = useRef(false);

  const handleEsqueciSenha = async (): Promise<void> => {
    if (isProcessingRecupero.current) return;
    if (!isEmailValido(emailRecupero)) {
      setStatusRecupero('erro');
      return;
    }

    const rlKey = `reset_${emailRecupero.trim().toLowerCase()}`;
    const { allowed, waitSeconds } = await checkRateLimit(rlKey);
    if (!allowed) {
      setErros({
        geral: `Muitas tentativas. Aguarde ${formatWaitTime(waitSeconds)} antes de tentar novamente.`,
      });
      setStatusRecupero('erro');
      return;
    }

    isProcessingRecupero.current = true;
    setLoadingRecupero(true);
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      );
      const { error } = (await Promise.race([
        supabase.auth.resetPasswordForEmail(emailRecupero.trim()),
        timeout,
      ])) as any;

      if (error) {
        await recordFailedAttempt(rlKey);
        throw error;
      }

      await clearRateLimit(rlKey);
      setStatusRecupero('sucesso');
    } catch (error: any) {
      logError('LoginScreen.handleEsqueciSenha', error);
      if (error.message === 'timeout') {
        setStatusRecupero('erro');
      } else {
        setStatusRecupero('erro');
      }
    } finally {
      setLoadingRecupero(false);
      isProcessingRecupero.current = false;
    }
  };

  const validar = (): {
    email?: string;
    senha?: string;
    geral?: string;
  } => {
    const novosErros: typeof erros = {};
    if (!email) novosErros.email = 'Informe seu e-mail.';
    else if (!isEmailValido(email)) novosErros.email = 'E-mail inválido.';
    if (!senha) novosErros.senha = 'Informe sua senha.';
    return novosErros;
  };

  const handleLogin = async (): Promise<void> => {
    if (isProcessingLogin.current) return;

    const novosErros = validar();
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const rlKey = `login_${email.trim().toLowerCase()}`;
    const { allowed, waitSeconds } = await checkRateLimit(rlKey);
    if (!allowed) {
      setErros({
        geral: `Muitas tentativas incorretas. Aguarde ${formatWaitTime(
          waitSeconds
        )} antes de tentar novamente.`,
      });
      return;
    }

    isProcessingLogin.current = true;
    setErros({});
    setLoading(true);
    try {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 10000)
        );
        const { error } = (await Promise.race([
          supabase.auth.signInWithPassword({
            email: email.trim(),
            password: senha,
          }),
          timeout,
        ])) as any;

        if (error) {
          await recordFailedAttempt(rlKey);
          throw error;
        }

        await clearRateLimit(rlKey);
        trackEvent('user_logged_in');
        onSuccess();
      } catch (error: any) {
        logError('LoginScreen.handleLogin', error);
        if (error.message === 'timeout') {
          setErros({
            geral: 'A conexão demorou muito. Verifique sua internet e tente novamente.',
          });
        } else {
          setErros({ geral: 'E-mail ou senha incorretos.' });
        }
      }
    } catch (error) {
      logError('LoginScreen.handleLogin.outer', error);
      setErros({
        geral: 'Algo deu errado. Verifique sua conexão e tente novamente.',
      });
    } finally {
      setLoading(false);
      isProcessingLogin.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#080C14', '#0C1120', '#080C14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.header, { marginTop: insets.top + 8 }]}>
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                accessibilityHint="Retorna à tela anterior"
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.title}>Bem-vindo{'\n'}de volta.</Text>
              <Text style={styles.subtitle}>
                Entre na sua conta para continuar.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>E-mail</Text>
                <TextInput
                  style={[
                    styles.input,
                    erros.email ? styles.inputErro : null,
                  ]}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setErros((e) => ({ ...e, email: undefined }));
                  }}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="E-mail"
                />
                {erros.email ? (
                  <Text style={styles.erroInline}>{erros.email}</Text>
                ) : null}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Senha</Text>
                <TextInput
                  style={[
                    styles.input,
                    erros.senha ? styles.inputErro : null,
                  ]}
                  value={senha}
                  onChangeText={(v) => {
                    setSenha(v);
                    setErros((e) => ({ ...e, senha: undefined }));
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  accessibilityLabel="Senha"
                />
                {erros.senha ? (
                  <Text style={styles.erroInline}>{erros.senha}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => {
                  setTelaEsqueci(true);
                  setStatusRecupero('idle');
                  setEmailRecupero('');
                }}
                activeOpacity={0.8}
                style={styles.linkEsqueci}
              >
                <Text style={styles.linkEsqueciText}>Esqueci minha senha</Text>
              </TouchableOpacity>

              {erros.geral ? (
                <Text style={styles.erroGeral}>{erros.geral}</Text>
              ) : null}
            </View>

            <View style={{ flex: 1 }} />

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  (!email || !isEmailValido(email) || senha.length < 6) && {
                    opacity: 0.5,
                  },
                ]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={
                  !email ||
                  !isEmailValido(email) ||
                  senha.length < 6 ||
                  loading
                }
              >
                {loading ? (
                  <ActivityIndicator color="#E0EAFF" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => {
                  if (isProcessingNavegacao.current) return;
                  isProcessingNavegacao.current = true;
                  onRegister();
                  setTimeout(() => {
                    isProcessingNavegacao.current = false;
                  }, 500);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.btnSecondaryText}>
                  Não tenho conta — Criar agora
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        {telaEsqueci && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {statusRecupero === 'sucesso' ? (
                <>
                  <Text style={styles.modalTitulo}>E-mail enviado ✓</Text>
                  <Text style={styles.modalTexto}>
                    Verifique sua caixa de entrada e siga as instruções para
                    redefinir sua senha.
                  </Text>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => setTelaEsqueci(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnPrimaryText}>Voltar ao login</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.modalTitulo}>Redefinir senha</Text>
                  <Text style={styles.modalTexto}>
                    Informe seu e-mail e enviaremos um link para criar uma nova
                    senha.
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      statusRecupero === 'erro' ? styles.inputErro : null,
                    ]}
                    value={emailRecupero}
                    onChangeText={(v) => {
                      setEmailRecupero(v);
                      setStatusRecupero('idle');
                    }}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {statusRecupero === 'erro' && (
                    <Text style={styles.erroInline}>
                      E-mail inválido ou não encontrado.
                    </Text>
                  )}
                  <View style={styles.modalBotoes}>
                    <TouchableOpacity
                      style={styles.btnSecundarioModal}
                      onPress={() => setTelaEsqueci(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnSecundarioModalText}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnPrimary}
                      onPress={handleEsqueciSenha}
                      activeOpacity={0.8}
                      disabled={loadingRecupero}
                    >
                      {loadingRecupero ? (
                        <ActivityIndicator color="#E0EAFF" />
                      ) : (
                        <Text style={styles.btnPrimaryText}>Enviar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  inner: { flex: 1 },
  header: { paddingHorizontal: 20 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(61,84,217,0.08)',
    borderWidth: 1,
    borderColor: '#1A2240',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: '#E0EAFF' },
  titleBlock: { paddingHorizontal: 28, marginTop: 32 },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 36,
    color: '#E0EAFF',
    lineHeight: 44,
  },
  subtitle: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
  },
  form: { paddingHorizontal: 28, marginTop: 36, gap: 20 },
  inputWrapper: { gap: 6 },
  inputLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    height: 54,
    backgroundColor: '#0F1420',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    color: '#E0EAFF',
    borderWidth: 1,
    borderColor: '#1A2240',
  },
  inputErro: { borderColor: colors.danger },
  erroInline: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: colors.danger,
  },
  erroGeral: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 14,
    color: colors.danger,
    marginTop: -8,
  },
  footer: { paddingHorizontal: 24, gap: 12 },
  btnPrimary: {
    backgroundColor: '#3D54D9',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 17,
    color: '#E0EAFF',
  },
  btnSecondary: {
    backgroundColor: 'rgba(61,84,217,0.12)',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
  },
  linkEsqueci: { alignSelf: 'flex-end', marginTop: -8 },
  linkEsqueciText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 13,
    color: '#3D54D9',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,12,20,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#0F1420',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1A2240',
    gap: 16,
  },
  modalTitulo: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 22,
    color: '#E0EAFF',
  },
  modalTexto: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  modalBotoes: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnSecundarioModal: {
    flex: 1,
    backgroundColor: 'rgba(61,84,217,0.12)',
    borderRadius: 30,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecundarioModalText: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
  },
});