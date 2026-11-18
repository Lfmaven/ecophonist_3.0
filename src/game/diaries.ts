import { SoundDiaryDef, SoundDiaryId } from './types';

export const SOUND_DIARIES: SoundDiaryDef[] = [
  {
    id: 'diario_luanda_sino',
    levelId: 1,
    x: 210,
    y: 200,
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
    x: 700,
    y: 450,
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
    x: 185,
    y: 360,
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
    x: 1010,
    y: 280,
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
    x: 480,
    y: 170,
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
    x: 1245,
    y: 740,
    order: 6,
    title: 'Diário VI · Juramento da Ecofonista',
    chapter: 'História de Nzinga',
    durationSec: 10,
    transcript:
      'Não reconstruiremos Angola com o estrondo das antigas máquinas, mas com a escuta e o respeito ao ritmo da terra. Eu sou Nzinga, e o silêncio agora é nossa voz.',
    ambientTone: 'kissange',
    accentColor: '#F43F5E',
  },
];

export function getDiariesForLevel(levelId: number): SoundDiaryDef[] {
  return SOUND_DIARIES.filter((d) => d.levelId === levelId);
}

export function getDiaryById(id: SoundDiaryId): SoundDiaryDef | undefined {
  return SOUND_DIARIES.find((d) => d.id === id);
}
