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
import { trackEvent } from '../lib/analytics';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  formatWaitTime,
} from '../lib/rateLimiter';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const isEmailValido = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const requisitos = [
  { label: 'Mínimo 8 caracteres', ok: (s: string) => s.length >= 8 },
  { label: 'Letra maiúscula', ok: (s: string) => /[A-Z]/.test(s) },
  { label: 'Letra minúscula', ok: (s: string) => /[a-z]/.test(s) },
  { label: 'Número', ok: (s: string) => /[0-9]/.test(s) },
  { label: 'Símbolo (!@#$...)', ok: (s: string) => /[^A-Za-z0-9]/.test(s) },
];

const isSenhaValida = (s: string) => requisitos.every((r) => r.ok(s));

const RL_KEY_REGISTER = 'register';

export default function RegisterScreen({ onBack, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [codigoIndicacao, setCodigoIndicacao] = useState('');
  const [codigoErro, setCodigoErro] = useState<string | null>(null);
  const [codigoValido, setCodigoValido] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState<{
    nome?: string;
    email?: string;
    senha?: string;
    confirmar?: string;
    geral?: string;
  }>({});
  const isProcessingRegister = useRef(false);
  const isProcessingVoltar = useRef(false);

  const validar = (): {
    nome?: string;
    email?: string;
    senha?: string;
    confirmar?: string;
    geral?: string;
  } => {
    const novosErros: typeof erros = {};
    if (!nome.trim()) novosErros.nome = 'Informe seu nome.';
    else if (nome.trim().length < 2) novosErros.nome = 'Nome muito curto.';
    if (!email) novosErros.email = 'Informe seu e-mail.';
    else if (!isEmailValido(email)) novosErros.email = 'E-mail inválido.';
    if (!senha) novosErros.senha = 'Crie uma senha.';
    else if (!isSenhaValida(senha))
      novosErros.senha = 'A senha não atende todos os requisitos.';
    if (!confirmar) novosErros.confirmar = 'Confirme sua senha.';
    else if (senha !== confirmar)
      novosErros.confirmar = 'As senhas não coincidem.';
    return novosErros;
  };

  const handleRegister = async (): Promise<void> => {
    if (isProcessingRegister.current) return;

    const novosErros = validar();
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const { allowed, waitSeconds } = await checkRateLimit(RL_KEY_REGISTER);
    if (!allowed) {
      setErros({
        geral: `Muitas tentativas. Aguarde ${formatWaitTime(
          waitSeconds
        )} antes de tentar novamente.`,
      });
      return;
    }

    isProcessingRegister.current = true;
    setErros({});
    setLoading(true);
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      );

      let referrerId: string | null = null;
      if (codigoIndicacao.trim()) {
        const codigoTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        );
        const { data: referrer, error: refErr } = (await Promise.race([
          supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', codigoIndicacao.trim().toUpperCase())
            .single(),
          codigoTimeout,
        ])) as any;

        if (refErr || !referrer) {
          setCodigoErro('Código inválido. Verifique e tente novamente.');
          setLoading(false);
          isProcessingRegister.current = false;
          return;
        }
        referrerId = referrer.id;
      }

      const { data: signUpData, error } = (await Promise.race([
        supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { full_name: nome.trim() } },
        }),
        timeout,
      ])) as any;

      if (error) {
        await recordFailedAttempt(RL_KEY_REGISTER);
        throw error;
      }

      if (referrerId && signUpData?.user?.id) {
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('streak_start_date')
          .eq('id', referrerId)
          .single();

        await supabase.from('referrals').insert({
          referrer_id: referrerId,
          referred_id: signUpData.user.id,
        });

        if (referrerProfile?.streak_start_date) {
          const currentStart = new Date(referrerProfile.streak_start_date);
          currentStart.setDate(currentStart.getDate() - 3);

          await supabase
            .from('profiles')
            .update({
              streak_start_date: currentStart.toISOString(),
              referral_bonus_days:
                ((referrerProfile as any).referral_bonus_days ?? 0) + 1,
            })
            .eq('id', referrerId);
        }
      }

      await clearRateLimit(RL_KEY_REGISTER);
      trackEvent('user_registered');
      onSuccess();
    } catch (error: any) {
      logError('RegisterScreen.handleRegister', error);
      if (error.message === 'timeout') {
        setErros({
          geral: 'A conexão demorou muito. Verifique sua internet e tente novamente.',
        });
      } else {
        setErros({ geral: 'Não foi possível criar a conta. Tente novamente.' });
      }
    } finally {
      setLoading(false);
      isProcessingRegister.current = false;
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
                onPress={() => {
                  if (isProcessingVoltar.current) return;
                  isProcessingVoltar.current = true;
                  onBack();
                  setTimeout(() => {
                    isProcessingVoltar.current = false;
                  }, 500);
                }}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.title}>Criar{'\n'}sua conta.</Text>
              <Text style={styles.subtitle}>Comece sua jornada agora.</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Nome</Text>
                <TextInput
                  style={[styles.input, erros.nome ? styles.inputErro : null]}
                  value={nome}
                  onChangeText={(v) => {
                    setNome(v);
                    setErros((e) => ({ ...e, nome: undefined }));
                  }}
                  placeholder="Como quer ser chamado?"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
                {erros.nome ? (
                  <Text style={styles.erroInline}>{erros.nome}</Text>
                ) : null}
              </View>

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
                  placeholder="Crie uma senha forte"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
                {senha.length > 0 && (
                  <View style={styles.requisitosWrapper}>
                    {requisitos.map((r) => (
                      <View key={r.label} style={styles.requisitosItem}>
                        <Text
                          style={
                            r.ok(senha)
                              ? styles.requisitosOk
                              : styles.requisitosFalso
                          }
                        >
                          {r.ok(senha) ? '✓' : '○'} {r.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {erros.senha ? (
                  <Text style={styles.erroInline}>{erros.senha}</Text>
                ) : null}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Confirmar senha</Text>
                <TextInput
                  style={[
                    styles.input,
                    erros.confirmar ? styles.inputErro : null,
                  ]}
                  value={confirmar}
                  onChangeText={(v) => {
                    setConfirmar(v);
                    setErros((e) => ({ ...e, confirmar: undefined }));
                  }}
                  placeholder="Repita a senha"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
                {erros.confirmar ? (
                  <Text style={styles.erroInline}>{erros.confirmar}</Text>
                ) : null}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>
                  Código de indicação{' '}
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.3)',
                      fontFamily: 'Rubik_400Regular',
                      textTransform: 'none',
                    }}
                  >
                    (opcional)
                  </Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    codigoErro
                      ? styles.inputErro
                      : codigoValido
                      ? styles.inputValido
                      : null,
                  ]}
                  value={codigoIndicacao}
                  onChangeText={(v) => {
                    setCodigoIndicacao(v.toUpperCase());
                    setCodigoErro(null);
                    setCodigoValido(v.trim().length === 6);
                  }}
                  placeholder="Ex: 980676"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  autoCapitalize="characters"
                  maxLength={6}
                />
                {codigoErro ? (
                  <Text style={styles.erroInline}>{codigoErro}</Text>
                ) : codigoValido ? (
                  <Text style={styles.sucessoInline}>
                    ✓ 3 dias bônus serão creditados ao seu amigo
                  </Text>
                ) : null}
              </View>

              {erros.geral ? (
                <Text style={styles.erroGeral}>{erros.geral}</Text>
              ) : null}
            </View>

            <View style={{ flex: 1 }} />

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  (!nome ||
                    !isEmailValido(email) ||
                    !isSenhaValida(senha) ||
                    !confirmar) && { opacity: 0.5 },
                ]}
                onPress={handleRegister}
                activeOpacity={0.8}
                disabled={
                  !nome ||
                  !isEmailValido(email) ||
                  !isSenhaValida(senha) ||
                  !confirmar ||
                  loading
                }
              >
                {loading ? (
                  <ActivityIndicator color="#E0EAFF" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Criar conta</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
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
  inputValido: { borderColor: '#4A9C52' },
  sucessoInline: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: '#4A9C52',
  },
  requisitosWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  requisitosItem: {},
  requisitosOk: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: '#4A9C52',
  },
  requisitosFalso: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 12,
    color: '#4A5A8A',
  },
});