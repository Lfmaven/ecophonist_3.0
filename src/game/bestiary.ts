export type BestiaryCreatureId = 'stalker' | 'wraith' | 'goliath' | 'weavers';

export interface BestiaryEntry {
  id: BestiaryCreatureId;
  name: string;
  classification: string;
  threatLabel: string;
  accentColor: string;
  artwork: string;
  actsFound: string;
  soundSignature: {
    waveform: string;
    frequencyHz: string;
    cadenceSec: string;
    hearingRadius: string;
    speedPatrol: string;
    speedHunt: string;
    waveType: 'sawtooth' | 'sine' | 'triangle' | 'chorus';
    baseFreq: number;
    harmonics: number;
  };
  ecologySummary: string;
  acousticBehavior: string;
  survivalTactics: string[];
}

export const BESTIARY_ENTRIES: BestiaryEntry[] = [
  {
    id: 'stalker',
    name: 'Rastreador Cego',
    classification: 'Predador Quadrúpede · Audição Direcional',
    threatLabel: 'Ameaça Alta',
    accentColor: '#FB7185',
    artwork: '/src/assets/images/bestiary_stalker_sound_1794990574258.jpg',
    actsFound: 'Atos I, II e III',
    soundSignature: {
      waveform: 'Dente de Serra Cortante',
      frequencyHz: '280 – 880 Hz',
      cadenceSec: '1,6 s',
      hearingRadius: '320 px',
      speedPatrol: '82 px/s',
      speedHunt: '188 px/s',
      waveType: 'sawtooth',
      baseFreq: 1.8,
      harmonics: 3,
    },
    ecologySummary:
      'Desprovido de visão, desenvolveu pavilhões auriculares em forma de trompa que captam o menor atrito de passos sobre folhas ou pedras do Maiombe.',
    acousticBehavior:
      'Emite estalos curtos e rápidos em formato de leque carmesim. Quando a suspeita atinge o limite, alterna para frequência aguda em dente de serra e dispara na velocidade máxima entre todos os predadores.',
    survivalTactics: [
      'Agache (C) ao cruzar corredores estreitos para cortar o raio dos seus passos.',
      'Use pedras de isca (Q ou clique) para desviá-lo da rota de patrulha.',
      'Segure o fôlego (Espaço) quando suas orelhas brilharem perto de você.',
    ],
  },
  {
    id: 'wraith',
    name: 'Sereia Ressonante',
    classification: 'Espectro Flutuante · Relé de Alarme',
    threatLabel: 'Ameaça Crítica',
    accentColor: '#C084FC',
    artwork: '/src/assets/images/bestiary_wraith_sound_1794990575591.jpg',
    actsFound: 'Atos II e III',
    soundSignature: {
      waveform: 'Senoidal Harmônica Dupla',
      frequencyHz: '690 – 1.480 Hz',
      cadenceSec: '1,9 s',
      hearingRadius: '410 px',
      speedPatrol: '68 px/s',
      speedHunt: '162 px/s',
      waveType: 'sine',
      baseFreq: 2.9,
      harmonics: 2,
    },
    ecologySummary:
      'Suspensa por asas semelhantes a diapasões metálicos, possui a maior sensibilidade auditiva das falésias angolanas, detectando ruídos até 410 px de distância.',
    acousticBehavior:
      'Ao entrar em estado de caçada, solta um grito harmônico que atravessa obstáculos em ondas violeta de 440 px, elevando imediatamente a suspeita de outros predadores próximos.',
    survivalTactics: [
      'Ergue cortinas de Sussurro na Folha (E) entre você e a Sereia para bloquear seus ecos.',
      'Evite provocar revoadas de aves enquanto houver uma Sereia no setor.',
      'No Ato III, ative o Canto do Silêncio (R) para atravessar sua zona de escuta sem gerar ondas.',
    ],
  },
  {
    id: 'goliath',
    name: 'Colosso Tambor',
    classification: 'Colosso Blindado · Ressonância Sísmica',
    threatLabel: 'Ameaça Extrema',
    accentColor: '#FBBF24',
    artwork: '/src/assets/images/bestiary_goliath_sound_1794990575353.jpg',
    actsFound: 'Atos II e III',
    soundSignature: {
      waveform: 'Sub-Grave Triangular Sísmica',
      frequencyHz: '42 – 130 Hz',
      cadenceSec: '2,3 s',
      hearingRadius: '360 px',
      speedPatrol: '48 px/s',
      speedHunt: '132 px/s',
      waveType: 'triangle',
      baseFreq: 0.9,
      harmonics: 4,
    },
    ecologySummary:
      'Uma mole blindada com tambores córneos nos ombros e no tórax. Patrulha de forma lenta, mas cada impacto no solo envia anéis graves que iluminam grandes porções da escuridão.',
    acousticBehavior:
      'Responde com fúria a qualquer cacofonia intensa — corridas prolongadas, trovões próximos ou bandos de aves espantados — investindo em linha reta rumo ao epicentro do ruído.',
    survivalTactics: [
      'Aproveite seus intervalos lentos de patrulha (48 px/s) para flanquear por trás de ruínas.',
      'Atraia o Colosso para longe do santuário lançando um seixo próximo a um Bando de Tecelões.',
      'Durante Tempestades do Kwanza, a chuva reduz sua audição eficaz em 38%.',
    ],
  },
  {
    id: 'weavers',
    name: 'Bando de Tecelões',
    classification: 'Fauna Ecológica · Gatilho de Cacofonia',
    threatLabel: 'Catalisador Ambiental',
    accentColor: '#F472B6',
    artwork: '/src/assets/images/bestiary_weavers_sound_1794990575748.jpg',
    actsFound: 'Atos I, II e III',
    soundSignature: {
      waveform: 'Coro Agudo em Cascata',
      frequencyHz: '1.600 – 2.400 Hz',
      cadenceSec: 'Reativo (>= 48 dB)',
      hearingRadius: '560 px de eco',
      speedPatrol: 'Pousado',
      speedHunt: 'Revoada 2,6 s',
      waveType: 'chorus',
      baseFreq: 4.2,
      harmonics: 5,
    },
    ecologySummary:
      'Pequenas aves noturnas que descansam nos ramos dos imbondeiros e penhascos. Não causam dano direto, mas funcionam como sensores vivos no ecossistema acústico.',
    acousticBehavior:
      'Qualquer onda sonora acima de 48 dB não mascarada pelo vento faz o bando levantar voo em pânico, disparando uma onda rosa massiva de 560 px que revela paredes e atrai todos os predadores da área.',
    survivalTactics: [
      'Caminhe agachado ou espere a brisa dos imbondeiros ao passar perto dos ninhos.',
      'Propositalmente acerte um seixo no bando para criar uma distração gigante longe da saída.',
      'Use o flash acústico da revoada para mapear obstáculos ocultos no escuro.',
    ],
  },
];
