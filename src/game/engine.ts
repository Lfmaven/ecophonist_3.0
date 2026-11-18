import { CHARACTERS, getCharacterById } from './characters';
import { getDiariesForLevel } from './diaries';
import { evaluateEarnedSoundRecords } from './records';
import { soundEngine } from './soundEngine';
import {
  BirdFlock,
  BreathParticle,
  CamouflageQuickHint,
  CharacterId,
  CharacterProfile,
  Enemy,
  GameSettings,
  HUDTelemetry,
  LeafWhisperZone,
  LevelConfig,
  Obstacle,
  OnomatopoeiaSFX,
  PlayerState,
  ResonanceCrystal,
  SilenceBubble,
  SoundDiaryDef,
  SoundRecordId,
  SoundWave,
  StoreItemId,
  ThrownStone,
  Vec2,
  WeatherEventType,
  WeatherState,
  WindZone,
} from './types';

const WEATHER_PROFILES: Record<
  WeatherEventType,
  {
    label: string;
    propFactor: number;
    hearingFactor: number;
    duration: number;
    baseWind: number;
    gustMax: number;
  }
> = {
  calma: {
    label: 'Calma Noturna',
    propFactor: 1.0,
    hearingFactor: 1.0,
    duration: 12,
    baseWind: 0.12,
    gustMax: 0.28,
  },
  neblina_namibe: {
    label: 'Neblina do Namibe',
    propFactor: 0.68,
    hearingFactor: 0.68,
    duration: 18,
    baseWind: 0.46,
    gustMax: 0.96,
  },
  tempestade_kwanza: {
    label: 'Tempestade do Kwanza',
    propFactor: 0.82,
    hearingFactor: 0.62,
    duration: 17,
    baseWind: 0.52,
    gustMax: 0.92,
  },
  cacimbo: {
    label: 'Vento Cacimbo',
    propFactor: 0.85,
    hearingFactor: 0.78,
    duration: 15,
    baseWind: 0.4,
    gustMax: 0.84,
  },
};

const COMPASS_LABELS = ['L', 'SE', 'S', 'SO', 'O', 'NO', 'N', 'NE'] as const;

function formatWindDirection(rad: number): { deg: number; label: string } {
  const norm = ((rad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const deg = Math.round((norm * 180) / Math.PI) % 360;
  const idx = Math.round(norm / (Math.PI / 4)) % 8;
  return { deg, label: COMPASS_LABELS[idx] };
}

function getWindGustLabel(intensity: number, weather: WeatherEventType): string {
  if (intensity >= 0.76) {
    return weather === 'neblina_namibe' ? 'Rajada do Namibe' : 'Vendaval Forte';
  }
  if (intensity >= 0.48) {
    return weather === 'neblina_namibe' ? 'Brisa do Namibe' : 'Vento Moderado';
  }
  if (intensity >= 0.24) {
    return 'Aragem Costeira';
  }
  return 'Calmaria';
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

function circleRectCollide(
  cx: number,
  cy: number,
  cr: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): { hit: boolean; nx: number; ny: number; overlap: number } {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX;
  const dy = cy - closestY;
  const d = Math.hypot(dx, dy);
  if (d >= cr) {
    return { hit: false, nx: 0, ny: 0, overlap: 0 };
  }
  if (d === 0) {
    return { hit: true, nx: 0, ny: -1, overlap: cr };
  }
  return { hit: true, nx: dx / d, ny: dy / d, overlap: cr - d };
}

export interface EngineCallbacks {
  onTelemetry: (telemetry: HUDTelemetry) => void;
  onDiaryCollected?: (diary: SoundDiaryDef) => void;
  onVictory: (stats: {
    timeSec: number;
    crystals: number;
    detections: number;
    harmony: number;
    earnedRecords: SoundRecordId[];
  }) => void;
  onGameOver: () => void;
}

export class EcophonistEngine {
  private level: LevelConfig;
  private callbacks: EngineCallbacks;

  private player: PlayerState;
  private obstacles: Obstacle[] = [];
  private windZones: WindZone[] = [];
  private birdFlocks: BirdFlock[] = [];
  private crystals: ResonanceCrystal[] = [];
  private diaries: Array<SoundDiaryDef & { collected: boolean; pulsePhase: number; beaconTimer: number }> = [];
  private enemies: Enemy[] = [];
  private waves: SoundWave[] = [];
  private breathParticles: BreathParticle[] = [];
  private onomatopoeias: OnomatopoeiaSFX[] = [];
  private stones: ThrownStone[] = [];
  private whisperZones: LeafWhisperZone[] = [];
  private silenceBubble: SilenceBubble | null = null;
  private weather: WeatherState;

  private nextId = 1;
  private elapsedSeconds = 0;
  private timesDetected = 0;
  private stoneRegenTimer = 0;
  private telemetryTimer = 0;
  private worldTime = 0;
  private finished = false;

  // Input state
  private keys = new Set<string>();
  private mouseWorld: Vec2 = { x: 0, y: 0 };
  private camera: Vec2 = { x: 0, y: 0 };
  private viewWidth = 1000;
  private viewHeight = 620;
  private screenShake = 0;

  // Settings, Character & Paid Items
  private settings: GameSettings;
  private equippedItems: Set<StoreItemId>;
  private character: CharacterProfile;
  private companions: Array<{ profile: CharacterProfile; x: number; y: number; angle: number }> = [];
  private palancaPulseTimer = 3.0;
  private ambientVolume = 0.14;
  private heartRateBpm = 70;
  private heartBeatPhase = 0;
  private soundHarmony = 65;
  private unlockedRecords: Set<SoundRecordId>;
  private stonesDiverted = 0;
  private birdsScared = 0;
  private maskedSteps = 0;
  private weatherSeen = new Set<WeatherEventType>();
  private stationaryNearEnemyTimer = 0;
  private activeCamouflageHint: CamouflageQuickHint | null = null;
  private soundComboCount = 0;
  private maxSoundCombo = 0;
  private soundComboTimer = 0;
  private readonly soundComboMaxWindow = 9.0;
  private soundComboLabel = '';
  private stepComboCooldown = 0;
  private breathHoldComboProgress = 0;

  // Virtual joystick / touch move vector
  private touchMoveVec: Vec2 = { x: 0, y: 0 };

  constructor(
    level: LevelConfig,
    callbacks: EngineCallbacks,
    settings: GameSettings,
    equippedItems: StoreItemId[],
    characterId: CharacterId = 'nzinga',
    unlockedRecords: SoundRecordId[] = []
  ) {
    this.level = level;
    this.callbacks = callbacks;
    this.settings = settings;
    this.equippedItems = new Set(equippedItems);
    this.unlockedRecords = new Set(unlockedRecords);
    this.character = getCharacterById(characterId);
    this.player = this.createInitialPlayer(level);

    const startWeather = level.allowedWeather[0] ?? 'calma';
    this.weatherSeen.add(startWeather);
    const profile = WEATHER_PROFILES[startWeather];
    const initWind = profile.baseWind;
    const initFog = startWeather === 'neblina_namibe' ? 0.85 : 0;
    const initAtten = clamp(initWind * 0.46 + initFog * 0.14, 0, 0.62);
    this.weather = {
      current: startWeather,
      nextTimer: profile.duration,
      duration: profile.duration,
      rainIntensity: startWeather === 'tempestade_kwanza' ? 0.85 : 0,
      fogIntensity: initFog,
      cacimboIntensity: startWeather === 'cacimbo' ? 0.85 : 0,
      lightningFlash: 0,
      nextThunderTimer: 4.5,
      windIntensity: initWind,
      windDirection: Math.PI * 0.82, // Coastal Atlantic SW->NE drift
      windGustTimer: 3.6,
      windGustTarget: initWind,
      soundAttenuationRate: initAtten,
      soundPropagationFactor: clamp(profile.propFactor * (1 - initAtten * 0.25), 0.45, 1.0),
      enemyHearingFactor: clamp(profile.hearingFactor * (1 - initAtten * 0.22), 0.45, 1.0),
    };

    this.initEntities(level);
    this.emitTelemetry();
  }

  public updateConfig(settings: GameSettings, equippedItems: StoreItemId[]): void {
    this.settings = settings;
    this.equippedItems = new Set(equippedItems);
    const hasGhost = this.equippedItems.has('ghost_stones');
    const bonusStone = this.unlockedRecords.has('mestre_das_iscas') ? 1 : 0;
    this.player.maxStones = (hasGhost ? 7 : 5) + this.character.bonuses.extraStones + bonusStone;
    if (this.player.stones > this.player.maxStones) {
      this.player.stones = this.player.maxStones;
    }
  }

  public getPlayerScreenPos(): Vec2 {
    return {
      x: this.player.x - this.camera.x,
      y: this.player.y - this.camera.y,
    };
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public hasGoldenTuning(): boolean {
    return this.equippedItems.has('golden_tuning');
  }

  public getWindState(): {
    intensity: number;
    direction: number;
    attenuationRate: number;
    speedKmh: number;
  } {
    return {
      intensity: this.weather.windIntensity,
      direction: this.weather.windDirection,
      attenuationRate: this.weather.soundAttenuationRate,
      speedKmh: Math.round(4 + this.weather.windIntensity * 60),
    };
  }

  public getHeartbeatState(): {
    bpm: number;
    phase: number;
    pulse: number;
    stress: number;
  } {
    const lub = Math.exp(-Math.pow((this.heartBeatPhase - 0.08) / 0.055, 2));
    const dub = 0.65 * Math.exp(-Math.pow((this.heartBeatPhase - 0.25) / 0.05, 2));
    const pulse = clamp(lub + dub, 0, 1);
    const stress = clamp((this.heartRateBpm - 68) / 106, 0, 1);
    return {
      bpm: Math.round(this.heartRateBpm),
      phase: this.heartBeatPhase,
      pulse,
      stress,
    };
  }

  private createInitialPlayer(level: LevelConfig): PlayerState {
    const trail: Vec2[] = [];
    for (let i = 0; i < 8; i++) {
      trail.push({ x: level.playerStart.x - i * 4, y: level.playerStart.y });
    }
    const bonusStone = this.unlockedRecords.has('mestre_das_iscas') ? 1 : 0;
    const maxStones =
      (this.equippedItems.has('ghost_stones') ? 7 : 5) +
      this.character.bonuses.extraStones +
      bonusStone;
    const maxHp = this.character.bonuses.maxHp;
    return {
      x: level.playerStart.x,
      y: level.playerStart.y,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: this.character.id === 'kimbamba' ? 17 : 15,
      hp: maxHp,
      maxHp,
      breath: 100,
      isHoldingBreath: false,
      breathGasping: 0,
      isSprinting: false,
      isCrouching: false,
      stepTimer: 0,
      breathParticleTimer: 0,
      isCamouflaged: false,
      camouflageSource: null,
      currentNoiseDb: 0,
      stones: maxStones,
      maxStones,
      whisperCooldown: 0,
      whisperMaxCooldown: Math.round(11 * this.character.bonuses.cooldownMult * 10) / 10,
      silenceCooldown: 0,
      silenceMaxCooldown: Math.round(16 * this.character.bonuses.cooldownMult * 10) / 10,
      invulnerableTimer: 0,
      scarfTrail: trail,
    };
  }

  private initEntities(level: LevelConfig): void {
    this.obstacles = level.obstacles.map((o) => ({ ...o, discoveredAlpha: 0.14 }));
    this.windZones = level.windZones.map((w) => ({
      ...w,
      isActive: false,
      strength: 0,
    }));
    this.birdFlocks = level.birdFlocks.map((b) => ({
      ...b,
      state: 'perched',
      scatterTimer: 0,
      birds: Array.from({ length: 7 }, (_, i) => ({
        offsetAngle: (i / 7) * Math.PI * 2,
        offsetDist: 14 + (i % 3) * 12,
        wingPhase: i * 0.9,
      })),
    }));
    this.crystals = level.crystals.map((c, idx) => ({
      ...c,
      collected: false,
      pulsePhase: idx * 1.4,
    }));
    this.diaries = getDiariesForLevel(level.id).map((d, idx) => ({
      ...d,
      collected: false,
      pulsePhase: idx * 1.8,
      beaconTimer: 1.2 + idx * 1.3,
    }));
    this.enemies = level.enemies.map((e) => {
      const start = e.patrolPoints[0] ?? { x: 400, y: 400 };
      const spec =
        e.type === 'goliath'
          ? { radius: 24, hearing: 360, spPatrol: 48, spHunt: 132, sonar: 2.3 }
          : e.type === 'wraith'
            ? { radius: 18, hearing: 410, spPatrol: 68, spHunt: 162, sonar: 1.9 }
            : { radius: 16, hearing: 320, spPatrol: 82, spHunt: 188, sonar: 1.6 };

      return {
        id: e.id,
        type: e.type,
        x: start.x,
        y: start.y,
        vx: 0,
        vy: 0,
        angle: 0,
        radius: spec.radius,
        patrolPoints: e.patrolPoints,
        patrolIndex: e.patrolPoints.length > 1 ? 1 : 0,
        state: 'patrol',
        suspicion: 0,
        targetPos: null,
        stateTimer: 0,
        sonarTimer: Math.random() * 1.2,
        sonarInterval: spec.sonar,
        hearingRadius: spec.hearing,
        speedPatrol: spec.spPatrol,
        speedHunt: spec.spHunt,
        revealedAlpha: 0.15,
      };
    });

    // Place the remaining 4 Angolan squad companions at start camp & sanctuary exit
    const others = CHARACTERS.filter((c) => c.id !== this.character.id);
    const campOffsets = [
      { x: level.playerStart.x - 48, y: clamp(level.playerStart.y - 68, 45, level.worldHeight - 45), angle: 0.2 },
      { x: level.playerStart.x - 48, y: clamp(level.playerStart.y + 68, 45, level.worldHeight - 45), angle: -0.2 },
      { x: clamp(level.exitPos.x + 48, 45, level.worldWidth - 45), y: clamp(level.exitPos.y - 62, 45, level.worldHeight - 45), angle: Math.PI - 0.3 },
      { x: clamp(level.exitPos.x + 48, 45, level.worldWidth - 45), y: clamp(level.exitPos.y + 62, 45, level.worldHeight - 45), angle: Math.PI + 0.3 },
    ];
    this.companions = others.map((profile, idx) => ({
      profile,
      x: campOffsets[idx]?.x ?? level.playerStart.x - 40,
      y: campOffsets[idx]?.y ?? level.playerStart.y,
      angle: campOffsets[idx]?.angle ?? 0,
    }));

    // Initial exit sanctuary beacon pulse so player feels spatial direction
    this.spawnWave(
      level.exitPos.x,
      level.exitPos.y,
      240,
      140,
      '#22D3EE',
      'exit',
      0,
      true,
      2
    );
  }

  public setKey(code: string, down: boolean): void {
    if (down) {
      this.keys.add(code);
    } else {
      this.keys.delete(code);
    }
  }

  public clearKeys(): void {
    this.keys.clear();
    this.touchMoveVec = { x: 0, y: 0 };
  }

  public setTouchMove(dx: number, dy: number): void {
    this.touchMoveVec = { x: clamp(dx, -1, 1), y: clamp(dy, -1, 1) };
  }

  public setHoldBreath(active: boolean): void {
    if (active) {
      this.keys.add('Space');
    } else {
      this.keys.delete('Space');
    }
  }

  public setMouseScreen(sx: number, sy: number, canvasW: number, canvasH: number): void {
    this.viewWidth = canvasW;
    this.viewHeight = canvasH;
    this.mouseWorld = {
      x: sx + this.camera.x,
      y: sy + this.camera.y,
    };
  }

  public triggerThrowStone(targetWorld?: Vec2): void {
    if (this.finished || this.player.stones <= 0) return;

    const aimTarget = targetWorld ?? this.mouseWorld;
    let dx = aimTarget.x - this.player.x;
    let dy = aimTarget.y - this.player.y;
    let d = Math.hypot(dx, dy);

    if (d < 10) {
      dx = Math.cos(this.player.angle);
      dy = Math.sin(this.player.angle);
      d = 1;
    }

    const maxThrow = 290 * this.character.bonuses.throwRangeMult;
    const clampedDist = Math.min(d, maxThrow);
    const tx = clamp(this.player.x + (dx / d) * clampedDist, 32, this.level.worldWidth - 32);
    const ty = clamp(this.player.y + (dy / d) * clampedDist, 32, this.level.worldHeight - 32);

    this.player.stones -= 1;
    this.stones.push({
      id: this.nextId++,
      startX: this.player.x,
      startY: this.player.y,
      targetX: tx,
      targetY: ty,
      progress: 0,
      duration: 0.36,
    });
  }

  public triggerLeafWhisper(): void {
    if (this.finished || !this.level.hasWhisperAbility) return;
    if (this.player.whisperCooldown > 0) return;

    this.player.whisperCooldown = this.player.whisperMaxCooldown;
    const tx = clamp(
      this.player.x + Math.cos(this.player.angle) * 70,
      60,
      this.level.worldWidth - 60
    );
    const ty = clamp(
      this.player.y + Math.sin(this.player.angle) * 70,
      60,
      this.level.worldHeight - 60
    );

    this.whisperZones.push({
      id: this.nextId++,
      x: tx,
      y: ty,
      radius: 145,
      remaining: 7.5,
      maxDuration: 7.5,
      waveTimer: 0,
    });

    soundEngine.playLeafWhisper();
    this.registerStealthCombo('Sussurro na Folha', 5);
    this.spawnOnomatopoeia('「SHHH...」', tx, ty - 26, '#34D399');
  }

  public triggerSilenceChant(): void {
    if (this.finished || !this.level.hasSilenceAbility) return;
    if (this.player.silenceCooldown > 0) return;

    this.player.silenceCooldown = this.player.silenceMaxCooldown;
    this.silenceBubble = {
      x: this.player.x,
      y: this.player.y,
      radius: 150,
      remaining: 5.8,
      maxDuration: 5.8,
      followPlayer: true,
    };

    soundEngine.playSilenceChant();
    this.registerStealthCombo('Canto do Silêncio', 8);
    this.spawnOnomatopoeia('「SILÊNCIO」', this.player.x, this.player.y - 34, '#38BDF8');
  }

  private getComboMultiplier(count = this.soundComboCount): number {
    if (count >= 10) return 3.0;
    if (count >= 7) return 2.5;
    if (count >= 4) return 2.0;
    if (count >= 2) return 1.5;
    return 1.0;
  }

  private registerStealthCombo(label: string, baseHarmonyGain = 0): void {
    const prevMult = this.getComboMultiplier();
    this.soundComboCount += 1;
    this.maxSoundCombo = Math.max(this.maxSoundCombo, this.soundComboCount);
    this.soundComboTimer = this.soundComboMaxWindow;
    this.soundComboLabel = label;

    const nextMult = this.getComboMultiplier();
    if (nextMult > prevMult) {
      const milestoneText =
        nextMult >= 3.0
          ? '「SINFONIA 3.0x!」'
          : nextMult >= 2.5
            ? '「ECO 2.5x!」'
            : nextMult >= 2.0
              ? '「RITMO 2.0x!」'
              : '「COMBO 1.5x!」';
      const milestoneColor =
        nextMult >= 2.5 ? '#34D399' : nextMult >= 2.0 ? '#FBBF24' : '#22D3EE';
      this.spawnOnomatopoeia(
        milestoneText,
        this.player.x,
        this.player.y - 38,
        milestoneColor
      );
    }

    if (baseHarmonyGain > 0) {
      this.adjustHarmony(baseHarmonyGain);
    }
  }

  private breakSoundCombo(showAlert = false): void {
    if (showAlert && this.soundComboCount >= 2) {
      this.spawnOnomatopoeia('「RITMO QUEBRADO!」', this.player.x, this.player.y - 34, '#FB7185');
    }
    this.soundComboCount = 0;
    this.soundComboTimer = 0;
    this.soundComboLabel = '';
    this.breathHoldComboProgress = 0;
  }

  private adjustHarmony(delta: number): void {
    const mult = delta > 0 ? this.getComboMultiplier() : 1.0;
    this.soundHarmony = clamp(this.soundHarmony + delta * mult, 0, 100);
  }

  private spawnWave(
    x: number,
    y: number,
    maxRadius: number,
    speed: number,
    color: string,
    source: SoundWave['source'],
    loudness: number,
    masked: boolean,
    thickness = 2.4
  ): void {
    // If inside an active SilenceBubble, player/local waves are completely absorbed!
    if (
      this.silenceBubble &&
      source !== 'exit' &&
      source !== 'thunder' &&
      dist(x, y, this.silenceBubble.x, this.silenceBubble.y) <= this.silenceBubble.radius * 0.9
    ) {
      return;
    }

    const revealBonus = this.unlockedRecords.has('ecos_da_palanca') ? 1.15 : 1.0;
    const isEnvironmentalExempt = source === 'exit' || source === 'thunder' || source === 'diary';
    const attenuation = isEnvironmentalExempt ? 0 : this.weather.soundAttenuationRate;
    const attenuatedMaxRadius =
      source === 'exit'
        ? maxRadius * revealBonus
        : source === 'thunder' || source === 'diary'
          ? maxRadius
          : maxRadius * (1 - attenuation * 0.46);

    this.waves.push({
      id: this.nextId++,
      x,
      y,
      originX: x,
      originY: y,
      radius: 8,
      maxRadius: attenuatedMaxRadius,
      speed,
      alpha: Math.max(0.42, 0.92 - attenuation * 0.24),
      color,
      source,
      loudness,
      masked,
      thickness,
      attenuationFactor: attenuation,
    });

    // Ecological reaction: Loud unmasked waves near perched birds trigger panic!
    if (!masked && loudness >= 48 && source !== 'birds' && source !== 'wind') {
      for (const flock of this.birdFlocks) {
        if (flock.state === 'perched' && dist(x, y, flock.x, flock.y) <= attenuatedMaxRadius * 0.8) {
          this.scatterBirds(flock);
        }
      }
    }

    // Enemy acoustic detection
    if (
      !masked &&
      loudness > 0 &&
      (source === 'player' || source === 'stone' || source === 'birds')
    ) {
      this.alertEnemiesFromWave(x, y, attenuatedMaxRadius, loudness, source);
    }
  }

  private alertEnemiesFromWave(
    wx: number,
    wy: number,
    waveMaxRadius: number,
    loudness: number,
    source: 'player' | 'stone' | 'birds'
  ): void {
    const hearingMult =
      (this.settings.difficulty === 'implacavel' ? 1.22 : 1.0) *
      this.weather.enemyHearingFactor;
    const windCos = Math.cos(this.weather.windDirection);
    const windSin = Math.sin(this.weather.windDirection);
    const windStrength = this.weather.windIntensity;
    let stoneHitAny = false;
    for (const enemy of this.enemies) {
      const dx = enemy.x - wx;
      const dy = enemy.y - wy;
      const d = Math.hypot(dx, dy);

      // Directional wind physics: downwind (sotavento) carries sound further, upwind (barlavento) attenuates it sharply
      let windDirMult = 1.0;
      if (d > 8 && windStrength > 0.08) {
        const dot = (dx / d) * windCos + (dy / d) * windSin; // -1 upwind .. +1 downwind
        windDirMult = dot >= 0 ? 1 + dot * windStrength * 0.34 : 1 + dot * windStrength * 0.44;
      }

      const effectiveRange =
        Math.max(waveMaxRadius, enemy.hearingRadius * (loudness / 70)) *
        hearingMult *
        windDirMult;
      if (d > effectiveRange) continue;

      // Check if an active Leaf Whisper curtain is blocking the line between wave and enemy
      let blockedByWhisper = false;
      for (const wz of this.whisperZones) {
        if (dist(enemy.x, enemy.y, wz.x, wz.y) < wz.radius + 45) {
          blockedByWhisper = true;
          break;
        }
      }
      if (blockedByWhisper && source === 'player') continue;

      if (source === 'stone' || source === 'birds') {
        if (source === 'stone') stoneHitAny = true;
        // Decoys & bird cacophony strongly pull predators toward the decoy epicenter!
        enemy.targetPos = { x: wx, y: wy };
        enemy.state = source === 'birds' ? 'hunt' : 'investigate';
        enemy.suspicion = Math.max(enemy.suspicion, source === 'birds' ? 88 : 65);
        enemy.stateTimer = source === 'birds' ? 6.5 : 5.0;
        enemy.revealedAlpha = 1;
        this.spawnOnomatopoeia(
          source === 'birds' ? '「?!」' : '「?」',
          enemy.x,
          enemy.y - enemy.radius - 16,
          '#FBBF24'
        );
      } else if (source === 'player') {
        const proximityFactor = 1 - d / Math.max(1, effectiveRange);
        const gain =
          loudness *
          (0.45 + proximityFactor * 0.9) *
          this.weather.enemyHearingFactor *
          clamp(windDirMult, 0.55, 1.35);
        enemy.suspicion = clamp(enemy.suspicion + gain, 0, 100);
        enemy.targetPos = { x: wx, y: wy };
        enemy.revealedAlpha = Math.max(enemy.revealedAlpha, 0.85);

        if (enemy.suspicion >= 75) {
          if (enemy.state !== 'hunt') {
            this.timesDetected += 1;
            this.breakSoundCombo(true);
            this.adjustHarmony(-12);
            soundEngine.playEnemySonar(enemy.type, true);
            this.spawnOnomatopoeia('「CAÇADA!」', enemy.x, enemy.y - 34, '#F43F5E');

            // Wraith screams to alert allies!
            if (enemy.type === 'wraith') {
              this.spawnWave(enemy.x, enemy.y, 440, 290, '#F43F5E', 'enemy', 80, true, 3);
              for (const ally of this.enemies) {
                if (ally.id !== enemy.id && dist(enemy.x, enemy.y, ally.x, ally.y) < 420) {
                  ally.targetPos = { x: wx, y: wy };
                  ally.state = 'investigate';
                  ally.suspicion = Math.max(ally.suspicion, 70);
                  ally.stateTimer = 5.5;
                }
              }
            }
          }
          enemy.state = 'hunt';
          enemy.stateTimer = 5.0;
        } else if (enemy.suspicion >= 32 && enemy.state === 'patrol') {
          enemy.state = 'investigate';
          enemy.stateTimer = 4.2;
          this.spawnOnomatopoeia('「HUM?」', enemy.x, enemy.y - 28, '#FBBF24');
        }
      }
    }
    if (stoneHitAny) {
      this.stonesDiverted += 1;
      this.registerStealthCombo('Predador Desviado', 3.5);
    }
  }

  private scatterBirds(flock: BirdFlock): void {
    flock.state = 'scattering';
    flock.scatterTimer = 2.6;
    this.birdsScared += 1;
    this.breakSoundCombo(true);
    this.adjustHarmony(-14);
    soundEngine.playBirdFlock();
    this.spawnWave(flock.x, flock.y, 560, 260, '#EC4899', 'birds', 95, false, 3.2);
    this.spawnOnomatopoeia('「PIU-PIU-PIU!」', flock.x, flock.y - 24, '#F472B6');
  }

  private spawnOnomatopoeia(text: string, x: number, y: number, color: string): void {
    if (this.onomatopoeias.length > 14) {
      this.onomatopoeias.shift();
    }
    this.onomatopoeias.push({
      id: this.nextId++,
      text,
      x,
      y,
      color,
      rotation: (Math.random() - 0.5) * 0.28,
      scale: 0.85,
      alpha: 1,
      life: 0,
      maxLife: 1.05,
    });
  }

  public update(dt: number, canvasW: number, canvasH: number): void {
    if (this.finished) return;
    const safeDt = Math.min(dt, 0.05);
    this.viewWidth = canvasW;
    this.viewHeight = canvasH;
    this.worldTime += safeDt;
    this.elapsedSeconds += safeDt;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - safeDt * 24);
    }

    if (this.stepComboCooldown > 0) {
      this.stepComboCooldown = Math.max(0, this.stepComboCooldown - safeDt);
    }
    if (this.soundComboTimer > 0) {
      this.soundComboTimer = Math.max(0, this.soundComboTimer - safeDt);
      if (this.soundComboTimer <= 0) {
        this.soundComboCount = 0;
        this.soundComboLabel = '';
      }
    }

    // Periodic stone recharge so players never softlock
    const regenTarget = this.equippedItems.has('ghost_stones') ? 9.4 : 13.5;
    if (this.player.stones < this.player.maxStones) {
      this.stoneRegenTimer += safeDt;
      if (this.stoneRegenTimer >= regenTarget) {
        this.stoneRegenTimer = 0;
        this.player.stones += 1;
      }
    } else {
      this.stoneRegenTimer = 0;
    }

    this.updateWindZones(safeDt);
    this.updateWeather(safeDt);
    this.updateDiaryBeacons(safeDt);
    this.updateWhisperZones(safeDt);
    this.updateSilenceBubble(safeDt);
    this.updatePlayer(safeDt);
    this.updateStones(safeDt);
    this.updateBirds(safeDt);
    this.updateEnemies(safeDt);
    this.updateWavesAndParticles(safeDt);
    this.updateAmbientVolume(safeDt);
    this.updateHeartbeat(safeDt);
    this.updateCamera(safeDt);

    this.telemetryTimer += safeDt;
    if (this.telemetryTimer >= 0.08) {
      this.telemetryTimer = 0;
      this.emitTelemetry();
    }
  }

  private updateHeartbeat(dt: number): void {
    const speed = Math.hypot(this.player.vx, this.player.vy);
    const isMoving = speed > 10;

    let minEnemyDist = 9999;
    let highestAlert: Enemy['state'] = 'patrol';
    for (const e of this.enemies) {
      minEnemyDist = Math.min(minEnemyDist, dist(this.player.x, this.player.y, e.x, e.y));
      if (e.state === 'hunt') highestAlert = 'hunt';
      else if (e.state === 'investigate' && highestAlert !== 'hunt') highestAlert = 'investigate';
    }

    let targetBpm = this.player.isCrouching && !isMoving ? 64 : 68;

    // Running vs walking physical exertion
    if (isMoving) {
      if (this.player.isSprinting) {
        targetBpm += 46;
      } else if (this.player.isCrouching) {
        targetBpm += 8;
      } else {
        targetBpm += 17;
      }
    }

    // Predator proximity adrenaline spike
    if (minEnemyDist < 420) {
      const prox = clamp((420 - minEnemyDist) / 360, 0, 1);
      targetBpm += Math.pow(prox, 1.35) * 56;
    }

    // Predator alert escalation
    if (highestAlert === 'hunt') {
      targetBpm += 26;
    } else if (highestAlert === 'investigate') {
      targetBpm += 12;
    }

    // Breath holding & gasping strain
    if (this.player.isHoldingBreath) {
      targetBpm += 8 + ((100 - this.player.breath) / 100) * 16;
    }
    if (this.player.breathGasping > 0) {
      targetBpm += 24;
    }

    // Critical vitality adrenaline
    if (this.player.hp === 1) {
      targetBpm += 16;
    }

    targetBpm = clamp(targetBpm, 66, 184);
    const rate = targetBpm > this.heartRateBpm ? dt * 3.8 : dt * 1.65;
    this.heartRateBpm += (targetBpm - this.heartRateBpm) * Math.min(1, rate);

    const prevPhase = this.heartBeatPhase;
    this.heartBeatPhase = (this.heartBeatPhase + dt * (this.heartRateBpm / 60)) % 1;

    // Subtle sub-bass heartbeat pulse when under high exertion or predator danger
    const stress = clamp((this.heartRateBpm - 68) / 106, 0, 1);
    if (stress >= 0.34 && this.heartBeatPhase < prevPhase) {
      soundEngine.playHeartbeat(stress);
    }
  }

  private updateAmbientVolume(dt: number): void {
    let target = 0.08; // Night forest baseline hum

    // Wind zone proximity contribution
    for (const wz of this.windZones) {
      if (wz.isActive) {
        const d = dist(this.player.x, this.player.y, wz.x, wz.y);
        if (d < wz.radius * 1.9) {
          const factor = 1 - d / (wz.radius * 1.9);
          target += factor * wz.strength * 0.34;
        }
      }
    }

    // Leaf whisper curtains
    for (const lz of this.whisperZones) {
      const d = dist(this.player.x, this.player.y, lz.x, lz.y);
      if (d < lz.radius * 1.6) {
        target += 0.28;
      }
    }

    // Angolan meteorological events & dynamic Namibe wind impact on ambient soundscape
    target +=
      this.weather.rainIntensity * 0.3 +
      this.weather.cacimboIntensity * 0.14 +
      this.weather.windIntensity * 0.24 +
      this.weather.lightningFlash * 0.42 -
      this.weather.fogIntensity * 0.03;

    // Nearby active sound waves passing player
    for (const w of this.waves) {
      if (w.source === 'exit') continue;
      const d = Math.abs(dist(this.player.x, this.player.y, w.x, w.y) - w.radius);
      if (d < 80) {
        target += w.alpha * (w.loudness > 0 ? 0.22 : 0.12);
      }
    }

    // Player self-generated decibels
    target += (this.player.currentNoiseDb / 100) * 0.42;

    // Silence bubble suppresses ambient volume sharply
    if (this.silenceBubble) {
      target *= 0.12;
    }

    // Optional live microphone ambient level
    if (this.settings.useMicAmbient) {
      target = Math.max(target, soundEngine.getMicAmbientLevel());
    }

    const clamped = clamp(target, 0.04, 1);
    this.ambientVolume += (clamped - this.ambientVolume) * Math.min(1, dt * 8);
  }

  private updateWindZones(dt: number): void {
    for (const wz of this.windZones) {
      const cyclePos = (this.worldTime + wz.phaseOffset) % wz.cyclePeriod;
      const wasActive = wz.isActive;
      wz.isActive = cyclePos < wz.activeDuration;
      wz.strength = wz.isActive
        ? Math.sin((cyclePos / wz.activeDuration) * Math.PI)
        : 0;

      if (wz.isActive && !wasActive) {
        this.spawnWave(wz.x, wz.y, wz.radius * 1.3, 120, '#34D399', 'wind', 15, true, 1.8);
        this.spawnOnomatopoeia('「VENTO」', wz.x, wz.y - 16, '#6EE7B7');
      } else if (wz.isActive && Math.random() < dt * 1.4) {
        this.spawnWave(wz.x, wz.y, wz.radius * 1.05, 110, '#10B981', 'wind', 10, true, 1.4);
      }
    }
  }

  private updateWeather(dt: number): void {
    const allowed = this.level.allowedWeather;
    this.weather.nextTimer -= dt;

    if (this.weather.nextTimer <= 0 && allowed.length > 1) {
      const currentIndex = allowed.indexOf(this.weather.current);
      const nextWeather = allowed[(currentIndex + 1) % allowed.length];
      const profile = WEATHER_PROFILES[nextWeather];

      this.weather.current = nextWeather;
      this.weatherSeen.add(nextWeather);
      this.weather.duration = profile.duration;
      this.weather.nextTimer = profile.duration;
      this.weather.windGustTimer = 0.2;

      if (nextWeather === 'neblina_namibe') {
        this.spawnOnomatopoeia('「NEBLINA DO NAMIBE」', this.player.x, this.player.y - 46, '#94A3B8');
      } else if (nextWeather === 'tempestade_kwanza') {
        this.spawnOnomatopoeia('「TEMPESTADE DO KWANZA」', this.player.x, this.player.y - 46, '#38BDF8');
      } else if (nextWeather === 'cacimbo') {
        this.spawnOnomatopoeia('「VENTO CACIMBO」', this.player.x, this.player.y - 46, '#FCD34D');
      }
    }

    // Dynamic Namibe wind gusts, lulls & rotating coastal/desert direction
    const activeProfile = WEATHER_PROFILES[this.weather.current];
    this.weather.windGustTimer -= dt;
    if (this.weather.windGustTimer <= 0) {
      this.weather.windGustTimer =
        this.weather.current === 'neblina_namibe' ? 3.2 + Math.random() * 2.8 : 4.0 + Math.random() * 3.5;

      const gustRoll = Math.random();
      const prevTarget = this.weather.windGustTarget;
      // Alternating sudden Namibe gusts and calm lulls force real-time stealth adaptation
      if (gustRoll < 0.32) {
        this.weather.windGustTarget = activeProfile.baseWind * 0.65;
      } else if (gustRoll < 0.72) {
        this.weather.windGustTarget =
          activeProfile.baseWind + (activeProfile.gustMax - activeProfile.baseWind) * 0.52;
      } else {
        this.weather.windGustTarget = activeProfile.gustMax;
      }

      if (this.weather.windGustTarget >= 0.72 && prevTarget < 0.72) {
        soundEngine.playWindGust(this.weather.windGustTarget);
        if (this.weather.current === 'neblina_namibe') {
          this.spawnOnomatopoeia('「RAJADA DO NAMIBE!」', this.player.x, this.player.y - 44, '#67E8F9');
        }
      }
    }

    const waveOsc = Math.sin(this.worldTime * 0.95) * 0.08 + Math.cos(this.worldTime * 0.42) * 0.05;
    const desiredWind = clamp(this.weather.windGustTarget + waveOsc, 0.05, 1.0);
    const prevWind = this.weather.windIntensity;
    this.weather.windIntensity += (desiredWind - this.weather.windIntensity) * Math.min(1, dt * 1.15);

    // Smooth wind direction drift (faster shift during Namibe fog/gusts)
    const dirDriftSpeed =
      (this.weather.current === 'neblina_namibe' ? 0.22 : 0.11) *
      Math.sin(this.worldTime * 0.28 + 0.7);
    this.weather.windDirection =
      (this.weather.windDirection + dirDriftSpeed * dt + Math.PI * 2) % (Math.PI * 2);

    // Smooth atmospheric intensity transitions
    const targetRain = this.weather.current === 'tempestade_kwanza' ? 1 : 0;
    const targetFog = this.weather.current === 'neblina_namibe' ? 1 : 0;
    const targetCacimbo = this.weather.current === 'cacimbo' ? 1 : 0;

    this.weather.rainIntensity += (targetRain - this.weather.rainIntensity) * Math.min(1, dt * 1.4);
    this.weather.fogIntensity += (targetFog - this.weather.fogIntensity) * Math.min(1, dt * 1.2);
    this.weather.cacimboIntensity +=
      (targetCacimbo - this.weather.cacimboIntensity) * Math.min(1, dt * 1.4);

    // Real-time sound attenuation driven dynamically by Namibe wind intensity + fog density
    const windAtten = this.weather.windIntensity * 0.46;
    const fogAtten = this.weather.fogIntensity * 0.16;
    this.weather.soundAttenuationRate = clamp(windAtten + fogAtten, 0.04, 0.62);

    this.weather.soundPropagationFactor = clamp(
      activeProfile.propFactor * (1 - this.weather.windIntensity * 0.26),
      0.45,
      1.0
    );
    this.weather.enemyHearingFactor = clamp(
      activeProfile.hearingFactor * (1 - this.weather.windIntensity * 0.24),
      0.45,
      1.0
    );

    if (prevWind < 0.72 && this.weather.windIntensity >= 0.72) {
      soundEngine.playWindGust(this.weather.windIntensity);
    }

    if (this.weather.lightningFlash > 0) {
      this.weather.lightningFlash = Math.max(0, this.weather.lightningFlash - dt * 2.5);
    }

    if (this.weather.current === 'tempestade_kwanza') {
      this.weather.nextThunderTimer -= dt;
      if (this.weather.nextThunderTimer <= 0) {
        this.weather.nextThunderTimer = 4.2 + Math.random() * 4.0;
        this.weather.lightningFlash = 0.85;
        this.screenShake = 6;
        soundEngine.playThunder();

        const tx = this.player.x + (Math.random() - 0.5) * 400;
        const ty = this.player.y + (Math.random() - 0.5) * 300;
        this.spawnWave(tx, ty, 640, 380, '#FACC15', 'thunder', 95, true, 3.5);
        this.spawnOnomatopoeia('「TROVÃO!」', this.player.x + 20, this.player.y - 60, '#FDE047');

        for (const obs of this.obstacles) {
          obs.discoveredAlpha = Math.max(obs.discoveredAlpha, 0.72);
        }
        for (const enemy of this.enemies) {
          enemy.revealedAlpha = Math.max(enemy.revealedAlpha, 0.78);
        }
      }
    }
  }

  private updateWhisperZones(dt: number): void {
    for (let i = this.whisperZones.length - 1; i >= 0; i--) {
      const wz = this.whisperZones[i];
      wz.remaining -= dt;
      wz.waveTimer -= dt;
      if (wz.waveTimer <= 0) {
        wz.waveTimer = 0.75;
        this.spawnWave(wz.x, wz.y, wz.radius, 150, '#34D399', 'leaf', 25, true, 2.0);
      }
      if (wz.remaining <= 0) {
        this.whisperZones.splice(i, 1);
      }
    }
  }

  private updateSilenceBubble(dt: number): void {
    if (!this.silenceBubble) return;
    this.silenceBubble.remaining -= dt;
    if (this.silenceBubble.followPlayer) {
      this.silenceBubble.x = this.player.x;
      this.silenceBubble.y = this.player.y;
    }
    if (this.silenceBubble.remaining <= 0) {
      this.silenceBubble = null;
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    if (p.invulnerableTimer > 0) p.invulnerableTimer = Math.max(0, p.invulnerableTimer - dt);
    if (p.whisperCooldown > 0) p.whisperCooldown = Math.max(0, p.whisperCooldown - dt);
    if (p.silenceCooldown > 0) p.silenceCooldown = Math.max(0, p.silenceCooldown - dt);
    if (p.breathGasping > 0) p.breathGasping = Math.max(0, p.breathGasping - dt);

    // Movement input
    let ix = this.touchMoveVec.x;
    let iy = this.touchMoveVec.y;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iy += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;

    const len = Math.hypot(ix, iy);
    if (len > 1) {
      ix /= len;
      iy /= len;
    }

    p.isSprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    p.isCrouching = this.keys.has('KeyC') || this.keys.has('ControlLeft');

    const crouchBonus =
      p.isCrouching && this.unlockedRecords.has('campeao_da_tundavala') ? 1.08 : 1.0;
    const baseSpeed = p.isSprinting ? 215 : p.isCrouching ? 88 * crouchBonus : 138;
    const speed = baseSpeed * this.character.bonuses.speedMult;
    p.vx = ix * speed;
    p.vy = iy * speed;

    // Kimbamba (Palanca Negra) passive acoustic horn echo pulse revealing nearby ruins
    if (this.character.id === 'kimbamba') {
      this.palancaPulseTimer -= dt;
      if (this.palancaPulseTimer <= 0) {
        this.palancaPulseTimer = 4.6;
        const palancaReach = this.unlockedRecords.has('ecos_da_palanca') ? 265 : 230;
        this.spawnWave(p.x, p.y, palancaReach, 195, '#38BDF8', 'exit', 0, true, 1.8);
      }
    }

    if (Math.hypot(p.vx, p.vy) > 5) {
      p.angle = Math.atan2(p.vy, p.vx);
    }

    p.x = clamp(p.x + p.vx * dt, p.radius + 14, this.level.worldWidth - p.radius - 14);
    p.y = clamp(p.y + p.vy * dt, p.radius + 14, this.level.worldHeight - p.radius - 14);

    // Obstacle collision resolution
    for (const obs of this.obstacles) {
      const col = circleRectCollide(p.x, p.y, p.radius, obs.x, obs.y, obs.w, obs.h);
      if (col.hit) {
        p.x += col.nx * col.overlap;
        p.y += col.ny * col.overlap;
      }
    }

    // Scarf trail physics (One Piece cape/scarf motion!)
    const head = { x: p.x - Math.cos(p.angle) * 6, y: p.y - Math.sin(p.angle) * 6 };
    p.scarfTrail[0] = head;
    for (let i = 1; i < p.scarfTrail.length; i++) {
      const prev = p.scarfTrail[i - 1];
      const curr = p.scarfTrail[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const d = Math.hypot(dx, dy) || 1;
      const segLen = 5.5;
      curr.x = prev.x + (dx / d) * segLen;
      curr.y = prev.y + (dy / d) * segLen + Math.sin(this.worldTime * 8 + i) * 0.45;
    }

    // Camouflage detection
    let camSource: string | null = null;
    if (this.silenceBubble && dist(p.x, p.y, this.silenceBubble.x, this.silenceBubble.y) <= this.silenceBubble.radius) {
      camSource = 'Bolha de Silêncio';
    } else {
      for (const wz of this.whisperZones) {
        if (dist(p.x, p.y, wz.x, wz.y) <= wz.radius) {
          camSource = 'Cortina de Folhas';
          break;
        }
      }
      if (!camSource) {
        for (const wz of this.windZones) {
          if (wz.isActive && dist(p.x, p.y, wz.x, wz.y) <= wz.radius) {
            camSource = 'Brisa nos Imbondeiros';
            break;
          }
        }
      }
      if (!camSource && this.weather.current === 'tempestade_kwanza' && !p.isSprinting) {
        camSource = 'Tempestade do Kwanza';
      }
      if (!camSource && this.weather.windIntensity >= 0.72 && !p.isSprinting) {
        camSource =
          this.weather.current === 'neblina_namibe' ? 'Rajada do Namibe' : 'Vento Forte';
      }
    }

    p.isCamouflaged = camSource !== null;
    p.camouflageSource = camSource;

    // Breath holding mechanic
    const wantsHold = this.keys.has('Space') && p.breathGasping <= 0;
    p.isHoldingBreath = wantsHold && p.breath > 0;

    const drainRate = this.equippedItems.has('crystal_lung') ? 15.6 : 24;
    if (p.isHoldingBreath) {
      p.breath = Math.max(0, p.breath - dt * drainRate);
      if (p.breath <= 0) {
        p.isHoldingBreath = false;
        p.breathGasping = 2.0;
        this.breakSoundCombo(true);
        this.adjustHarmony(-9);
        soundEngine.playBreathGasp();
        this.spawnWave(p.x, p.y, 240, 220, '#F43F5E', 'player', 68, false, 2.5);
        this.spawnOnomatopoeia('「ARF!」', p.x, p.y - 26, '#FB7185');
      }
    } else {
      const regenMult = this.unlockedRecords.has('sinfonia_do_maiombe') ? 1.15 : 1.0;
      p.breath = Math.min(100, p.breath + dt * 18 * regenMult);
    }

    // Breathing particle cloud (especially when near enemies or running)
    const moving = Math.hypot(p.vx, p.vy) > 10;
    let nearestEnemy = 9999;
    let nearestEnemyObj: Enemy | null = null;
    for (const e of this.enemies) {
      const d = dist(p.x, p.y, e.x, e.y);
      if (d < nearestEnemy) {
        nearestEnemy = d;
        nearestEnemyObj = e;
      }
    }
    if (!moving && nearestEnemy <= 255 && nearestEnemyObj) {
      this.stationaryNearEnemyTimer = Math.min(8, this.stationaryNearEnemyTimer + dt);
      if (this.stationaryNearEnemyTimer >= 3.0) {
        this.activeCamouflageHint = this.buildCamouflageHint(nearestEnemyObj, nearestEnemy);
      }
    } else if (moving || nearestEnemy > 280) {
      this.stationaryNearEnemyTimer = Math.max(0, this.stationaryNearEnemyTimer - dt * 2.4);
      if (this.stationaryNearEnemyTimer <= 0.6) {
        this.activeCamouflageHint = null;
      }
    }
    if (p.isHoldingBreath && nearestEnemy < 250) {
      this.adjustHarmony(dt * 4.5);
      this.breathHoldComboProgress += dt;
      if (this.breathHoldComboProgress >= 1.65) {
        this.breathHoldComboProgress = 0;
        this.registerStealthCombo('Fôlego Contido', 2.2);
      }
    } else {
      this.breathHoldComboProgress = Math.max(0, this.breathHoldComboProgress - dt);
    }
    const anxious = nearestEnemy < 185 || p.isSprinting;

    p.breathParticleTimer -= dt;
    if (!p.isHoldingBreath && p.breathParticleTimer <= 0) {
      p.breathParticleTimer = anxious ? 0.24 : 0.65;
      const count = anxious ? 2 : 1;
      for (let i = 0; i < count; i++) {
        this.breathParticles.push({
          x: p.x + Math.cos(p.angle) * 8 + (Math.random() - 0.5) * 6,
          y: p.y + Math.sin(p.angle) * 8 + (Math.random() - 0.5) * 6,
          vx: Math.cos(p.angle) * 14 + (Math.random() - 0.5) * 10,
          vy: -10 + (Math.random() - 0.5) * 10,
          radius: anxious ? 5.5 : 3.5,
          alpha: anxious ? 0.72 : 0.4,
          life: 0,
          maxLife: anxious ? 0.95 : 0.65,
          color: anxious ? '#FBBF24' : '#67E8F9',
        });
      }

      // Panting near an enemy emits a faint acoustic pulse if NOT holding breath & NOT camouflaged
      if (anxious && nearestEnemy < 135 && !p.isCamouflaged) {
        this.spawnWave(
          p.x,
          p.y,
          115 * this.weather.soundPropagationFactor,
          130,
          '#FBBF24',
          'player',
          26,
          false,
          1.5
        );
      }
    }

    // Footsteps sound waves modulated by weather acoustic propagation
    let instantDb = p.isHoldingBreath ? 0 : anxious ? 18 : 6;
    if (moving) {
      p.stepTimer -= dt;
      const stepInterval = p.isSprinting ? 0.23 : p.isCrouching ? 0.52 : 0.36;
      if (p.stepTimer <= 0) {
        p.stepTimer = stepInterval;
        const silkMult = !p.isSprinting && this.equippedItems.has('silk_cloak') ? 0.75 : 1.0;
        const charNoise = this.character.bonuses.noiseMult;
        const recordNoise =
          (this.unlockedRecords.has('silencio_absoluto') ? 0.92 : 1.0) *
          (this.weather.current !== 'calma' && this.unlockedRecords.has('senhor_das_tempestades')
            ? 0.88
            : 1.0);
        const weatherProp = this.weather.soundPropagationFactor;
        const intensity = p.isSprinting ? 1.0 : p.isCrouching ? 0.25 : 0.58;
        const maxRad =
          (p.isSprinting ? 295 : p.isCrouching ? 92 : 172) *
          silkMult *
          charNoise *
          recordNoise *
          weatherProp;
        const loudness =
          (p.isSprinting ? 82 : p.isCrouching ? 24 : 52) *
          silkMult *
          charNoise *
          recordNoise *
          weatherProp;
        const masked = p.isCamouflaged && !p.isSprinting;
        if (masked) {
          this.maskedSteps += 1;
        }
        const waveColor = masked
          ? '#34D399'
          : p.isSprinting
            ? '#F59E0B'
            : this.equippedItems.has('golden_tuning')
              ? '#FACC15'
              : '#22D3EE';

        soundEngine.playFootstep(intensity);
        this.spawnWave(
          p.x,
          p.y,
          masked ? maxRad * 0.65 : maxRad,
          (p.isSprinting ? 270 : 185) * (this.weather.current === 'cacimbo' ? 1.15 : 1.0),
          waveColor,
          'player',
          loudness,
          masked,
          p.isSprinting ? 2.8 : 2.0
        );

        if (p.isSprinting && !masked) {
          this.breakSoundCombo(true);
          this.adjustHarmony(-2.8);
          this.spawnOnomatopoeia('「PASSO!」', p.x, p.y - 22, '#FBBF24');
        } else if (masked) {
          if (this.stepComboCooldown <= 0) {
            this.stepComboCooldown = 0.9;
            this.registerStealthCombo('Passo Camuflado', 2.4);
          } else {
            this.adjustHarmony(1.4);
          }
        } else if (p.isCrouching) {
          if (this.stepComboCooldown <= 0) {
            this.stepComboCooldown = 1.15;
            this.registerStealthCombo('Passo Furtivo', 1.6);
          } else {
            this.adjustHarmony(1.0);
          }
        }

        // Direct proximity bird scare if sprinting close
        if (p.isSprinting && !masked) {
          for (const flock of this.birdFlocks) {
            if (flock.state === 'perched' && dist(p.x, p.y, flock.x, flock.y) <= flock.radius + 35) {
              this.scatterBirds(flock);
            }
          }
        }
      }
      instantDb = p.isSprinting ? 84 : p.isCrouching ? 24 : p.isCamouflaged ? 14 : 54;
    } else {
      p.stepTimer = 0.08;
    }

    p.currentNoiseDb += (instantDb - p.currentNoiseDb) * Math.min(1, dt * 10);

    // Crystal collection (+1 stone recovery in combat!)
    for (const c of this.crystals) {
      if (!c.collected && dist(p.x, p.y, c.x, c.y) <= p.radius + 20) {
        c.collected = true;
        p.stones = Math.min(p.maxStones, p.stones + 1);
        this.registerStealthCombo('Cristal Ressonante', 6);
        soundEngine.playCrystalPickup();
        this.spawnWave(c.x, c.y, 175, 190, '#A7F3D0', 'exit', 0, true, 2.2);
        this.spawnOnomatopoeia('「RESSONÂNCIA!」', c.x, c.y - 24, '#34D399');
      }
    }

    // Collectible Sound Diaries (play environmental voice narration on pickup)
    for (const d of this.diaries) {
      if (!d.collected && dist(p.x, p.y, d.x, d.y) <= p.radius + 22) {
        d.collected = true;
        this.registerStealthCombo('Diário Recuperado', 5);
        soundEngine.playDiaryNarrationAudio(d);
        this.spawnWave(d.x, d.y, 210, 170, d.accentColor, 'diary', 0, true, 2.4);
        this.spawnOnomatopoeia('「DIÁRIO SONORO」', d.x, d.y - 26, d.accentColor);
        this.callbacks.onDiaryCollected?.(d);
      }
    }

    // Exit sanctuary reached
    if (dist(p.x, p.y, this.level.exitPos.x, this.level.exitPos.y) <= this.level.exitRadius) {
      this.finished = true;
      soundEngine.playVictory();
      const collected = this.crystals.filter((c) => c.collected).length;
      const timeSec = Math.round(this.elapsedSeconds);
      const harmony = Math.round(this.soundHarmony);
      const earnedRecords = evaluateEarnedSoundRecords({
        levelId: this.level.id,
        characterId: this.character.id,
        timeSec,
        crystals: collected,
        detections: this.timesDetected,
        harmony,
        stonesDiverted: this.stonesDiverted,
        birdsScared: this.birdsScared,
        maskedSteps: this.maskedSteps,
        weatherSeen: Array.from(this.weatherSeen),
      });
      this.emitTelemetry();
      this.callbacks.onVictory({
        timeSec,
        crystals: collected,
        detections: this.timesDetected,
        harmony,
        earnedRecords,
      });
    }
  }

  private updateDiaryBeacons(dt: number): void {
    for (const d of this.diaries) {
      if (d.collected) continue;
      d.beaconTimer -= dt;
      if (d.beaconTimer <= 0) {
        d.beaconTimer = 3.2;
        if (dist(this.player.x, this.player.y, d.x, d.y) < 520) {
          this.spawnWave(d.x, d.y, 140, 115, d.accentColor, 'diary', 0, true, 1.6);
        }
      }
    }
  }

  private updateStones(dt: number): void {
    for (let i = this.stones.length - 1; i >= 0; i--) {
      const s = this.stones[i];
      s.progress += dt / s.duration;
      if (s.progress >= 1) {
        soundEngine.playStoneImpact();
        this.spawnWave(s.targetX, s.targetY, 370, 290, '#F59E0B', 'stone', 85, false, 3.0);
        this.spawnOnomatopoeia('「CLAC!」', s.targetX, s.targetY - 18, '#FBBF24');
        this.stones.splice(i, 1);
      }
    }
  }

  private updateBirds(dt: number): void {
    for (const flock of this.birdFlocks) {
      if (flock.state === 'scattering') {
        flock.scatterTimer -= dt;
        if (flock.scatterTimer <= 0) {
          flock.state = 'gone';
        }
      }
    }
  }

  private updateEnemies(dt: number): void {
    const p = this.player;

    for (const enemy of this.enemies) {
      if (enemy.revealedAlpha > 0.14) {
        enemy.revealedAlpha = Math.max(0.14, enemy.revealedAlpha - dt * 0.25);
      }

      // Enemy echolocation ping
      enemy.sonarTimer -= dt;
      if (enemy.sonarTimer <= 0) {
        enemy.sonarTimer = enemy.state === 'hunt' ? enemy.sonarInterval * 0.65 : enemy.sonarInterval;
        const col =
          enemy.state === 'hunt'
            ? '#F43F5E'
            : enemy.type === 'wraith'
              ? '#A855F7'
              : enemy.type === 'goliath'
                ? '#FB923C'
                : '#E11D48';

        this.spawnWave(
          enemy.x,
          enemy.y,
          enemy.type === 'goliath' ? 260 : 210,
          175,
          col,
          'enemy',
          0,
          true,
          enemy.type === 'goliath' ? 3.2 : 2.0
        );

        if (dist(enemy.x, enemy.y, p.x, p.y) < 480) {
          soundEngine.playEnemySonar(enemy.type, enemy.state === 'hunt');
        }
      }

      // State decay
      if (enemy.state !== 'patrol') {
        enemy.stateTimer -= dt;
        if (enemy.stateTimer <= 0) {
          enemy.state = 'patrol';
          enemy.targetPos = null;
        }
      }
      if (enemy.state === 'patrol' && enemy.suspicion > 0) {
        enemy.suspicion = Math.max(0, enemy.suspicion - dt * 14);
      }

      // Movement target
      let dest: Vec2 = enemy.patrolPoints[enemy.patrolIndex] ?? { x: enemy.x, y: enemy.y };
      const diffSpeedMult = this.settings.difficulty === 'implacavel' ? 1.15 : 1.0;
      let moveSpeed = enemy.speedPatrol * diffSpeedMult;

      if ((enemy.state === 'hunt' || enemy.state === 'investigate') && enemy.targetPos) {
        dest = enemy.targetPos;
        moveSpeed =
          (enemy.state === 'hunt' ? enemy.speedHunt : enemy.speedPatrol * 1.25) * diffSpeedMult;
      }

      const dx = dest.x - enemy.x;
      const dy = dest.y - enemy.y;
      const d = Math.hypot(dx, dy);

      if (d > 8) {
        enemy.vx = (dx / d) * moveSpeed;
        enemy.vy = (dy / d) * moveSpeed;
        enemy.angle = Math.atan2(enemy.vy, enemy.vx);
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
      } else {
        enemy.vx = 0;
        enemy.vy = 0;
        if (enemy.state === 'patrol' && enemy.patrolPoints.length > 1) {
          enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolPoints.length;
        } else if (enemy.state === 'investigate' || enemy.state === 'hunt') {
          enemy.stateTimer = Math.min(enemy.stateTimer, 1.2);
        }
      }

      enemy.x = clamp(enemy.x, enemy.radius + 14, this.level.worldWidth - enemy.radius - 14);
      enemy.y = clamp(enemy.y, enemy.radius + 14, this.level.worldHeight - enemy.radius - 14);

      for (const obs of this.obstacles) {
        const col = circleRectCollide(enemy.x, enemy.y, enemy.radius, obs.x, obs.y, obs.w, obs.h);
        if (col.hit) {
          enemy.x += col.nx * col.overlap;
          enemy.y += col.ny * col.overlap;
        }
      }

      // Physical contact damage
      if (
        p.invulnerableTimer <= 0 &&
        dist(enemy.x, enemy.y, p.x, p.y) <= enemy.radius + p.radius - 2
      ) {
        p.hp -= 1;
        p.invulnerableTimer = 1.8;
        this.screenShake = 10;
        this.breakSoundCombo(true);
        soundEngine.playHurt();
        this.spawnOnomatopoeia('「IMPACTO!」', p.x, p.y - 28, '#F43F5E');

        // Knockback away from predator
        const kdx = p.x - enemy.x;
        const kdy = p.y - enemy.y;
        const kd = Math.hypot(kdx, kdy) || 1;
        p.x = clamp(p.x + (kdx / kd) * 44, p.radius + 14, this.level.worldWidth - p.radius - 14);
        p.y = clamp(p.y + (kdy / kd) * 44, p.radius + 14, this.level.worldHeight - p.radius - 14);

        if (p.hp <= 0) {
          this.finished = true;
          this.emitTelemetry();
          this.callbacks.onGameOver();
          return;
        }
      }
    }
  }

  private updateWavesAndParticles(dt: number): void {
    const windDx = Math.cos(this.weather.windDirection) * this.weather.windIntensity * 42 * dt;
    const windDy = Math.sin(this.weather.windDirection) * this.weather.windIntensity * 42 * dt;

    // Expand sound waves, apply Namibe wind drift + attenuation & illuminate touched obstacles/enemies
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.radius += w.speed * dt;
      if (w.source !== 'exit' && w.source !== 'thunder') {
        w.x += windDx;
        w.y += windDy;
      }
      const ratio = clamp(w.radius / Math.max(1, w.maxRadius), 0, 1);
      const decayCurve = Math.pow(1 - ratio, 1 + w.attenuationFactor * 1.4);
      w.alpha = Math.max(0, decayCurve * (0.92 - w.attenuationFactor * 0.24));

      // Acoustic Sight illumination! Attenuated waves reveal obstacles and enemies more dimly
      const visScale = 1 - w.attenuationFactor * 0.42;
      for (const obs of this.obstacles) {
        const cx = obs.x + obs.w / 2;
        const cy = obs.y + obs.h / 2;
        const d = dist(w.x, w.y, cx, cy);
        if (Math.abs(d - w.radius) < 55 + Math.max(obs.w, obs.h) * 0.45) {
          obs.discoveredAlpha = Math.max(obs.discoveredAlpha, (0.25 + w.alpha * 0.72) * visScale);
        }
      }

      for (const enemy of this.enemies) {
        const d = dist(w.x, w.y, enemy.x, enemy.y);
        if (Math.abs(d - w.radius) < 42) {
          enemy.revealedAlpha = Math.max(enemy.revealedAlpha, (0.35 + w.alpha * 0.65) * visScale);
        }
      }

      if (w.radius >= w.maxRadius) {
        this.waves.splice(i, 1);
      }
    }

    // Fade obstacle illumination softly to dark memory outline
    for (const obs of this.obstacles) {
      if (obs.discoveredAlpha > 0.14) {
        obs.discoveredAlpha = Math.max(0.14, obs.discoveredAlpha - dt * 0.16);
      }
    }

    // Breath particles (subtly swept by Namibe wind)
    for (let i = this.breathParticles.length - 1; i >= 0; i--) {
      const bp = this.breathParticles[i];
      bp.life += dt;
      bp.x += bp.vx * dt + windDx * 0.9;
      bp.y += bp.vy * dt + windDy * 0.9;
      bp.radius += dt * 4.5;
      bp.alpha = Math.max(0, 1 - bp.life / bp.maxLife) * (0.65 - this.weather.windIntensity * 0.2);
      if (bp.life >= bp.maxLife) {
        this.breathParticles.splice(i, 1);
      }
    }

    // JoJo Onomatopoeias
    for (let i = this.onomatopoeias.length - 1; i >= 0; i--) {
      const ono = this.onomatopoeias[i];
      ono.life += dt;
      ono.y -= dt * 16;
      const t = ono.life / ono.maxLife;
      ono.scale = t < 0.2 ? 0.8 + t * 1.8 : 1.15 - (t - 0.2) * 0.25;
      ono.alpha = t > 0.6 ? Math.max(0, 1 - (t - 0.6) / 0.4) : 1;
      if (ono.life >= ono.maxLife) {
        this.onomatopoeias.splice(i, 1);
      }
    }
  }

  private updateCamera(dt: number): void {
    const targetX = clamp(
      this.player.x - this.viewWidth / 2,
      0,
      Math.max(0, this.level.worldWidth - this.viewWidth)
    );
    const targetY = clamp(
      this.player.y - this.viewHeight / 2,
      0,
      Math.max(0, this.level.worldHeight - this.viewHeight)
    );
    this.camera.x += (targetX - this.camera.x) * Math.min(1, dt * 7);
    this.camera.y += (targetY - this.camera.y) * Math.min(1, dt * 7);
  }

  private emitTelemetry(): void {
    let highest: Enemy['state'] = 'patrol';
    let minEnemyDist = 9999;
    for (const e of this.enemies) {
      minEnemyDist = Math.min(minEnemyDist, dist(this.player.x, this.player.y, e.x, e.y));
      if (e.state === 'hunt') highest = 'hunt';
      else if (e.state === 'investigate' && highest !== 'hunt') highest = 'investigate';
    }

    const windInfo = formatWindDirection(this.weather.windDirection);
    this.callbacks.onTelemetry({
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      breath: Math.round(this.player.breath),
      isHoldingBreath: this.player.isHoldingBreath,
      breathGasping: this.player.breathGasping > 0,
      isCamouflaged: this.player.isCamouflaged,
      camouflageSource: this.player.camouflageSource,
      currentNoiseDb: Math.round(this.player.currentNoiseDb),
      ambientVolume: Math.round(this.ambientVolume * 100),
      stones: this.player.stones,
      maxStones: this.player.maxStones,
      whisperReady: this.player.whisperCooldown <= 0,
      whisperCooldown: Number(this.player.whisperCooldown.toFixed(1)),
      hasWhisperAbility: this.level.hasWhisperAbility,
      silenceReady: this.player.silenceCooldown <= 0,
      silenceCooldown: Number(this.player.silenceCooldown.toFixed(1)),
      hasSilenceAbility: this.level.hasSilenceAbility,
      silenceActiveRemaining: this.silenceBubble ? Number(this.silenceBubble.remaining.toFixed(1)) : 0,
      crystalsCollected: this.crystals.filter((c) => c.collected).length,
      crystalsTotal: this.crystals.length,
      diariesCollectedInLevel: this.diaries.filter((d) => d.collected).length,
      diariesTotalInLevel: this.diaries.length,
      stormActive: this.weather.current === 'tempestade_kwanza',
      weatherEvent: this.weather.current,
      weatherLabel: WEATHER_PROFILES[this.weather.current].label,
      weatherRemaining: Math.max(0, Math.ceil(this.weather.nextTimer)),
      soundPropagationPct: Math.round(this.weather.soundPropagationFactor * 100),
      windIntensityPct: Math.round(this.weather.windIntensity * 100),
      windSpeedKmh: Math.round(4 + this.weather.windIntensity * 60),
      windDirectionDeg: windInfo.deg,
      windDirectionLabel: windInfo.label,
      windGustLabel: getWindGustLabel(this.weather.windIntensity, this.weather.current),
      soundAttenuationPct: Math.round(this.weather.soundAttenuationRate * 100),
      elapsedSeconds: Math.floor(this.elapsedSeconds),
      timesDetected: this.timesDetected,
      highestAlert: highest,
      nearbyEnemyDist: Math.round(minEnemyDist),
      heartRateBpm: Math.round(this.heartRateBpm),
      soundHarmony: Math.round(this.soundHarmony),
      soundComboCount: this.soundComboCount,
      soundComboMultiplier: this.getComboMultiplier(),
      soundComboTimerPct: Math.round((this.soundComboTimer / this.soundComboMaxWindow) * 100),
      soundComboLabel: this.soundComboLabel,
      maxSoundCombo: this.maxSoundCombo,
      camouflageHint: this.activeCamouflageHint,
    });
  }

  private buildCamouflageHint(enemy: Enemy, enemyDist: number): CamouflageQuickHint {
    const p = this.player;
    const enemyName =
      enemy.type === 'wraith'
        ? 'Sereia Ressonante'
        : enemy.type === 'goliath'
          ? 'Colosso Tambor'
          : 'Rastreador Cego';

    if (p.isCamouflaged && p.camouflageSource) {
      return {
        id: 'camo_active',
        environmentLabel: p.camouflageSource,
        title: 'Camuflagem Sonora Ativa',
        suggestion: `Você está protegido por ${p.camouflageSource}. Aproveite agora e mova-se agachado [C] para cruzar o ${enemyName}.`,
        actionTag: '[C] Agachar',
        accentColor: '#34D399',
      };
    }

    if (this.level.hasSilenceAbility && p.silenceCooldown <= 0) {
      return {
        id: 'use_silence',
        environmentLabel: 'Habilidade Acústica',
        title: 'Bolha de Silêncio Pronta',
        suggestion: `${enemyName} está a ${Math.round(enemyDist)} px. Ative [R] Canto do Silêncio para anular passos e respiração ao escapar.`,
        actionTag: '[R] Silêncio',
        accentColor: '#22D3EE',
      };
    }

    if (this.level.hasWhisperAbility && p.whisperCooldown <= 0) {
      return {
        id: 'use_whisper',
        environmentLabel: 'Cortina de Folhas',
        title: 'Camuflagem Portátil Disponível',
        suggestion: `Use [E] Sussurro na Folha agora para gerar uma cortina sonora sibilante e mascarar sua saída perto do ${enemyName}.`,
        actionTag: '[E] Sussurro',
        accentColor: '#34D399',
      };
    }

    if (this.weather.current === 'tempestade_kwanza') {
      return {
        id: 'storm_kwanza',
        environmentLabel: 'Tempestade do Kwanza',
        title: 'Chuva Mascara Passos',
        suggestion: `A tempestade reduz a audição do ${enemyName} em 38%. Caminhe sem correr (sem Shift) para manter Camuflagem Sonora contínua.`,
        actionTag: 'Sem Shift',
        accentColor: '#38BDF8',
      };
    }

    if (this.weather.windIntensity >= 0.44 || this.weather.current === 'neblina_namibe') {
      const windInfo = formatWindDirection(this.weather.windDirection);
      const speedKmh = Math.round(4 + this.weather.windIntensity * 60);
      const attenPct = Math.round(this.weather.soundAttenuationRate * 100);
      const wx = Math.cos(this.weather.windDirection);
      const wy = Math.sin(this.weather.windDirection);
      const dot = ((enemy.x - p.x) * wx + (enemy.y - p.y) * wy) / Math.max(1, enemyDist);
      const upwindNote =
        dot < -0.2
          ? ' Você está a barlavento da criatura!'
          : ' Desloque-se contra o vento!';
      return {
        id: 'wind_namibe',
        environmentLabel: `${WEATHER_PROFILES[this.weather.current].label} · ${speedKmh} km/h ${windInfo.label}`,
        title: 'Use a Atenuação do Vento',
        suggestion: `Vento reduz ecos em ${attenPct}% e os desvia para ${windInfo.label}.${upwindNote} Avance agachado [C].`,
        actionTag: '[C] Barlavento',
        accentColor: '#FBBF24',
      };
    }

    let closestWz: WindZone | null = null;
    let closestWzDist = 9999;
    for (const wz of this.windZones) {
      const d = Math.max(0, dist(p.x, p.y, wz.x, wz.y) - wz.radius);
      if (d < closestWzDist) {
        closestWzDist = d;
        closestWz = wz;
      }
    }
    if (closestWz && closestWzDist <= 260) {
      return {
        id: 'imbondeiro_zone',
        environmentLabel: closestWz.isActive ? 'Brisa dos Imbondeiros Ativa' : 'Imbondeiros Próximos',
        title: closestWz.isActive ? 'Entre no Anel Verde de Brisa' : 'Aguarde o Pulso dos Imbondeiros',
        suggestion: closestWz.isActive
          ? `Entre no anel verde próximo para camuflar seus passos enquanto o ${enemyName} patrulha.`
          : `A brisa nos imbondeiros próximos acenderá em breve — entre no anel verde ou avance agachado [C] assim que ela soprar.`,
        actionTag: 'Brisa Verde',
        accentColor: '#34D399',
      };
    }

    const flockNear = this.birdFlocks.some(
      (b) => b.state === 'perched' && dist(p.x, p.y, b.x, b.y) <= b.radius + 120
    );
    if (p.stones > 0) {
      return {
        id: 'stone_divert',
        environmentLabel: 'Noite Calma · Distração',
        title: 'Crie um Eco Distante',
        suggestion: `Em clima calmo, lance um Seixo de Isca [Q] para o lado oposto${
          flockNear ? ' (longe dos tecelões)' : ''
        } e atraia o ${enemyName} para longe.`,
        actionTag: '[Q] ou Clique',
        accentColor: '#FBBF24',
      };
    }

    return {
      id: 'breath_crouch',
      environmentLabel: 'Noite Calma',
      title: 'Contenha Fôlego e Agache',
      suggestion: `Segure [Espaço] se o ${enemyName} chegar perto para evitar ofegar e escape agachado [C] assim que ele virar.`,
      actionTag: '[Espaço] + [C]',
      accentColor: '#22D3EE',
    };
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();

    // Abyssal dark obsidian canvas
    ctx.fillStyle = '#06080E';
    ctx.fillRect(0, 0, width, height);

    // Subtle lightning flash in Tempestade do Kwanza
    if (this.weather.lightningFlash > 0) {
      ctx.fillStyle = `rgba(224, 242, 254, ${this.weather.lightningFlash * 0.22})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Apply camera + screen shake
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake : 0;
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake : 0;
    ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    // Subtle acoustic radar grid lines (SAO tactical backdrop)
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.045)';
    ctx.lineWidth = 1;
    const gridSize = 80;
    for (let gx = 0; gx <= this.level.worldWidth; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, this.level.worldHeight);
      ctx.stroke();
    }
    for (let gy = 0; gy <= this.level.worldHeight; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(this.level.worldWidth, gy);
      ctx.stroke();
    }

    // World boundary ink frame
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, this.level.worldWidth - 16, this.level.worldHeight - 16);

    // Render Wind Camouflage Zones
    for (const wz of this.windZones) {
      ctx.save();
      const activeAlpha = wz.isActive ? 0.16 + wz.strength * 0.14 : 0.06;
      ctx.fillStyle = wz.isActive
        ? `rgba(16, 185, 129, ${activeAlpha})`
        : 'rgba(100, 116, 139, 0.05)';
      ctx.beginPath();
      ctx.arc(wz.x, wz.y, wz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = wz.isActive ? 'rgba(52, 211, 153, 0.68)' : 'rgba(148, 163, 184, 0.18)';
      ctx.lineWidth = wz.isActive ? 2.2 : 1.2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(wz.x, wz.y, wz.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Stylized swaying tree silhouette in center of wind zone
      const sway = wz.isActive ? Math.sin(this.worldTime * 7 + wz.phaseOffset) * 7 : 0;
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 3;
      ctx.fillStyle = wz.isActive ? '#059669' : '#1E293B';
      ctx.beginPath();
      ctx.arc(wz.x + sway, wz.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Render Leaf Whisper Curtains
    for (const wz of this.whisperZones) {
      const fade = clamp(wz.remaining / 1.2, 0, 1);
      ctx.save();
      ctx.fillStyle = `rgba(52, 211, 153, ${0.18 * fade})`;
      ctx.beginPath();
      ctx.arc(wz.x, wz.y, wz.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(110, 231, 183, ${0.8 * fade})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(wz.x, wz.y, wz.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Exit Sanctuary Portal
    const ex = this.level.exitPos.x;
    const ey = this.level.exitPos.y;
    const pulse = Math.sin(this.worldTime * 3.5) * 6;
    ctx.save();
    const grad = ctx.createRadialGradient(ex, ey, 6, ex, ey, this.level.exitRadius + 16);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.72)');
    grad.addColorStop(0.65, 'rgba(16, 185, 129, 0.25)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ex, ey, this.level.exitRadius + 16, 0, Math.PI * 2);
    ctx.fill();

    // SAO + Chokwe Sona geometric sanctuary gate
    ctx.strokeStyle = '#67E8F9';
    ctx.lineWidth = 2.5;
    ctx.translate(ex, ey);
    ctx.rotate(this.worldTime * 0.7);
    const rGate = 22 + pulse * 0.3;
    ctx.strokeRect(-rGate, -rGate, rGate * 2, rGate * 2);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = '#FBBF24';
    ctx.strokeRect(-rGate * 0.72, -rGate * 0.72, rGate * 1.44, rGate * 1.44);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, rGate * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Render Resonance Crystals (Tuning forks)
    for (const c of this.crystals) {
      if (c.collected) continue;
      const hover = Math.sin(this.worldTime * 3 + c.pulsePhase) * 4;
      ctx.save();
      ctx.translate(c.x, c.y + hover);
      ctx.fillStyle = '#34D399';
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Render Collectible Sound Diaries (Cassette / Kissange Acoustic Logs)
    for (const d of this.diaries) {
      if (d.collected) continue;
      const hover = Math.sin(this.worldTime * 2.6 + d.pulsePhase) * 3.5;
      const glowPulse = 0.35 + 0.25 * Math.sin(this.worldTime * 3.2 + d.pulsePhase);
      ctx.save();
      ctx.translate(d.x, d.y + hover);

      // Subtle harmonic halo
      const dGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, 26);
      dGrad.addColorStop(0, `rgba(251, 191, 36, ${glowPulse.toFixed(2)})`);
      dGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();

      // Stylized tape reel / acoustic medallion
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = d.accentColor;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(-12, -9, 24, 18, 4);
      ctx.fill();
      ctx.stroke();

      // Two inner spinning tape spools
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(-5, 0, 3.2, 0, Math.PI * 2);
      ctx.arc(5, 0, 3.2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // Render Bird Flocks
    for (const flock of this.birdFlocks) {
      if (flock.state === 'gone') continue;
      ctx.save();
      const scatterProgress = flock.state === 'scattering' ? (2.6 - flock.scatterTimer) / 2.6 : 0;
      for (const b of flock.birds) {
        const d = b.offsetDist + scatterProgress * 220;
        const bx = flock.x + Math.cos(b.offsetAngle + scatterProgress * 1.4) * d;
        const by = flock.y + Math.sin(b.offsetAngle) * d - scatterProgress * 160;
        const flap = Math.sin(this.worldTime * 18 + b.wingPhase) * 3;
        ctx.strokeStyle = flock.state === 'scattering' ? '#F472B6' : '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - 6, by + flap);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + 6, by + flap);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render Obstacles illuminated by Acoustic Sight (with manga hatching feel)
    for (const obs of this.obstacles) {
      const playerClose =
        dist(this.player.x, this.player.y, obs.x + obs.w / 2, obs.y + obs.h / 2) < 130
          ? 0.45
          : 0;
      const vis = Math.max(obs.discoveredAlpha, playerClose);
      ctx.save();
      ctx.fillStyle = `rgba(15, 23, 42, ${0.4 + vis * 0.55})`;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // Manga ink diagonal hatching inside revealed ruins
      if (vis > 0.25) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${vis * 0.22})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let hx = obs.x; hx < obs.x + obs.w + obs.h; hx += 18) {
          ctx.moveTo(Math.min(hx, obs.x + obs.w), Math.max(obs.y, obs.y + (hx - obs.x - obs.w)));
          ctx.lineTo(Math.max(obs.x, hx - obs.h), Math.min(obs.y + obs.h, obs.y + (hx - obs.x)));
        }
        ctx.stroke();
      }

      ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 + vis * 0.72})`;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      ctx.restore();
    }

    // Render Sound Waves (The core Acoustic Sight visualization with Namibe wind attenuation!)
    for (const w of this.waves) {
      ctx.save();
      ctx.globalAlpha = w.alpha;
      ctx.strokeStyle = w.color;
      ctx.lineWidth = w.thickness;
      if (w.masked) {
        ctx.setLineDash([10, 8]);
      } else if (w.attenuationFactor > 0.24) {
        // High Namibe wind breaks sound rings into attenuated turbulent arcs
        const gap = Math.round(4 + w.attenuationFactor * 18);
        const dash = Math.max(6, Math.round(22 - w.attenuationFactor * 20));
        ctx.setLineDash([dash, gap]);
      }
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary inner echo harmonic ring for JoJo/SAO flair (suppressed under heavy attenuation)
      if (w.radius > 28 && !w.masked && w.attenuationFactor < 0.48) {
        ctx.globalAlpha = w.alpha * 0.35 * (1 - w.attenuationFactor);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius - 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render Thrown Stones in flight
    for (const s of this.stones) {
      const t = clamp(s.progress, 0, 1);
      const sx = s.startX + (s.targetX - s.startX) * t;
      const sy = s.startY + (s.targetY - s.startY) * t - Math.sin(t * Math.PI) * 42;
      ctx.save();
      ctx.fillStyle = '#FBBF24';
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Render Breath Particles
    for (const bp of this.breathParticles) {
      ctx.save();
      ctx.globalAlpha = bp.alpha;
      ctx.fillStyle = bp.color;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Blind Acoustic Creatures (Stalker, Wraith, Goliath)
    for (const enemy of this.enemies) {
      const closeAura = dist(this.player.x, this.player.y, enemy.x, enemy.y) < 120 ? 0.6 : 0;
      const alpha = clamp(Math.max(enemy.revealedAlpha, closeAura), 0.14, 1);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(enemy.x, enemy.y);

      // SAO Target Bracket when revealed or alert
      if (alpha > 0.35 || enemy.state !== 'patrol') {
        const bracketColor =
          enemy.state === 'hunt'
            ? '#F43F5E'
            : enemy.state === 'investigate'
              ? '#FBBF24'
              : '#A855F7';
        ctx.strokeStyle = bracketColor;
        ctx.lineWidth = 1.8;
        const br = enemy.radius + 10;
        const corner = 7;
        // 4 corners
        ctx.beginPath();
        ctx.moveTo(-br, -br + corner);
        ctx.lineTo(-br, -br);
        ctx.lineTo(-br + corner, -br);
        ctx.moveTo(br - corner, -br);
        ctx.lineTo(br, -br);
        ctx.lineTo(br, -br + corner);
        ctx.moveTo(br, br - corner);
        ctx.lineTo(br, br);
        ctx.lineTo(br - corner, br);
        ctx.moveTo(-br + corner, br);
        ctx.lineTo(-br, br);
        ctx.lineTo(-br, br - corner);
        ctx.stroke();
      }

      ctx.rotate(enemy.angle);
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 2.6;

      if (enemy.type === 'goliath') {
        // Armored acoustic drum beast
        ctx.fillStyle = enemy.state === 'hunt' ? '#DC2626' : '#EA580C';
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Horned acoustic plates
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.moveTo(10, -enemy.radius + 2);
        ctx.lineTo(26, -12);
        ctx.lineTo(14, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, enemy.radius - 2);
        ctx.lineTo(26, 12);
        ctx.lineTo(14, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (enemy.type === 'wraith') {
        // Resonant Wraith with floating tuning wings
        ctx.fillStyle = enemy.state === 'hunt' ? '#F43F5E' : '#9333EA';
        ctx.beginPath();
        ctx.moveTo(enemy.radius + 4, 0);
        ctx.lineTo(-enemy.radius, -enemy.radius * 0.85);
        ctx.lineTo(-enemy.radius * 0.45, 0);
        ctx.lineTo(-enemy.radius, enemy.radius * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Stalker blind hound with flared acoustic ear-horns
        ctx.fillStyle = enemy.state === 'hunt' ? '#F43F5E' : '#BE123C';
        ctx.beginPath();
        ctx.moveTo(enemy.radius + 3, 0);
        ctx.lineTo(-enemy.radius * 0.7, -enemy.radius * 0.9);
        ctx.lineTo(-enemy.radius * 0.9, 0);
        ctx.lineTo(-enemy.radius * 0.7, enemy.radius * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Blind cross-scar over eyes + glowing ear membranes
        ctx.fillStyle = '#FDA4AF';
        ctx.beginPath();
        ctx.arc(-4, -8, 4, 0, Math.PI * 2);
        ctx.arc(-4, 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Alert state text icon above enemy (non-hue-only affordance)
      if (enemy.state !== 'patrol') {
        ctx.save();
        ctx.font = '800 16px "Barlow Condensed", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = enemy.state === 'hunt' ? '#FB7185' : '#FDE047';
        ctx.strokeStyle = '#020408';
        ctx.lineWidth = 3;
        const label = enemy.state === 'hunt' ? '!' : '?';
        ctx.strokeText(label, enemy.x, enemy.y - enemy.radius - 12);
        ctx.fillText(label, enemy.x, enemy.y - enemy.radius - 12);
        ctx.restore();
      }
    }

    // Render Silence Bubble
    if (this.silenceBubble) {
      const sb = this.silenceBubble;
      const fade = clamp(sb.remaining / 1.0, 0, 1);
      ctx.save();
      ctx.fillStyle = `rgba(14, 165, 233, ${0.12 * fade})`;
      ctx.beginPath();
      ctx.arc(sb.x, sb.y, sb.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(125, 211, 252, ${0.9 * fade})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(sb.x, sb.y, sb.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Allied Angolan Companions (the other 4 members of the squad!)
    for (const comp of this.companions) {
      const distPlayer = dist(this.player.x, this.player.y, comp.x, comp.y);
      const vis = distPlayer < 360 ? clamp(1 - distPlayer / 420, 0.25, 0.92) : 0.22;
      ctx.save();
      ctx.globalAlpha = vis;
      this.drawCharacterSprite(
        ctx,
        comp.profile,
        comp.x,
        comp.y,
        comp.angle,
        comp.profile.id === 'kimbamba' ? 16 : 14,
        false,
        false
      );
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 3;
      ctx.strokeText(comp.profile.name, comp.x, comp.y - 24);
      ctx.fillText(comp.profile.name, comp.x, comp.y - 24);
      ctx.restore();
    }

    // Render Player (Active Angolan Ecophonist / Palanca Negra)
    const p = this.player;
    ctx.save();
    // Personal close tactile ring
    ctx.strokeStyle = p.isCamouflaged
      ? 'rgba(52, 211, 153, 0.55)'
      : 'rgba(34, 211, 238, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.isCrouching ? 24 : 32, 0, Math.PI * 2);
    ctx.stroke();

    // Flowing scarf ribbon (Samakaka / Golden Tuning)
    if (p.scarfTrail.length > 1) {
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(p.scarfTrail[0].x, p.scarfTrail[0].y);
      for (let i = 1; i < p.scarfTrail.length; i++) {
        ctx.lineTo(p.scarfTrail[i].x, p.scarfTrail[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = p.isHoldingBreath
        ? '#38BDF8'
        : this.equippedItems.has('golden_tuning')
          ? '#FACC15'
          : this.character.scarfColor;
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    if (p.invulnerableTimer > 0 && Math.floor(this.worldTime * 14) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }
    this.drawCharacterSprite(
      ctx,
      this.character,
      p.x,
      p.y,
      p.angle,
      p.isCrouching ? p.radius * 0.85 : p.radius,
      p.isHoldingBreath,
      this.equippedItems.has('golden_tuning')
    );
    ctx.restore();

    // Render JoJo-style Onomatopoeia SFX
    for (const ono of this.onomatopoeias) {
      ctx.save();
      ctx.translate(ono.x, ono.y);
      ctx.rotate(ono.rotation);
      ctx.scale(ono.scale, ono.scale);
      ctx.globalAlpha = ono.alpha;
      ctx.font = 'italic 800 20px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 4.5;
      ctx.strokeText(ono.text, 0, 0);
      ctx.fillStyle = ono.color;
      ctx.fillText(ono.text, 0, 0);
      ctx.restore();
    }

    ctx.restore(); // End world-space transform

    // Screen-space Tempestade do Kwanza Rain Overlay
    if (this.weather.rainIntensity > 0.12) {
      ctx.save();
      ctx.strokeStyle = `rgba(148, 197, 255, ${this.weather.rainIntensity * 0.26})`;
      ctx.lineWidth = 1.25;
      const dropCount = Math.floor(55 * this.weather.rainIntensity);
      ctx.beginPath();
      for (let i = 0; i < dropCount; i++) {
        const rx = ((i * 173 + this.worldTime * 440) % (width + 120)) - 60;
        const ry = ((i * 97 + this.worldTime * 800) % (height + 80)) - 40;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 14, ry + 26);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Screen-space Neblina do Namibe Coastal Mist Overlay
    if (this.weather.fogIntensity > 0.1) {
      ctx.save();
      const fogAlpha = this.weather.fogIntensity;
      const mistGrad = ctx.createLinearGradient(0, 0, width, height);
      mistGrad.addColorStop(0, `rgba(148, 163, 184, ${fogAlpha * 0.14})`);
      mistGrad.addColorStop(0.5, `rgba(100, 116, 139, ${fogAlpha * 0.08})`);
      mistGrad.addColorStop(1, `rgba(203, 213, 225, ${fogAlpha * 0.16})`);
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, 0, width, height);

      // Drifting mist ribbons
      for (let i = 0; i < 4; i++) {
        const mx = ((this.worldTime * (18 + i * 7) + i * 260) % (width + 320)) - 160;
        const my = (height * (0.2 + i * 0.22)) + Math.sin(this.worldTime * 0.6 + i) * 18;
        const blob = ctx.createRadialGradient(mx, my, 10, mx, my, 180);
        blob.addColorStop(0, `rgba(226, 232, 240, ${fogAlpha * 0.14})`);
        blob.addColorStop(1, 'rgba(226, 232, 240, 0)');
        ctx.fillStyle = blob;
        ctx.beginPath();
        ctx.arc(mx, my, 180, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Screen-space Dynamic Namibe Wind Shear & Coastal Dust Streaks
    if (this.weather.windIntensity > 0.16 && !this.settings.reducedEffects) {
      ctx.save();
      const wi = this.weather.windIntensity;
      const cosW = Math.cos(this.weather.windDirection);
      const sinW = Math.sin(this.weather.windDirection);
      const streakLen = 28 + wi * 78;
      const speedPx = 140 + wi * 480;
      const streakCount = Math.floor(8 + wi * 26);

      ctx.strokeStyle =
        this.weather.current === 'neblina_namibe'
          ? `rgba(203, 213, 225, ${(0.06 + wi * 0.18).toFixed(2)})`
          : `rgba(103, 232, 249, ${(0.04 + wi * 0.13).toFixed(2)})`;
      ctx.lineWidth = 1 + wi * 0.9;
      ctx.beginPath();
      for (let i = 0; i < streakCount; i++) {
        const seedX = (i * 193) % (width + 200);
        const seedY = (i * 127) % (height + 200);
        const rawX = seedX + cosW * this.worldTime * speedPx;
        const rawY = seedY + sinW * this.worldTime * speedPx;
        const sx = ((rawX % (width + 160)) + (width + 160)) % (width + 160) - 80;
        const sy = ((rawY % (height + 160)) + (height + 160)) % (height + 160) - 80;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + cosW * streakLen, sy + sinW * streakLen);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Screen-space Vento Cacimbo Dry Streaks Overlay
    if (this.weather.cacimboIntensity > 0.12) {
      ctx.save();
      ctx.strokeStyle = `rgba(253, 224, 71, ${this.weather.cacimboIntensity * 0.12})`;
      ctx.lineWidth = 1;
      const streakCount = Math.floor(18 * this.weather.cacimboIntensity);
      ctx.beginPath();
      for (let i = 0; i < streakCount; i++) {
        const sx = ((i * 211 + this.worldTime * 320) % (width + 180)) - 90;
        const sy = ((i * 131 + Math.sin(this.worldTime + i) * 20) % height);
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 48, sy - 4);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Vignette darkness edge (enhances claustrophobic acoustic tension)
    const vig = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.28,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72
    );
    vig.addColorStop(0, 'rgba(6, 8, 14, 0)');
    vig.addColorStop(1, 'rgba(4, 6, 11, 0.72)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  private drawCharacterSprite(
    ctx: CanvasRenderingContext2D,
    profile: CharacterProfile,
    x: number,
    y: number,
    angle: number,
    radius: number,
    holdingBreath: boolean,
    goldenTuning: boolean
  ): void {
    const primaryColor = holdingBreath
      ? '#38BDF8'
      : goldenTuning
        ? '#FBBF24'
        : profile.accentColor;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (profile.id === 'kimbamba') {
      // Palanca Negra Gigante: Sleek jet-black body, white facial markings, sweeping ringed sable horns
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(-2, 0, radius * 1.15, radius * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Head & snout pointing forward
      ctx.beginPath();
      ctx.ellipse(radius * 0.72, 0, radius * 0.56, radius * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Distinctive Palanca Negra white facial streak
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.ellipse(radius * 0.86, 0, radius * 0.25, radius * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sweeping curved ringed horns (iconic Giant Sable Antelope silhouette)
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 5.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(radius * 0.5, -radius * 0.22);
      ctx.quadraticCurveTo(-radius * 0.4, -radius * 1.15, -radius * 1.45, -radius * 0.72);
      ctx.moveTo(radius * 0.5, radius * 0.22);
      ctx.quadraticCurveTo(-radius * 0.4, radius * 1.15, -radius * 1.45, radius * 0.72);
      ctx.stroke();

      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(radius * 0.5, -radius * 0.22);
      ctx.quadraticCurveTo(-radius * 0.4, -radius * 1.15, -radius * 1.45, -radius * 0.72);
      ctx.moveTo(radius * 0.5, radius * 0.22);
      ctx.quadraticCurveTo(-radius * 0.4, radius * 1.15, -radius * 1.45, radius * 0.72);
      ctx.stroke();

      // Resonant eye glow
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(radius * 0.78, -radius * 0.2, 2.2, 0, Math.PI * 2);
      ctx.arc(radius * 0.78, radius * 0.2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (profile.id === 'tchissola') {
      // Tchissola (Homem Angolano): Tactical field vest + shoulder resonators
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.roundRect(-radius * 0.75, -radius * 0.95, radius * 1.3, radius * 1.9, 6);
      ctx.fill();
      ctx.stroke();

      // Tactical amber accent harness
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.3, -radius * 0.8);
      ctx.lineTo(radius * 0.25, 0);
      ctx.lineTo(-radius * 0.3, radius * 0.8);
      ctx.stroke();

      // Head & acoustic ear-cuff
      ctx.fillStyle = '#7C3F23';
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(radius * 0.12, 0, radius * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing field visor
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(radius * 0.16, 0, radius * 0.55, -0.8, 0.8);
      ctx.stroke();

      // Tuning fork pointer
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(radius * 0.68, 0);
      ctx.lineTo(radius + 9, 0);
      ctx.stroke();
    } else {
      // Nzinga, Kandimba, Lueji (Mulheres Angolanas): Stylised cloak, braided silhouette & tuning fork
      ctx.fillStyle = primaryColor;
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Braided locks flowing back
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-radius * 0.35, -radius * 0.45);
      ctx.lineTo(-radius * 1.25, -radius * 0.65);
      ctx.moveTo(-radius * 0.35, 0);
      ctx.lineTo(-radius * 1.38, 0);
      ctx.moveTo(-radius * 0.35, radius * 0.45);
      ctx.lineTo(-radius * 1.25, radius * 0.65);
      ctx.stroke();

      // Warm skin inner crown + acoustic headband
      ctx.fillStyle = '#8D4F31';
      ctx.strokeStyle = '#020408';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(radius * 0.16, 0, radius * 0.56, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing visor / resonant headband arc
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(radius * 0.18, 0, radius * 0.52, -0.75, 0.75);
      ctx.stroke();

      // Tuning fork / kissange pointer
      ctx.strokeStyle = goldenTuning ? '#FDE047' : '#F8FAFC';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(radius * 0.72, 0);
      ctx.lineTo(radius + 10, 0);
      ctx.stroke();
    }

    ctx.restore();
  }
}
