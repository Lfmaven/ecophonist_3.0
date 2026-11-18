import { CharacterId, SoundRecordDef, SoundRecordId, WeatherEventType } from './types';

export const SOUND_RECORDS: SoundRecordDef[] = [
  {
    id: 'silencio_absoluto',
    title: 'Silêncio Absoluto',
    condition: 'Conclua qualquer ato sem acionar nenhuma caçada de predador (0 alertas).',
    rewardLabel: '+3 Fragmentos de Eco · Passivo: Passos Etéreos',
    passiveBonus: '-8% no raio sonoro de passos em todos os personagens',
    shardReward: 3,
    accentColor: '#22D3EE',
    iconName: 'earOff',
  },
  {
    id: 'ecos_da_palanca',
    title: 'Ecos da Palanca',
    condition: 'Conclua um ato com Kimbamba (Palanca Negra) coletando todos os 3 cristais.',
    rewardLabel: '+3 Fragmentos de Eco · Passivo: Pulso Ancestral',
    passiveBonus: '+15% no alcance de revelação das ondas e da Palanca',
    shardReward: 3,
    accentColor: '#38BDF8',
    iconName: 'sparkles',
  },
  {
    id: 'sinfonia_do_maiombe',
    title: 'Sinfonia do Maiombe',
    condition: 'Alcance Harmonia Sonora igual ou superior a 85% ao finalizar um ato.',
    rewardLabel: '+4 Fragmentos de Eco · Passivo: Calma Respiratória',
    passiveBonus: '+15% na velocidade de recuperação de fôlego',
    shardReward: 4,
    accentColor: '#34D399',
    iconName: 'wind',
  },
  {
    id: 'senhor_das_tempestades',
    title: 'Filho da Tempestade',
    condition: 'Conclua um ato sob Neblina do Namibe ou Tempestade do Kwanza com 6+ passos camuflados.',
    rewardLabel: '+3 Fragmentos de Eco · Passivo: Instinto Climático',
    passiveBonus: '-12% de ruído emitido durante eventos climáticos',
    shardReward: 3,
    accentColor: '#60A5FA',
    iconName: 'cloudRain',
  },
  {
    id: 'mestre_das_iscas',
    title: 'Maestro das Iscas',
    condition: 'Atraia predadores com 3 ou mais seixos de isca num ato sem espantar aves.',
    rewardLabel: '+2 Fragmentos de Eco · Passivo: Bolsa de Iscas',
    passiveBonus: '+1 seixo de isca inicial permanente em toda missão',
    shardReward: 2,
    accentColor: '#FBBF24',
    iconName: 'circleDot',
  },
  {
    id: 'campeao_da_tundavala',
    title: 'Voz da Tundavala',
    condition: 'Conclua o Ato III (Fenda da Tundavala) em até 75s com pelo menos 2 cristais.',
    rewardLabel: '+5 Fragmentos de Eco · Passivo: Passo de Nzinga',
    passiveBonus: '+8% na velocidade ao mover-se agachado',
    shardReward: 5,
    accentColor: '#F43F5E',
    iconName: 'award',
  },
];

export interface RunFeatEvaluationInput {
  levelId: number;
  characterId: CharacterId;
  timeSec: number;
  crystals: number;
  detections: number;
  harmony: number;
  stonesDiverted: number;
  birdsScared: number;
  maskedSteps: number;
  weatherSeen: WeatherEventType[];
}

export function evaluateEarnedSoundRecords(input: RunFeatEvaluationInput): SoundRecordId[] {
  const earned: SoundRecordId[] = [];

  if (input.detections === 0) {
    earned.push('silencio_absoluto');
  }
  if (input.characterId === 'kimbamba' && input.crystals >= 3) {
    earned.push('ecos_da_palanca');
  }
  if (input.harmony >= 85) {
    earned.push('sinfonia_do_maiombe');
  }
  if (
    input.maskedSteps >= 6 &&
    (input.weatherSeen.includes('tempestade_kwanza') ||
      input.weatherSeen.includes('neblina_namibe'))
  ) {
    earned.push('senhor_das_tempestades');
  }
  if (input.stonesDiverted >= 3 && input.birdsScared === 0) {
    earned.push('mestre_das_iscas');
  }
  if (input.levelId === 3 && input.timeSec <= 75 && input.crystals >= 2) {
    earned.push('campeao_da_tundavala');
  }

  return earned;
}

export function getSoundRecordById(id: SoundRecordId): SoundRecordDef | undefined {
  return SOUND_RECORDS.find((r) => r.id === id);
}
