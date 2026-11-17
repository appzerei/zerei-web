// Fonte única de verdade sobre badges/tiers de streak.
// Usado por DashboardScreen.tsx e ProfileScreen.tsx.
// Se um dia precisar mudar um tier (dias, nome, imagem), muda só aqui
// e as duas telas atualizam juntas — antes cada tela tinha sua própria
// cópia dessa lista, e era fácil elas ficarem dessincronizadas.

export type BadgeTier = {
  id: string;
  label: string;
  sublabel: string;
  minDay: number;
  maxDay: number | null;
  description: string;
  imageOn: any;
  imageOff: any;
  isLenda?: boolean;
};

export const BADGE_TIERS: BadgeTier[] = [
  {
    id: 'tier1', label: 'Iniciante', sublabel: 'Dias 1-18',
    minDay: 1, maxDay: 18,
    description: 'Os primeiros dias são os mais difíceis. Chegar até aqui já mostra que você decidiu levar isso a sério.',
    imageOn: require('../assets/badges/badge_tier1_on.png'),
    imageOff: require('../assets/badges/badge_tier1_off.png'),
  },
  {
    id: 'tier2', label: 'Resistência', sublabel: 'Dias 19-36',
    minDay: 19, maxDay: 36,
    description: 'Você já passou da fase mais crítica de abstinência. Seu cérebro está começando a se reorganizar.',
    imageOn: require('../assets/badges/badge_tier2_on.png'),
    imageOff: require('../assets/badges/badge_tier2_off.png'),
  },
  {
    id: 'tier3', label: 'Construção', sublabel: 'Dias 37-54',
    minDay: 37, maxDay: 54,
    description: 'Novos hábitos estão se firmando no lugar dos antigos. Essa é a fase de construir uma base sólida.',
    imageOn: require('../assets/badges/badge_tier3_on.png'),
    imageOff: require('../assets/badges/badge_tier3_off.png'),
  },
  {
    id: 'tier4', label: 'Transformação', sublabel: 'Dias 55-72',
    minDay: 55, maxDay: 72,
    description: 'Mudanças reais de comportamento já são visíveis nessa fase, tanto pra você quanto pra quem te cerca.',
    imageOn: require('../assets/badges/badge_tier4_on.png'),
    imageOff: require('../assets/badges/badge_tier4_off.png'),
  },
  {
    id: 'tier5', label: 'Libertação', sublabel: 'Dias 73-90',
    minDay: 73, maxDay: 90,
    description: 'Você está a poucos dias de completar os 90 dias, o marco mais importante da jornada.',
    imageOn: require('../assets/badges/badge_tier5_on.png'),
    imageOff: require('../assets/badges/badge_tier5_off.png'),
  },
  {
    id: 'tier6_1', label: 'Lenda I', sublabel: 'Dia 91+',
    minDay: 91, maxDay: 94, isLenda: true,
    description: 'Você completou os 90 dias. A partir daqui, cada dia é sobre manter e aprofundar o que já conquistou.',
    imageOn: require('../assets/badges/badge_tier6_1_on.png'),
    imageOff: require('../assets/badges/badge_tier6_1_off.png'),
  },
  {
    id: 'tier6_2', label: 'Lenda II', sublabel: 'Dia 95+',
    minDay: 95, maxDay: 99, isLenda: true,
    description: 'Poucos chegam até aqui. Sua consistência já é maior do que a da grande maioria que começa essa jornada.',
    imageOn: require('../assets/badges/badge_tier6_2_on.png'),
    imageOff: require('../assets/badges/badge_tier6_2_off.png'),
  },
  {
    id: 'tier6_3', label: 'Lenda III', sublabel: 'Dia 100+',
    minDay: 100, maxDay: 109, isLenda: true,
    description: '100 dias. Um marco redondo que representa meses de decisões diárias na direção certa.',
    imageOn: require('../assets/badges/badge_tier6_3_on.png'),
    imageOff: require('../assets/badges/badge_tier6_3_off.png'),
  },
  {
    id: 'tier6_4', label: 'Lenda IV', sublabel: 'Dia 110+',
    minDay: 110, maxDay: 119, isLenda: true,
    description: 'Nesse ponto, o controle sobre o impulso deixou de ser esforço e virou parte de quem você é.',
    imageOn: require('../assets/badges/badge_tier6_4_on.png'),
    imageOff: require('../assets/badges/badge_tier6_4_off.png'),
  },
  {
    id: 'tier6_5', label: 'Lenda V', sublabel: 'Dia 120+',
    minDay: 120, maxDay: null, isLenda: true,
    description: 'O nível mais alto do ZEREI. Você transformou uma decisão difícil em um novo jeito de viver.',
    imageOn: require('../assets/badges/badge_tier6_5_on.png'),
    imageOff: require('../assets/badges/badge_tier6_5_off.png'),
  },
];

export function getCurrentTierIndex(streak: number): number {
  let index = 0;
  BADGE_TIERS.forEach((t, i) => {
    if (streak >= t.minDay) index = i;
  });
  return index;
}

export function getCurrentTier(streak: number): BadgeTier {
  return BADGE_TIERS[getCurrentTierIndex(streak)];
}

export function getNextTier(streak: number): BadgeTier | null {
  for (const t of BADGE_TIERS) {
    if (t.minDay > streak) return t;
  }
  return null;
}

export function getBadgeStars(streak: number, tier: BadgeTier): number {
  if (tier.isLenda) return 0;
  if (streak < tier.minDay) return 0;
  const daysInTier = streak - tier.minDay;
  const starsPerBlock = Math.floor((tier.maxDay! - tier.minDay + 1) / 3);
  return Math.min(3, Math.floor(daysInTier / starsPerBlock) + 1);
}

export const STAR_IMAGES = {
  on: [
    require('../assets/badges/star1_on.png'),
    require('../assets/badges/star2_on.png'),
    require('../assets/badges/star3_on.png'),
  ],
  off: [
    require('../assets/badges/star1_off.png'),
    require('../assets/badges/star2_off.png'),
    require('../assets/badges/star3_off.png'),
  ],
};