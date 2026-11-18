export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER'
  | 'VICTORY';

export type EnemyType = 'stalker' | 'wraith' | 'goliath';
export type EnemyAlertState = 'patrol' | 'investigate' | 'hunt';
export type WeatherEventType = 'calma' | 'neblina_namibe' | 'tempestade_kwanza' | 'cacimbo';
export type CharacterId = 'nzinga' | 'kandimba' | 'lueji' | 'tchissola' | 'kimbamba';
export type HarmonyEndingTier = 'harmonia_pura' | 'equilibrio_instavel' | 'dissonancia_caotica';
export type SoundRecordId =
  | 'silencio_absoluto'
  | 'ecos_da_palanca'
  | 'sinfonia_do_maiombe'
  | 'senhor_das_tempestades'
  | 'mestre_das_iscas'
  | 'campeao_da_tundavala';

export type SoundDiaryId =
  | 'diario_luanda_sino'
  | 'diario_imbondeiros'
  | 'diario_miradouro_queda'
  | 'diario_pacto_palanca'
  | 'diario_huila_broadcast'
  | 'diario_juramento_nzinga';

export interface SoundDiaryDef {
  id: SoundDiaryId;
  levelId: number;
  x: number;
  y: number;
  order: number;
  title: string;
  chapter: string;
  durationSec: number;
  transcript: string;
  ambientTone: 'kissange' | 'vento_luanda' | 'trovao_huila' | 'palanca_eco';
  accentColor: string;
}

export interface SoundRecordDef {
  id: SoundRecordId;
  title: string;
  condition: string;
  rewardLabel: string;
  passiveBonus: string;
  shardReward: number;
  accentColor: string;
  iconName: 'earOff' | 'sparkles' | 'wind' | 'cloudRain' | 'circleDot' | 'award';
}

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  archetype: string;
  specialty: string;
  description: string;
  portrait: string;
  accentColor: string;
  scarfColor: string;
  isLead: boolean;
  bonuses: {
    speedMult: number;
    noiseMult: number;
    maxHp: number;
    extraStones: number;
    throwRangeMult: number;
    cooldownMult: number;
  };
}

export type StoreItemId =
  | 'ghost_stones'
  | 'silk_cloak'
  | 'crystal_lung'
  | 'golden_tuning';

export interface StoreItem {
  id: StoreItemId;
  name: string;
  description: string;
  priceKz: string;
  shardCost: number;
  category: 'Equipamento' | 'Habilidade' | 'Visual';
}

export interface GameSettings {
  masterVolume: number; // 0..1
  muted: boolean;
  sonarSensitivity: 'baixa' | 'normal' | 'alta';
  reducedEffects: boolean;
  difficulty: 'padrao' | 'implacavel';
  useMicAmbient: boolean;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'wall' | 'ruin' | 'pillar';
  discoveredAlpha: number;
}

export interface WindZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  cyclePeriod: number;
  activeDuration: number;
  phaseOffset: number;
  isActive: boolean;
  strength: number; // 0..1
}

export interface BirdFlock {
  id: string;
  x: number;
  y: number;
  radius: number;
  state: 'perched' | 'scattering' | 'gone';
  scatterTimer: number;
  birds: Array<{ offsetAngle: number; offsetDist: number; wingPhase: number }>;
}

export interface ResonanceCrystal {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  pulsePhase: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  patrolPoints: Vec2[];
  patrolIndex: number;
  state: EnemyAlertState;
  suspicion: number; // 0..100
  targetPos: Vec2 | null;
  stateTimer: number;
  sonarTimer: number;
  sonarInterval: number;
  hearingRadius: number;
  speedPatrol: number;
  speedHunt: number;
  revealedAlpha: number;
}

export interface SoundWave {
  id: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  color: string;
  source: 'player' | 'stone' | 'wind' | 'leaf' | 'birds' | 'enemy' | 'thunder' | 'exit' | 'diary';
  loudness: number; // 0..100
  masked: boolean;
  thickness: number;
  attenuationFactor: number; // 0..0.65 real-time wind/fog attenuation
}

export interface BreathParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface OnomatopoeiaSFX {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface ThrownStone {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0..1
  duration: number;
}

export interface LeafWhisperZone {
  id: number;
  x: number;
  y: number;
  radius: number;
  remaining: number;
  maxDuration: number;
  waveTimer: number;
}

export interface SilenceBubble {
  x: number;
  y: number;
  radius: number;
  remaining: number;
  maxDuration: number;
  followPlayer: boolean;
}

export interface WeatherState {
  current: WeatherEventType;
  nextTimer: number;
  duration: number;
  rainIntensity: number; // 0..1
  fogIntensity: number; // 0..1
  cacimboIntensity: number; // 0..1
  lightningFlash: number; // 0..1
  nextThunderTimer: number;
  windIntensity: number; // 0..1 dynamic real-time Namibe wind strength
  windDirection: number; // radians
  windGustTimer: number;
  windGustTarget: number; // 0..1 target gust intensity
  soundAttenuationRate: number; // 0..0.65 visual/acoustic attenuation
  soundPropagationFactor: number; // 0.45..1.0
  enemyHearingFactor: number; // 0.45..1.0
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  hp: number;
  maxHp: number;
  breath: number; // 0..100
  isHoldingBreath: boolean;
  breathGasping: number; // >0 cooldown when breath hits 0
  isSprinting: boolean;
  isCrouching: boolean;
  stepTimer: number;
  breathParticleTimer: number;
  isCamouflaged: boolean;
  camouflageSource: string | null;
  currentNoiseDb: number;
  stones: number;
  maxStones: number;
  whisperCooldown: number;
  whisperMaxCooldown: number;
  silenceCooldown: number;
  silenceMaxCooldown: number;
  invulnerableTimer: number;
  scarfTrail: Vec2[];
}

export interface LevelConfig {
  id: number;
  title: string;
  subtitle: string;
  objectiveHint: string;
  worldWidth: number;
  worldHeight: number;
  playerStart: Vec2;
  exitPos: Vec2;
  exitRadius: number;
  hasWhisperAbility: boolean;
  hasSilenceAbility: boolean;
  stormEnabled: boolean;
  allowedWeather: WeatherEventType[];
  obstacles: Omit<Obstacle, 'discoveredAlpha'>[];
  windZones: Array<{
    id: string;
    x: number;
    y: number;
    radius: number;
    cyclePeriod: number;
    activeDuration: number;
    phaseOffset: number;
  }>;
  birdFlocks: Array<{ id: string; x: number; y: number; radius: number }>;
  crystals: Array<{ id: string; x: number; y: number }>;
  enemies: Array<{
    id: string;
    type: EnemyType;
    patrolPoints: Vec2[];
  }>;
}

export interface HUDTelemetry {
  hp: number;
  maxHp: number;
  breath: number;
  isHoldingBreath: boolean;
  breathGasping: boolean;
  isCamouflaged: boolean;
  camouflageSource: string | null;
  currentNoiseDb: number;
  ambientVolume: number; // 0..100
  stones: number;
  maxStones: number;
  whisperReady: boolean;
  whisperCooldown: number;
  hasWhisperAbility: boolean;
  silenceReady: boolean;
  silenceCooldown: number;
  hasSilenceAbility: boolean;
  silenceActiveRemaining: number;
  crystalsCollected: number;
  crystalsTotal: number;
  diariesCollectedInLevel: number;
  diariesTotalInLevel: number;
  stormActive: boolean;
  weatherEvent: WeatherEventType;
  weatherLabel: string;
  weatherRemaining: number;
  soundPropagationPct: number;
  windIntensityPct: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windDirectionLabel: string;
  windGustLabel: string;
  soundAttenuationPct: number;
  elapsedSeconds: number;
  timesDetected: number;
  highestAlert: EnemyAlertState;
  nearbyEnemyDist: number;
  heartRateBpm: number;
  soundHarmony: number; // 0..100
  soundComboCount: number;
  soundComboMultiplier: number;
  soundComboTimerPct: number;
  soundComboLabel: string;
  maxSoundCombo: number;
  camouflageHint: CamouflageQuickHint | null;
}

export interface CamouflageQuickHint {
  id: string;
  environmentLabel: string;
  title: string;
  suggestion: string;
  actionTag: string;
  accentColor: string;
}

export interface SaveProgress {
  unlockedLevel: number;
  echoShards: number;
  selectedCharacter: CharacterId;
  ownedItems: StoreItemId[];
  equippedItems: StoreItemId[];
  unlockedRecords: SoundRecordId[];
  collectedDiaries: SoundDiaryId[];
  settings: GameSettings;
  bestScores: Record<
    number,
    { timeSec: number; crystals: number; detections: number; harmony?: number }
  >;
}
