import { getSoundRecordById } from './records';
import {
  CharacterId,
  GameSettings,
  HarmonyEndingTier,
  SaveProgress,
  SoundDiaryId,
  SoundRecordId,
  StoreItem,
  StoreItemId,
} from './types';

const STORAGE_KEY = 'ecophonist_progress_v2';
const MAX_STORAGE_BYTES = 32768;
export const TOTAL_LEVELS = 6;

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function createDefaultProgress(): SaveProgress {
  return {
    unlockedLevel: 1,
    echoShards: 2,
    selectedCharacter: 'nzinga',
    ownedItems: [],
    equippedItems: [],
    unlockedRecords: [],
    collectedDiaries: [],
    settings: { ...DEFAULT_SETTINGS },
    bestScores: {},
  };
}

function safeParseJsonObject(raw: string): Record<string, unknown> | null {
  if (!raw || raw.length > MAX_STORAGE_BYTES) return null;
  const parsed: unknown = JSON.parse(raw, (key, value) => {
    if (FORBIDDEN_KEYS.has(key)) return undefined;
    return value;
  });
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  return parsed as Record<string, unknown>;
}

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.42,
  muted: false,
  sonarSensitivity: 'normal',
  reducedEffects: false,
  difficulty: 'padrao',
  useMicAmbient: false,
};

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'ghost_stones',
    name: 'Seixos do Rio Kwanza',
    description: 'Grátis via conquista: aumenta a capacidade para 7 pedras de isca e acelera a recarga natural em 30%.',
    priceKz: '0 Kz · Conquista',
    shardCost: 4,
    category: 'Equipamento',
  },
  {
    id: 'silk_cloak',
    name: 'Manto Samakaka Abissal',
    description: 'Grátis via conquista: tecido tradicional silenciador que reduz em 25% o raio sonoro de passos normais ou agachados.',
    priceKz: '0 Kz · Conquista',
    shardCost: 6,
    category: 'Equipamento',
  },
  {
    id: 'crystal_lung',
    name: 'Fôlego da Welwítschia',
    description: 'Grátis via conquista: resistência do deserto do Namibe que reduz em 35% o gasto de fôlego ao segurar a respiração.',
    priceKz: '0 Kz · Conquista',
    shardCost: 5,
    category: 'Habilidade',
  },
  {
    id: 'golden_tuning',
    name: 'Kissange Dourada Imperial',
    description: 'Grátis via conquista: transforma o cachecol e as ondulações do Sonar Visual em ressonância dourada e turquesa.',
    priceKz: '0 Kz · Conquista',
    shardCost: 7,
    category: 'Visual',
  },
];

const VALID_ITEM_IDS = new Set<StoreItemId>([
  'ghost_stones',
  'silk_cloak',
  'crystal_lung',
  'golden_tuning',
]);

const VALID_CHARACTER_IDS = new Set<CharacterId>([
  'nzinga',
  'kandimba',
  'lueji',
  'tchissola',
  'kimbamba',
]);

const VALID_RECORD_IDS = new Set<SoundRecordId>([
  'silencio_absoluto',
  'ecos_da_palanca',
  'sinfonia_do_maiombe',
  'senhor_das_tempestades',
  'mestre_das_iscas',
  'campeao_da_tundavala',
  'cacador_de_andar',
  'lenda_do_pinaculo',
]);

const VALID_DIARY_IDS = new Set<SoundDiaryId>([
  'diario_luanda_sino',
  'diario_imbondeiros',
  'diario_miradouro_queda',
  'diario_pacto_palanca',
  'diario_huila_broadcast',
  'diario_juramento_nzinga',
  'diario_cuanza_viaduto',
  'diario_benguela_submersa',
  'diario_aincrad_kalahari',
]);

const DEFAULT_PROGRESS: SaveProgress = {
  unlockedLevel: 1,
  echoShards: 2,
  selectedCharacter: 'nzinga',
  ownedItems: [],
  equippedItems: [],
  unlockedRecords: [],
  collectedDiaries: [],
  settings: { ...DEFAULT_SETTINGS },
  bestScores: {},
};

function sanitizeSettings(raw: unknown): GameSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_SETTINGS };
  }
  const r = raw as Record<string, unknown>;
  const masterVolume =
    typeof r.masterVolume === 'number' && Number.isFinite(r.masterVolume)
      ? Math.max(0, Math.min(1, r.masterVolume))
      : DEFAULT_SETTINGS.masterVolume;

  const muted = typeof r.muted === 'boolean' ? r.muted : DEFAULT_SETTINGS.muted;
  const sonarSensitivity =
    r.sonarSensitivity === 'baixa' ||
    r.sonarSensitivity === 'normal' ||
    r.sonarSensitivity === 'alta'
      ? r.sonarSensitivity
      : DEFAULT_SETTINGS.sonarSensitivity;

  const reducedEffects =
    typeof r.reducedEffects === 'boolean' ? r.reducedEffects : DEFAULT_SETTINGS.reducedEffects;

  const difficulty =
    r.difficulty === 'padrao' || r.difficulty === 'implacavel' || r.difficulty === 'aincrad'
      ? r.difficulty
      : DEFAULT_SETTINGS.difficulty;

  const useMicAmbient =
    typeof r.useMicAmbient === 'boolean' ? r.useMicAmbient : DEFAULT_SETTINGS.useMicAmbient;

  return {
    masterVolume,
    muted,
    sonarSensitivity,
    reducedEffects,
    difficulty,
    useMicAmbient,
  };
}

function sanitizeItemList(raw: unknown): StoreItemId[] {
  if (!Array.isArray(raw)) return [];
  const unique = new Set<StoreItemId>();
  for (const val of raw) {
    if (typeof val === 'string' && VALID_ITEM_IDS.has(val as StoreItemId)) {
      unique.add(val as StoreItemId);
    }
  }
  return Array.from(unique);
}

function sanitizeRecordList(raw: unknown): SoundRecordId[] {
  if (!Array.isArray(raw)) return [];
  const unique = new Set<SoundRecordId>();
  for (const val of raw) {
    if (typeof val === 'string' && VALID_RECORD_IDS.has(val as SoundRecordId)) {
      unique.add(val as SoundRecordId);
    }
  }
  return Array.from(unique);
}

function sanitizeDiaryList(raw: unknown): SoundDiaryId[] {
  if (!Array.isArray(raw)) return [];
  const unique = new Set<SoundDiaryId>();
  for (const val of raw) {
    if (typeof val === 'string' && VALID_DIARY_IDS.has(val as SoundDiaryId)) {
      unique.add(val as SoundDiaryId);
    }
  }
  return Array.from(unique);
}

export function loadProgress(): SaveProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultProgress();
    }
    const obj = safeParseJsonObject(raw);
    if (!obj) {
      return createDefaultProgress();
    }
    const unlockedLevel =
      typeof obj.unlockedLevel === 'number' &&
      Number.isInteger(obj.unlockedLevel) &&
      obj.unlockedLevel >= 1 &&
      obj.unlockedLevel <= TOTAL_LEVELS
        ? obj.unlockedLevel
        : 1;

    const echoShards =
      typeof obj.echoShards === 'number' &&
      Number.isFinite(obj.echoShards) &&
      obj.echoShards >= 0
        ? Math.min(9999, Math.round(obj.echoShards))
        : DEFAULT_PROGRESS.echoShards;

    const selectedCharacter: CharacterId =
      typeof obj.selectedCharacter === 'string' &&
      VALID_CHARACTER_IDS.has(obj.selectedCharacter as CharacterId)
        ? (obj.selectedCharacter as CharacterId)
        : 'nzinga';

    const ownedItems = sanitizeItemList(obj.ownedItems);
    const equippedItems = sanitizeItemList(obj.equippedItems).filter((id) =>
      ownedItems.includes(id)
    );
    const unlockedRecords = sanitizeRecordList(obj.unlockedRecords);
    const collectedDiaries = sanitizeDiaryList(obj.collectedDiaries);

    const bestScores: SaveProgress['bestScores'] = {};
    if (obj.bestScores && typeof obj.bestScores === 'object' && !Array.isArray(obj.bestScores)) {
      const rawScores = obj.bestScores as Record<string, unknown>;
      for (const key of ['1', '2', '3', '4', '5', '6']) {
        const entry = Object.prototype.hasOwnProperty.call(rawScores, key) ? rawScores[key] : undefined;
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
          const rec = entry as Record<string, unknown>;
          if (
            typeof rec.timeSec === 'number' &&
            Number.isFinite(rec.timeSec) &&
            typeof rec.crystals === 'number' &&
            Number.isFinite(rec.crystals) &&
            typeof rec.detections === 'number' &&
            Number.isFinite(rec.detections)
          ) {
            const harmony =
              typeof rec.harmony === 'number' && Number.isFinite(rec.harmony)
                ? Math.max(0, Math.min(100, Math.round(rec.harmony)))
                : undefined;
            bestScores[Number(key)] = {
              timeSec: Math.max(0, Math.round(rec.timeSec)),
              crystals: Math.max(0, Math.min(4, Math.round(rec.crystals))),
              detections: Math.max(0, Math.round(rec.detections)),
              ...(harmony !== undefined ? { harmony } : {}),
            };
          }
        }
      }
    }

    return {
      unlockedLevel,
      echoShards,
      selectedCharacter,
      ownedItems,
      equippedItems,
      unlockedRecords,
      collectedDiaries,
      settings: sanitizeSettings(obj.settings),
      bestScores,
    };
  } catch {
    return createDefaultProgress();
  }
}

export function persistProgress(progress: SaveProgress): void {
  try {
    const ownedItems = sanitizeItemList(progress.ownedItems);
    const safePayload: SaveProgress = {
      unlockedLevel: Math.max(1, Math.min(TOTAL_LEVELS, Math.round(progress.unlockedLevel || 1))),
      echoShards: Math.max(0, Math.min(9999, Math.round(progress.echoShards || 0))),
      selectedCharacter: VALID_CHARACTER_IDS.has(progress.selectedCharacter)
        ? progress.selectedCharacter
        : 'nzinga',
      ownedItems,
      equippedItems: sanitizeItemList(progress.equippedItems).filter((id) => ownedItems.includes(id)),
      unlockedRecords: sanitizeRecordList(progress.unlockedRecords),
      collectedDiaries: sanitizeDiaryList(progress.collectedDiaries),
      settings: sanitizeSettings(progress.settings),
      bestScores: progress.bestScores ?? {},
    };
    const serialized = JSON.stringify(safePayload);
    if (serialized.length <= MAX_STORAGE_BYTES) {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch {
    // Storage quota or restricted browsing mode; fail safely without throwing
  }
}

export function getHarmonyEnding(harmony: number): {
  tier: HarmonyEndingTier;
  title: string;
  finalTitle: string;
  description: string;
  finalDescription: string;
  shardBonus: number;
} {
  if (harmony >= 80) {
    return {
      tier: 'harmonia_pura',
      title: 'Harmonia Pura',
      finalTitle: 'Final Luminoso · Sinfonia de Aincrad-Angola',
      description:
        'Seus passos camuflados, Sword Skills precisas e disciplina mantiveram o ecossistema em equilíbrio.',
      finalDescription:
        'Com o Arquiteto Carmesim derrotado em reverência ao silêncio de Nzinga e Kimbamba, a paz sonora retorna do Maiombe ao Pináculo de Kalahari.',
      shardBonus: 2,
    };
  }
  if (harmony >= 45) {
    return {
      tier: 'equilibrio_instavel',
      title: 'Equilíbrio Instável',
      finalTitle: 'Final Neutro · Eco Dividido',
      description:
        'Você alternou entre furtividade calculada, saques de Zona Segura e golpes decisivos para vencer.',
      finalDescription:
        'A expedição conquista o Pináculo Aincrad-Kalahari, mas os ecos da batalha mantêm os guardiões restantes em vigília na fronteira.',
      shardBonus: 1,
    };
  }
  return {
    tier: 'dissonancia_caotica',
    title: 'Dissonância Caótica',
    finalTitle: 'Final Sombrio · Cacofonia Eterna',
    description:
      'Ruídos excessivos, combates abertos e revoadas quebraram a harmonia da região.',
    finalDescription:
      'Embora a equipa tenha escapado pela Zona Segura final, a cacofonia despertou novas torres de predadores pelas terras angolanas.',
    shardBonus: 0,
  };
}

export function saveLevelCompletion(
  levelId: number,
  timeSec: number,
  crystals: number,
  detections: number,
  harmony = 65,
  earnedRecordIds: SoundRecordId[] = []
): { progress: SaveProgress; newlyUnlockedRecords: SoundRecordId[] } {
  const current = loadProgress();
  const nextUnlocked = Math.min(TOTAL_LEVELS, Math.max(current.unlockedLevel, levelId + 1));
  const prev = current.bestScores[levelId];
  const clampedHarmony = Math.max(0, Math.min(100, Math.round(harmony)));

  const isBetter =
    !prev ||
    crystals > prev.crystals ||
    (crystals === prev.crystals && clampedHarmony > (prev.harmony ?? 0)) ||
    (crystals === prev.crystals &&
      clampedHarmony === (prev.harmony ?? 0) &&
      detections < prev.detections) ||
    (crystals === prev.crystals &&
      clampedHarmony === (prev.harmony ?? 0) &&
      detections === prev.detections &&
      timeSec < prev.timeSec);

  const newlyUnlockedRecords = earnedRecordIds.filter(
    (id) => VALID_RECORD_IDS.has(id) && !current.unlockedRecords.includes(id)
  );
  const recordShardBonus = newlyUnlockedRecords.reduce((sum, id) => {
    const def = getSoundRecordById(id);
    return sum + (def ? def.shardReward : 0);
  }, 0);

  const harmonyBonus = getHarmonyEnding(clampedHarmony).shardBonus;
  const earnedShards =
    1 + crystals + (detections === 0 ? 1 : 0) + harmonyBonus + recordShardBonus;

  const updated: SaveProgress = {
    ...current,
    unlockedLevel: nextUnlocked,
    echoShards: Math.min(9999, current.echoShards + earnedShards),
    unlockedRecords: [...current.unlockedRecords, ...newlyUnlockedRecords],
    bestScores: {
      ...current.bestScores,
      [levelId]: isBetter
        ? {
            timeSec: Math.max(0, Math.round(timeSec)),
            crystals: Math.max(0, Math.min(4, crystals)),
            detections: Math.max(0, detections),
            harmony: clampedHarmony,
          }
        : prev,
    },
  };

  persistProgress(updated);
  return { progress: updated, newlyUnlockedRecords };
}

export function saveDiaryCollected(diaryId: SoundDiaryId): SaveProgress {
  const current = loadProgress();
  if (!VALID_DIARY_IDS.has(diaryId) || current.collectedDiaries.includes(diaryId)) {
    return current;
  }
  const updated: SaveProgress = {
    ...current,
    echoShards: Math.min(9999, current.echoShards + 1),
    collectedDiaries: [...current.collectedDiaries, diaryId],
  };
  persistProgress(updated);
  return updated;
}
