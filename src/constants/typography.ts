// ─────────────────────────────────────────────
// ZEREI — Sistema Tipográfico
// Fonte: Rubik (Google Fonts)
// Atualizado: Abril 2026
// ─────────────────────────────────────────────

export const typography = {
  h1: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 42,
    lineHeight: 50,
  },
  h2: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 30,
    lineHeight: 38,
  },
  h3: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 20,
    lineHeight: 28,
  },
  h5: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 18,
    lineHeight: 26,
  },
  h6: {
    fontFamily: 'Rubik_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
} as const;

// Aliases semânticos para uso no app
export const type = {
  // Títulos de tela
  screenTitle:   typography.h1,
  // Títulos de seção
  sectionTitle:  typography.h2,
  // Subtítulos / cards grandes
  cardTitle:     typography.h3,
  // Labels de botão, badges
  buttonLabel:   typography.h4,
  // Corpo principal
  body:          typography.h5,
  // Corpo secundário, subtítulos
  bodySmall:     typography.h6,
} as const;
