import { LevelConfig } from './types';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'Ato I · Floresta do Maiombe',
    subtitle: 'Aprenda a ver o som entre imbondeiros e sincronize seus passos com a brisa.',
    objectiveHint: 'Alcance o Santuário de Mbanza à direita. Ande quando os imbondeiros soprarem e segure Espaço perto de predadores.',
    worldWidth: 1440,
    worldHeight: 900,
    playerStart: { x: 110, y: 450 },
    exitPos: { x: 1320, y: 450 },
    exitRadius: 42,
    hasWhisperAbility: false,
    hasSilenceAbility: false,
    stormEnabled: false,
    allowedWeather: ['calma', 'cacimbo', 'neblina_namibe'],
    obstacles: [
      { id: 'obs-1-1', x: 260, y: 120, w: 70, h: 240, kind: 'wall' },
      { id: 'obs-1-2', x: 260, y: 540, w: 70, h: 240, kind: 'wall' },
      { id: 'obs-1-3', x: 540, y: 290, w: 90, h: 320, kind: 'ruin' },
      { id: 'obs-1-4', x: 820, y: 90, w: 80, h: 260, kind: 'wall' },
      { id: 'obs-1-5', x: 820, y: 550, w: 80, h: 260, kind: 'wall' },
      { id: 'obs-1-6', x: 1080, y: 310, w: 80, h: 280, kind: 'pillar' },
    ],
    windZones: [
      { id: 'w-1-1', x: 420, y: 450, radius: 120, cyclePeriod: 6.2, activeDuration: 3.4, phaseOffset: 0 },
      { id: 'w-1-2', x: 700, y: 210, radius: 115, cyclePeriod: 5.8, activeDuration: 3.2, phaseOffset: 1.8 },
      { id: 'w-1-3', x: 700, y: 690, radius: 115, cyclePeriod: 5.8, activeDuration: 3.2, phaseOffset: 3.4 },
      { id: 'w-1-4', x: 980, y: 450, radius: 120, cyclePeriod: 6.2, activeDuration: 3.4, phaseOffset: 1.1 },
    ],
    birdFlocks: [
      { id: 'b-1-1', x: 950, y: 730, radius: 75 },
    ],
    crystals: [
      { id: 'c-1-1', x: 420, y: 180 },
      { id: 'c-1-2', x: 700, y: 690 },
      { id: 'c-1-3', x: 1120, y: 180 },
    ],
    enemies: [
      {
        id: 'e-1-1',
        type: 'stalker',
        patrolPoints: [
          { x: 425, y: 240 },
          { x: 425, y: 660 },
        ],
      },
      {
        id: 'e-1-2',
        type: 'stalker',
        patrolPoints: [
          { x: 960, y: 200 },
          { x: 960, y: 640 },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Ato II · Falésias do Miradouro da Lua',
    subtitle: 'Sussurre para as folhas secas e evite espantar os bandos de tecelões.',
    objectiveHint: 'Use [E] Sussurro na Folha para criar uma cortina sonora. Pedras ou passos fortes perto de aves atraem o Colosso.',
    worldWidth: 1440,
    worldHeight: 900,
    playerStart: { x: 100, y: 760 },
    exitPos: { x: 1330, y: 140 },
    exitRadius: 42,
    hasWhisperAbility: true,
    hasSilenceAbility: false,
    stormEnabled: false,
    allowedWeather: ['neblina_namibe', 'calma', 'cacimbo', 'tempestade_kwanza'],
    obstacles: [
      { id: 'obs-2-1', x: 240, y: 480, w: 70, h: 320, kind: 'ruin' },
      { id: 'obs-2-2', x: 440, y: 110, w: 80, h: 340, kind: 'wall' },
      { id: 'obs-2-3', x: 640, y: 440, w: 120, h: 120, kind: 'pillar' },
      { id: 'obs-2-4', x: 860, y: 140, w: 70, h: 310, kind: 'ruin' },
      { id: 'obs-2-5', x: 860, y: 580, w: 70, h: 240, kind: 'wall' },
      { id: 'obs-2-6', x: 1120, y: 280, w: 80, h: 340, kind: 'ruin' },
    ],
    windZones: [
      { id: 'w-2-1', x: 350, y: 650, radius: 110, cyclePeriod: 6.8, activeDuration: 3.2, phaseOffset: 0.5 },
      { id: 'w-2-2', x: 720, y: 270, radius: 115, cyclePeriod: 6.4, activeDuration: 3.1, phaseOffset: 2.4 },
      { id: 'w-2-3', x: 1010, y: 480, radius: 110, cyclePeriod: 6.8, activeDuration: 3.2, phaseOffset: 4.0 },
    ],
    birdFlocks: [
      { id: 'b-2-1', x: 360, y: 260, radius: 75 },
      { id: 'b-2-2', x: 1000, y: 740, radius: 80 },
    ],
    crystals: [
      { id: 'c-2-1', x: 350, y: 185 },
      { id: 'c-2-2', x: 700, y: 740 },
      { id: 'c-2-3', x: 1265, y: 730 },
    ],
    enemies: [
      {
        id: 'e-2-1',
        type: 'stalker',
        patrolPoints: [
          { x: 360, y: 420 },
          { x: 560, y: 680 },
        ],
      },
      {
        id: 'e-2-2',
        type: 'wraith',
        patrolPoints: [
          { x: 600, y: 220 },
          { x: 780, y: 350 },
          { x: 600, y: 350 },
        ],
      },
      {
        id: 'e-2-3',
        type: 'goliath',
        patrolPoints: [
          { x: 1010, y: 210 },
          { x: 1010, y: 640 },
        ],
      },
      {
        id: 'e-2-4',
        type: 'stalker',
        patrolPoints: [
          { x: 1265, y: 610 },
          { x: 1265, y: 270 },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Ato III · Fenda da Tundavala',
    subtitle: 'Domine o Canto do Silêncio enquanto a trovoada da Huíla mascara seus passos.',
    objectiveHint: 'Use [R] Canto do Silêncio para gerar uma bolha impenetrável de vácuo acústico. Aproveite a chuva para avançar!',
    worldWidth: 1440,
    worldHeight: 900,
    playerStart: { x: 100, y: 450 },
    exitPos: { x: 1340, y: 450 },
    exitRadius: 44,
    hasWhisperAbility: true,
    hasSilenceAbility: true,
    stormEnabled: true,
    allowedWeather: ['tempestade_kwanza', 'neblina_namibe', 'cacimbo'],
    obstacles: [
      { id: 'obs-3-1', x: 250, y: 150, w: 70, h: 220, kind: 'pillar' },
      { id: 'obs-3-2', x: 250, y: 530, w: 70, h: 220, kind: 'pillar' },
      { id: 'obs-3-3', x: 480, y: 330, w: 100, h: 240, kind: 'ruin' },
      { id: 'obs-3-4', x: 740, y: 100, w: 80, h: 260, kind: 'wall' },
      { id: 'obs-3-5', x: 740, y: 540, w: 80, h: 260, kind: 'wall' },
      { id: 'obs-3-6', x: 980, y: 310, w: 90, h: 280, kind: 'ruin' },
      { id: 'obs-3-7', x: 1180, y: 120, w: 60, h: 210, kind: 'pillar' },
      { id: 'obs-3-8', x: 1180, y: 570, w: 60, h: 210, kind: 'pillar' },
    ],
    windZones: [
      { id: 'w-3-1', x: 370, y: 210, radius: 105, cyclePeriod: 6.0, activeDuration: 2.9, phaseOffset: 0 },
      { id: 'w-3-2', x: 630, y: 670, radius: 105, cyclePeriod: 6.0, activeDuration: 2.9, phaseOffset: 2.0 },
      { id: 'w-3-3', x: 1100, y: 450, radius: 110, cyclePeriod: 6.0, activeDuration: 2.9, phaseOffset: 3.5 },
    ],
    birdFlocks: [
      { id: 'b-3-1', x: 620, y: 200, radius: 75 },
      { id: 'b-3-2', x: 880, y: 720, radius: 75 },
    ],
    crystals: [
      { id: 'c-3-1', x: 370, y: 720 },
      { id: 'c-3-2', x: 880, y: 170 },
      { id: 'c-3-3', x: 1110, y: 740 },
    ],
    enemies: [
      {
        id: 'e-3-1',
        type: 'stalker',
        patrolPoints: [
          { x: 370, y: 240 },
          { x: 370, y: 660 },
        ],
      },
      {
        id: 'e-3-2',
        type: 'wraith',
        patrolPoints: [
          { x: 630, y: 360 },
          { x: 630, y: 580 },
        ],
      },
      {
        id: 'e-3-3',
        type: 'goliath',
        patrolPoints: [
          { x: 880, y: 260 },
          { x: 880, y: 620 },
        ],
      },
      {
        id: 'e-3-4',
        type: 'wraith',
        patrolPoints: [
          { x: 1100, y: 200 },
          { x: 1100, y: 700 },
        ],
      },
      {
        id: 'e-3-5',
        type: 'stalker',
        patrolPoints: [
          { x: 1270, y: 260 },
          { x: 1270, y: 640 },
        ],
      },
    ],
  },
];
