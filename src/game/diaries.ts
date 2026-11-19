import { SoundDiaryDef, SoundDiaryId } from './types';

export const SOUND_DIARIES: SoundDiaryDef[] = [
  {
    id: 'diario_luanda_sino',
    levelId: 1,
    x: 560,
    y: 260,
    order: 1,
    title: 'Diário I · O Último Sino da Marginal',
    chapter: 'A Queda da Civilização Angolana',
    durationSec: 10,
    transcript:
      'Registro de Nzinga, Dia 03 do Grande Silêncio: em quarenta e oito horas, as sirenes da Baía de Luanda e os motores da cidade calaram-se para sempre. Qualquer ruído urbano tornou-se um farol para as feras cegas.',
    ambientTone: 'vento_luanda',
    accentColor: '#22D3EE',
  },
  {
    id: 'diario_imbondeiros',
    levelId: 1,
    x: 1680,
    y: 780,
    order: 2,
    title: 'Diário II · A Memória dos Imbondeiros',
    chapter: 'História de Nzinga',
    durationSec: 10,
    transcript:
      'Antes do colapso, eu mapeava frequências sísmicas no Maiombe. Quando perdi minha família no êxodo, o vento entre os imbondeiros ensinou-me a enxergar cada passo como luz na escuridão.',
    ambientTone: 'kissange',
    accentColor: '#34D399',
  },
  {
    id: 'diario_miradouro_queda',
    levelId: 2,
    x: 780,
    y: 340,
    order: 3,
    title: 'Diário III · Cinzas do Miradouro da Lua',
    chapter: 'A Queda da Civilização Angolana',
    durationSec: 10,
    transcript:
      'Os comboios blindados tentaram cruzar estas falésias rumo ao sul, mas o rugido do aço despertou os Colossos Tambor. Aqui aprendemos que força sem silêncio é sentença de morte.',
    ambientTone: 'vento_luanda',
    accentColor: '#FBBF24',
  },
  {
    id: 'diario_pacto_palanca',
    levelId: 2,
    x: 1940,
    y: 760,
    order: 4,
    title: 'Diário IV · O Pacto da Palanca Negra',
    chapter: 'História de Nzinga',
    durationSec: 10,
    transcript:
      'Encontrei Kimbamba ferida perto de Cangandala. Seus chifres ressoavam em harmonia com minha kissange. Juntas a Kandimba, Lueji e Tchissola, formamos a última linha de esperança angolana.',
    ambientTone: 'palanca_eco',
    accentColor: '#38BDF8',
  },
  {
    id: 'diario_huila_broadcast',
    levelId: 3,
    x: 920,
    y: 230,
    order: 5,
    title: 'Diário V · Última Transmissão da Huíla',
    chapter: 'A Queda da Civilização Angolana',
    durationSec: 10,
    transcript:
      'Estação Lubango fora do ar. As cidades costeiras caíram, mas as tempestades da Tundavala e a neblina do Namibe ainda abafam os rastreadores. Quem ouvir este eco, siga pelas fendas.',
    ambientTone: 'trovao_huila',
    accentColor: '#A78BFA',
  },
  {
    id: 'diario_juramento_nzinga',
    levelId: 3,
    x: 2050,
    y: 860,
    order: 6,
    title: 'Diário VI · Juramento da Ecofonista',
    chapter: 'História de Nzinga',
    durationSec: 10,
    transcript:
      'Não reconstruiremos Angola com o estrondo das antigas máquinas, mas com a escuta e o respeito ao ritmo da terra. Eu sou Nzinga, e o silêncio agora é nossa voz.',
    ambientTone: 'kissange',
    accentColor: '#F43F5E',
  },
  {
    id: 'diario_cuanza_viaduto',
    levelId: 4,
    x: 1420,
    y: 250,
    order: 7,
    title: 'Diário VII · A Zona Segura do Cuanza',
    chapter: 'Protocolo Aincrad · Sobrevivência',
    durationSec: 10,
    transcript:
      'Nos viadutos de Bermuda-Cuanza erguemos as primeiras torres moduladoras. Quando a tempestade magnética fecha em anel, só quem domina o ritmo da lâmina e da escuta sobrevive até o próximo setor.',
    ambientTone: 'vento_luanda',
    accentColor: '#F59E0B',
  },
  {
    id: 'diario_benguela_submersa',
    levelId: 5,
    x: 1520,
    y: 840,
    order: 8,
    title: 'Diário VIII · Cidadela de Benguela',
    chapter: 'Protocolo Aincrad · Purgatório',
    durationSec: 10,
    transcript:
      'As águas subiram pelos antigos cais e despertaram o Colosso Gleam-Eyes da Huíla. Cada caixa de suprimento deixada pelos batedores custou um passo calculado na neblina espessa.',
    ambientTone: 'palanca_eco',
    accentColor: '#60A5FA',
  },
  {
    id: 'diario_aincrad_kalahari',
    levelId: 6,
    x: 1620,
    y: 300,
    order: 9,
    title: 'Diário IX · Coração do Pináculo Final',
    chapter: 'O Despertar de Aincrad-Kalahari',
    durationSec: 10,
    transcript:
      'No topo do Pináculo Carmesim aguarda o Arquiteto do Silêncio. Nzinga e Kimbamba não lutam para destruir o mundo, mas para sintonizar o último acorde que libertará Angola da eterna caçada.',
    ambientTone: 'trovao_huila',
    accentColor: '#FB7185',
  },
];

export function getDiariesForLevel(levelId: number): SoundDiaryDef[] {
  return SOUND_DIARIES.filter((d) => d.levelId === levelId);
}

export function getDiaryById(id: SoundDiaryId): SoundDiaryDef | undefined {
  return SOUND_DIARIES.find((d) => d.id === id);
}
