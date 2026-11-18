import { CharacterId, CharacterProfile } from './types';

export const CHARACTERS: CharacterProfile[] = [
  {
    id: 'nzinga',
    name: 'Nzinga',
    archetype: 'Protagonista Principal · Mulher Angolana',
    specialty: 'Mestra Ecofonista',
    description:
      'Líder da expedição no Maiombe. Equilibra furtividade acústica e manipulação de ondas com +1 seixo extra e passos 10% mais silenciosos.',
    portrait: '/src/assets/images/portrait_nzinga_1794990072979.jpg',
    accentColor: '#22D3EE',
    scarfColor: '#DC2626',
    isLead: true,
    bonuses: {
      speedMult: 1.04,
      noiseMult: 0.9,
      maxHp: 3,
      extraStones: 1,
      throwRangeMult: 1.05,
      cooldownMult: 0.95,
    },
  },
  {
    id: 'kandimba',
    name: 'Kandimba',
    archetype: 'Aliada · Mulher Angolana',
    specialty: 'Batedora do Namibe',
    description:
      'Ágil exploradora da costa e do deserto. Move-se 14% mais rápido e reduz o som das passadas em 20% sob neblina ou vento.',
    portrait: '/src/assets/images/portrait_kandimba_1794990073628.jpg',
    accentColor: '#34D399',
    scarfColor: '#10B981',
    isLead: false,
    bonuses: {
      speedMult: 1.14,
      noiseMult: 0.8,
      maxHp: 3,
      extraStones: 0,
      throwRangeMult: 1.0,
      cooldownMult: 1.0,
    },
  },
  {
    id: 'lueji',
    name: 'Lueji',
    archetype: 'Aliada · Mulher Angolana',
    specialty: 'Mestra da Kissange',
    description:
      'Musicista capaz de dobrar frequências. Reduz em 28% o tempo de recarga de Sussurro na Folha e Canto do Silêncio.',
    portrait: '/src/assets/images/portrait_lueji_1794990074927.jpg',
    accentColor: '#FBBF24',
    scarfColor: '#F59E0B',
    isLead: false,
    bonuses: {
      speedMult: 1.0,
      noiseMult: 0.95,
      maxHp: 3,
      extraStones: 0,
      throwRangeMult: 1.0,
      cooldownMult: 0.72,
    },
  },
  {
    id: 'tchissola',
    name: 'Tchissola',
    archetype: 'Aliado · Homem Angolano',
    specialty: 'Engenheiro do Kwanza',
    description:
      'Especialista em acústica de campo. Carrega +2 seixos de isca extras e arremessa distrações 35% mais longe.',
    portrait: '/src/assets/images/portrait_tchissola_1794990074467.jpg',
    accentColor: '#F59E0B',
    scarfColor: '#D97706',
    isLead: false,
    bonuses: {
      speedMult: 0.98,
      noiseMult: 1.0,
      maxHp: 3,
      extraStones: 2,
      throwRangeMult: 1.35,
      cooldownMult: 1.0,
    },
  },
  {
    id: 'kimbamba',
    name: 'Kimbamba',
    archetype: 'Guardiã · Palanca Negra Gigante',
    specialty: 'Espírito de Cangandala',
    description:
      'Majestosa Palanca Negra Gigante de Angola. Possui 4 de vitalidade, galope 18% mais rápido e chifres que pulsam ecos reveladores.',
    portrait: '/src/assets/images/portrait_palanca_1794990076217.jpg',
    accentColor: '#38BDF8',
    scarfColor: '#FACC15',
    isLead: false,
    bonuses: {
      speedMult: 1.18,
      noiseMult: 1.05,
      maxHp: 4,
      extraStones: 0,
      throwRangeMult: 0.9,
      cooldownMult: 0.9,
    },
  },
];

export function getCharacterById(id: CharacterId): CharacterProfile {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
