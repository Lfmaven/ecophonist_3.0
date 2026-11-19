import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Wind,
  Sparkles,
  CircleDot,
  Heart,
  LogOut,
  ChevronRight,
  EarOff,
  Sliders,
  CloudFog,
  CloudRain,
  Moon,
  Navigation,
  BookOpen,
  X,
  Camera,
  Ear,
  Shield,
  Sword,
  Zap,
  Package,
  AlertTriangle,
  Cross,
  Skull,
  Gamepad2,
} from 'lucide-react';
import { getCharacterById } from '../game/characters';
import { EcophonistEngine } from '../game/engine';
import { getSoundRecordById } from '../game/records';
import { soundEngine } from '../game/soundEngine';
import { getHarmonyEnding } from '../game/storage';
import { AcousticCaptureSnapshot, AcousticPhotoModal } from './AcousticPhotoModal';
import {
  CharacterId,
  GameSettings,
  GameState,
  HUDTelemetry,
  LevelConfig,
  SoundDiaryDef,
  SoundDiaryId,
  SoundRecordId,
  StoreItemId,
} from '../game/types';

interface VisualSonarRipple {
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  lineWidth: number;
  color: string;
  offsetX: number;
  offsetY: number;
  attenuation: number;
}

interface GameCanvasViewProps {
  level: LevelConfig;
  characterId: CharacterId;
  hasNextLevel: boolean;
  settings: GameSettings;
  equippedItems: StoreItemId[];
  unlockedRecords: SoundRecordId[];
  onOpenSettings: (tab?: 'settings' | 'store') => void;
  onToggleMute: () => void;
  onExitToMenu: () => void;
  onCollectDiary: (diaryId: SoundDiaryId) => void;
  onCompleteLevel: (stats: {
    timeSec: number;
    crystals: number;
    detections: number;
    harmony: number;
    earnedRecords: SoundRecordId[];
  }) => void;
  onGoNextLevel: () => void;
  isExternalModalOpen?: boolean;
}

const INITIAL_HUD: HUDTelemetry = {
  hp: 3,
  maxHp: 3,
  armorShield: 0,
  maxArmorShield: 3,
  medkits: 1,
  breath: 100,
  swordEnergy: 65,
  isHoldingBreath: false,
  breathGasping: false,
  isCamouflaged: false,
  camouflageSource: null,
  currentNoiseDb: 0,
  ambientVolume: 14,
  stones: 5,
  maxStones: 5,
  whisperReady: true,
  whisperCooldown: 0,
  hasWhisperAbility: false,
  silenceReady: true,
  silenceCooldown: 0,
  hasSilenceAbility: false,
  silenceActiveRemaining: 0,
  sonicLeapReady: true,
  sonicLeapCooldown: 0,
  vorpalSlashReady: true,
  vorpalSlashCooldown: 0,
  crystalsCollected: 0,
  crystalsTotal: 3,
  cratesOpened: 0,
  cratesTotal: 4,
  diariesCollectedInLevel: 0,
  diariesTotalInLevel: 2,
  stormActive: false,
  weatherEvent: 'calma',
  weatherLabel: 'Calma Noturna',
  weatherRemaining: 12,
  soundPropagationPct: 100,
  windIntensityPct: 12,
  windSpeedKmh: 11,
  windDirectionDeg: 148,
  windDirectionLabel: 'SO',
  windGustLabel: 'Calmaria',
  soundAttenuationPct: 6,
  elapsedSeconds: 0,
  timesDetected: 0,
  highestAlert: 'patrol',
  nearbyEnemyDist: 999,
  heartRateBpm: 70,
  soundHarmony: 65,
  soundComboCount: 0,
  soundComboMultiplier: 1.0,
  soundComboTimerPct: 0,
  soundComboLabel: '',
  maxSoundCombo: 0,
  camouflageHint: null,
  safeZoneActive: true,
  safeZonePhase: 'estavel',
  safeZoneTimeRemaining: 24,
  safeZoneStage: 1,
  safeZoneTotalStages: 3,
  safeZoneLockedFinal: false,
  playerOutsideSafeZone: false,
  safeZoneDistMeters: 0,
  playerOutsideTargetZone: false,
  safeZoneTargetDistMeters: 0,
  boss: null,
  recentLootToast: null,
  radar: {
    worldWidth: 2800,
    worldHeight: 1100,
    playerX: 115,
    playerY: 550,
    exitX: 2660,
    exitY: 550,
    safeX: 1400,
    safeY: 550,
    safeRadius: 1620,
    targetSafeX: 1950,
    targetSafeY: 550,
    targetSafeRadius: 1180,
    crates: [],
    boss: null,
    enemies: [],
  },
};

/**
 * Draws the real-time Visual Sonar concentric ripple effect centered on the player's
 * position using the HTML5 Canvas 2D API, driven by live ambient volume levels.
 */
function updateAndDrawVisualSonar(
  ctx: CanvasRenderingContext2D,
  ripples: VisualSonarRipple[],
  spawnTimerRef: { current: number },
  originX: number,
  originY: number,
  ambientVolume: number,
  settings: GameSettings,
  goldenTuning: boolean,
  wind: { intensity: number; direction: number; attenuationRate: number },
  dt: number,
  paused: boolean
): void {
  const sensMult =
    settings.sonarSensitivity === 'alta'
      ? 1.35
      : settings.sonarSensitivity === 'baixa'
        ? 0.68
        : 1.0;

  const effectiveVol = Math.min(1, ambientVolume * sensMult);
  const atten = wind.attenuationRate;
  const windCos = Math.cos(wind.direction);
  const windSin = Math.sin(wind.direction);

  if (!paused) {
    // Spawn concentric ripples faster and wider when ambient volume increases
    const spawnInterval = settings.reducedEffects
      ? Math.max(0.45, 1.05 - effectiveVol * 0.6)
      : Math.max(0.18, 0.72 - effectiveVol * 0.52);

    spawnTimerRef.current += dt;
    if (spawnTimerRef.current >= spawnInterval && ripples.length < (settings.reducedEffects ? 5 : 14)) {
      spawnTimerRef.current = 0;
      const baseColor = goldenTuning
        ? effectiveVol > 0.55
          ? '#FBBF24'
          : '#38BDF8'
        : effectiveVol > 0.6
          ? '#F59E0B'
          : effectiveVol > 0.32
            ? '#22D3EE'
            : '#34D399';

      // Dynamic Namibe wind intensity compresses and attenuates sonar reach in real time
      const rangeCompression = 1 - atten * 0.48;
      ripples.push({
        radius: 18,
        maxRadius: Math.max(54, (90 + effectiveVol * 240) * rangeCompression),
        speed: 95 + effectiveVol * 165,
        alpha: Math.max(0.16, (0.25 + effectiveVol * 0.55) * (1 - atten * 0.35)),
        lineWidth: 1.2 + effectiveVol * 1.8,
        color: baseColor,
        offsetX: 0,
        offsetY: 0,
        attenuation: atten,
      });
    }

    const driftPx = wind.intensity * 46 * dt;
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += r.speed * dt;
      r.offsetX += windCos * driftPx;
      r.offsetY += windSin * driftPx;
      if (r.radius >= r.maxRadius) {
        ripples.splice(i, 1);
      }
    }
  }

  ctx.save();
  // Ambient glow halo anchored to player (compressed slightly when wind attenuation peaks)
  const haloRadius = (46 + effectiveVol * 110) * (1 - atten * 0.28);
  const haloGrad = ctx.createRadialGradient(originX, originY, 8, originX, originY, haloRadius);
  haloGrad.addColorStop(
    0,
    goldenTuning
      ? `rgba(251, 191, 36, ${0.06 + effectiveVol * 0.12})`
      : `rgba(34, 211, 238, ${0.05 + effectiveVol * 0.11})`
  );
  haloGrad.addColorStop(1, 'rgba(7, 9, 15, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(originX, originY, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  // Concentric sonar ripples with real-time wind drift & attenuation curve
  for (const r of ripples) {
    const progress = r.radius / r.maxRadius;
    const decay = Math.pow(Math.max(0, 1 - progress), 1 + r.attenuation * 1.35);
    const fadeAlpha = Math.max(0, decay * r.alpha);
    const rx = originX + r.offsetX;
    const ry = originY + r.offsetY;

    ctx.globalAlpha = fadeAlpha;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth;
    if (r.attenuation > 0.26) {
      const dashLen = Math.max(6, Math.round(18 - r.attenuation * 16));
      const gapLen = Math.round(4 + r.attenuation * 14);
      ctx.setLineDash([dashLen, gapLen]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.arc(rx, ry, r.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner harmonic dashed ring for high-volume ambient peaks (fades out under strong wind attenuation)
    if (!settings.reducedEffects && r.radius > 38 && effectiveVol > 0.28 && r.attenuation < 0.48) {
      ctx.globalAlpha = fadeAlpha * 0.45 * (1 - r.attenuation);
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(rx, ry, r.radius - 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.setLineDash([]);

  // Subtle compass tick marks + live Namibe wind vector arrow on outer sonar horizon
  if (!settings.reducedEffects) {
    const horizonR = 44 + effectiveVol * 36;
    ctx.globalAlpha = 0.22 + effectiveVol * 0.28;
    ctx.strokeStyle = goldenTuning ? '#FDE047' : '#67E8F9';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(originX + Math.cos(a) * (horizonR - 4), originY + Math.sin(a) * (horizonR - 4));
      ctx.lineTo(originX + Math.cos(a) * (horizonR + 4), originY + Math.sin(a) * (horizonR + 4));
      ctx.stroke();
    }

    if (wind.intensity > 0.14) {
      const arrowBase = horizonR + 6;
      const arrowTip = arrowBase + 7 + wind.intensity * 10;
      const tipX = originX + windCos * arrowTip;
      const tipY = originY + windSin * arrowTip;
      const baseX = originX + windCos * arrowBase;
      const baseY = originY + windSin * arrowBase;

      ctx.globalAlpha = 0.38 + wind.intensity * 0.52;
      ctx.strokeStyle = wind.intensity >= 0.72 ? '#FCD34D' : '#94A3B8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(
        tipX - Math.cos(wind.direction - 0.55) * 6,
        tipY - Math.sin(wind.direction - 0.55) * 6
      );
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(
        tipX - Math.cos(wind.direction + 0.55) * 6,
        tipY - Math.sin(wind.direction + 0.55) * 6
      );
      ctx.stroke();
    }
  }

  ctx.restore();
}

function sampleEcgWaveform(phase: number, stress: number): number {
  const pWave = 0.14 * Math.exp(-Math.pow((phase - 0.02) / 0.018, 2));
  const qDip = -0.22 * Math.exp(-Math.pow((phase - 0.055) / 0.011, 2));
  const rSpike = (0.85 + stress * 0.25) * Math.exp(-Math.pow((phase - 0.08) / 0.014, 2));
  const sDip = -0.34 * Math.exp(-Math.pow((phase - 0.105) / 0.013, 2));
  const dubBump = (0.34 + stress * 0.12) * Math.exp(-Math.pow((phase - 0.25) / 0.026, 2));
  return pWave + qDip + rSpike + sDip + dubBump;
}

function updateAndDrawHeartbeatMonitor(
  ecgCanvas: HTMLCanvasElement | null,
  cardEl: HTMLDivElement | null,
  iconEl: HTMLDivElement | null,
  samples: number[],
  hb: { bpm: number; phase: number; pulse: number; stress: number },
  nowMs: number,
  reducedEffects: boolean,
  isPlaying: boolean
): void {
  if (isPlaying) {
    const val = sampleEcgWaveform(hb.phase, hb.stress);
    samples.push(val);
    if (samples.length > 74) {
      samples.shift();
    }
  }

  const strokeColor =
    hb.stress >= 0.68 ? '#F43F5E' : hb.stress >= 0.35 ? '#FBBF24' : '#22D3EE';

  if (cardEl) {
    if (!isPlaying) {
      cardEl.style.transform = 'translate3d(0px, 0px, 0px) scale(1)';
    } else {
      const vibAmp = reducedEffects
        ? hb.pulse * 1.1
        : hb.pulse * (1.5 + hb.stress * 4.2) + Math.pow(hb.stress, 1.5) * 2.2;
      const jitterX =
        Math.sin(nowMs * (0.045 + hb.stress * 0.05)) * vibAmp;
      const jitterY =
        Math.cos(nowMs * (0.058 + hb.stress * 0.06)) * vibAmp * 0.85;
      const scale = 1 + hb.pulse * (reducedEffects ? 0.02 : 0.028 + hb.stress * 0.058);

      cardEl.style.transform = `translate3d(${jitterX.toFixed(2)}px, ${jitterY.toFixed(2)}px, 0px) scale(${scale.toFixed(4)})`;
      cardEl.style.borderColor =
        hb.stress >= 0.68
          ? `rgba(244, 63, 94, ${(0.38 + hb.pulse * 0.52).toFixed(2)})`
          : hb.stress >= 0.35
            ? `rgba(251, 191, 36, ${(0.3 + hb.pulse * 0.45).toFixed(2)})`
            : `rgba(34, 211, 238, ${(0.24 + hb.pulse * 0.38).toFixed(2)})`;
      cardEl.style.boxShadow =
        hb.stress >= 0.35
          ? `0 0 ${Math.round(12 + hb.pulse * 18)}px ${
              hb.stress >= 0.68 ? 'rgba(244, 63, 94, 0.25)' : 'rgba(251, 191, 36, 0.18)'
            }`
          : 'none';
    }
  }

  if (iconEl) {
    const iconScale = isPlaying ? 1 + hb.pulse * (0.2 + hb.stress * 0.32) : 1;
    iconEl.style.transform = `scale(${iconScale.toFixed(3)})`;
  }

  if (!ecgCanvas) return;
  const ctx = ecgCanvas.getContext('2d');
  if (!ctx) return;

  const w = ecgCanvas.width;
  const h = ecgCanvas.height;
  ctx.clearRect(0, 0, w, h);

  // Subtle ECG baseline guide
  const baselineY = h * 0.64;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, baselineY);
  ctx.lineTo(w, baselineY);
  ctx.stroke();

  if (samples.length < 2) return;

  ctx.save();
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, 'rgba(148, 163, 184, 0.12)');
  grad.addColorStop(0.55, strokeColor);
  grad.addColorStop(1, '#F8FAFC');
  ctx.strokeStyle = grad;

  ctx.beginPath();
  const stepX = w / Math.max(1, 73);
  const startIdx = Math.max(0, 74 - samples.length);
  for (let i = 0; i < samples.length; i++) {
    const x = (startIdx + i) * stepX;
    const y = baselineY - samples[i] * (h * 0.5);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Leading pulse spark dot
  const lastY = baselineY - samples[samples.length - 1] * (h * 0.5);
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.arc(w - 2, lastY, 2.2 + hb.pulse * 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const GameCanvasView: React.FC<GameCanvasViewProps> = ({
  level,
  characterId,
  hasNextLevel,
  settings,
  equippedItems,
  unlockedRecords,
  onOpenSettings,
  onToggleMute,
  onExitToMenu,
  onCollectDiary,
  onCompleteLevel,
  onGoNextLevel,
  isExternalModalOpen = false,
}) => {
  const activeCharacter = getCharacterById(characterId);
  const [avatarError, setAvatarError] = useState(false);
  const [activeDiary, setActiveDiary] = useState<SoundDiaryDef | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<EcophonistEngine | null>(null);
  const sonarRipplesRef = useRef<VisualSonarRipple[]>([]);
  const sonarSpawnTimerRef = useRef<number>(0);

  // Real-time corner Heartbeat Monitor refs (60fps synchronized vibration & ECG)
  const heartbeatCardRef = useRef<HTMLDivElement | null>(null);
  const heartbeatIconRef = useRef<HTMLDivElement | null>(null);
  const heartbeatCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heartbeatSamplesRef = useRef<number[]>([]);

  const settingsRef = useRef(settings);
  const equippedRef = useRef(equippedItems);
  const unlockedRecordsRef = useRef(unlockedRecords);
  const onCollectDiaryRef = useRef(onCollectDiary);

  useEffect(() => {
    settingsRef.current = settings;
    equippedRef.current = equippedItems;
    unlockedRecordsRef.current = unlockedRecords;
    onCollectDiaryRef.current = onCollectDiary;
    engineRef.current?.updateConfig(settings, equippedItems);
  }, [settings, equippedItems, unlockedRecords, onCollectDiary]);

  useEffect(() => {
    if (!activeDiary) return;
    const timer = window.setTimeout(() => {
      setActiveDiary((curr) => (curr?.id === activeDiary.id ? null : curr));
    }, activeDiary.durationSec * 1000 + 800);
    return () => window.clearTimeout(timer);
  }, [activeDiary]);

  useEffect(() => {
    return () => {
      soundEngine.stopDiaryNarration();
    };
  }, []);

  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [hud, setHud] = useState<HUDTelemetry>(INITIAL_HUD);
  const hudRef = useRef<HUDTelemetry>(INITIAL_HUD);
  const [captureSnapshot, setCaptureSnapshot] = useState<AcousticCaptureSnapshot | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [runResult, setRunResult] = useState<{
    timeSec: number;
    crystals: number;
    detections: number;
    harmony: number;
    newlyUnlocked: SoundRecordId[];
  } | null>(null);
  const [runSeed, setRunSeed] = useState(0);

  // Mobile & Tablet touch support (auto-enabled on phones, tablets, and touchscreens; toggleable in HUD)
  const touchOverrideRef = useRef(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(pointer: coarse)').matches ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 1024
    );
  });
  const [touchCrouch, setTouchCrouch] = useState(false);
  const [touchSprint, setTouchSprint] = useState(false);
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const joystickPointerIdRef = useRef<number | null>(null);

  const gameStateRef = useRef<GameState>('PLAYING');
  const captureOpenRef = useRef(false);
  const externalModalOpenRef = useRef(isExternalModalOpen);
  useEffect(() => {
    gameStateRef.current = gameState;
    if (gameState !== 'PLAYING') {
      joystickPointerIdRef.current = null;
      setJoystickKnob({ x: 0, y: 0 });
      setTouchSprint(false);
      engineRef.current?.setTouchMove(0, 0);
      engineRef.current?.setTouchSprint(false);
    }
  }, [gameState]);
  useEffect(() => {
    hudRef.current = hud;
  }, [hud]);
  useEffect(() => {
    captureOpenRef.current = captureSnapshot !== null;
  }, [captureSnapshot]);
  useEffect(() => {
    externalModalOpenRef.current = isExternalModalOpen;
    if (isExternalModalOpen) {
      joystickPointerIdRef.current = null;
      setJoystickKnob({ x: 0, y: 0 });
      setTouchSprint(false);
      engineRef.current?.clearKeys();
    }
  }, [isExternalModalOpen]);
  useEffect(() => {
    if (!hud.camouflageHint) {
      setHintDismissed(false);
    }
  }, [hud.camouflageHint]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const coarseMq = window.matchMedia('(pointer: coarse)');
    const syncTouchMode = () => {
      if (touchOverrideRef.current) return;
      setShowTouchControls(
        coarseMq.matches || navigator.maxTouchPoints > 0 || window.innerWidth < 1024
      );
    };
    coarseMq.addEventListener('change', syncTouchMode);
    window.addEventListener('resize', syncTouchMode);
    return () => {
      coarseMq.removeEventListener('change', syncTouchMode);
      window.removeEventListener('resize', syncTouchMode);
    };
  }, []);

  const updateJoystickFromClient = useCallback((clientX: number, clientY: number) => {
    const base = joystickBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = Math.max(24, rect.width * 0.38);
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoystickKnob({ x: dx, y: dy });
    const normX = dx / maxR;
    const normY = dy / maxR;
    const mag = Math.hypot(normX, normY);
    if (mag < 0.12) {
      engineRef.current?.setTouchMove(0, 0);
    } else {
      engineRef.current?.setTouchMove(normX, normY);
    }
  }, []);

  const resetJoystick = useCallback(() => {
    joystickPointerIdRef.current = null;
    setJoystickKnob({ x: 0, y: 0 });
    engineRef.current?.setTouchMove(0, 0);
  }, []);

  const toggleTouchCrouch = useCallback(() => {
    soundEngine.unlock();
    setTouchCrouch((prev) => {
      const next = !prev;
      if (next) setTouchSprint(false);
      engineRef.current?.setTouchCrouch(next);
      return next;
    });
  }, []);

  const toggleTouchSprint = useCallback(() => {
    soundEngine.unlock();
    setTouchSprint((prev) => {
      const next = !prev;
      if (next) setTouchCrouch(false);
      engineRef.current?.setTouchSprint(next);
      return next;
    });
  }, []);

  const captureScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let sourceDataUrl = '';
    try {
      sourceDataUrl = canvas.toDataURL('image/png');
    } catch {
      return;
    }
    soundEngine.unlock();
    soundEngine.playCameraShutter();
    const h = hudRef.current;
    if (gameStateRef.current === 'PLAYING') {
      setGameState('PAUSED');
    }
    setCaptureSnapshot({
      sourceDataUrl,
      levelId: level.id,
      levelTitle: level.title,
      characterName: activeCharacter.name,
      weatherLabel: h.weatherLabel,
      windSpeedKmh: h.windSpeedKmh,
      windDirectionLabel: h.windDirectionLabel,
      windDirectionDeg: h.windDirectionDeg,
      ambientVolume: h.ambientVolume,
      currentNoiseDb: h.currentNoiseDb,
      heartRateBpm: h.heartRateBpm,
      soundHarmony: h.soundHarmony,
      crystalsCollected: h.crystalsCollected,
      crystalsTotal: h.crystalsTotal,
      diariesCollected: h.diariesCollectedInLevel,
      diariesTotal: h.diariesTotalInLevel,
    });
  }, [level.id, level.title, activeCharacter.name]);

  const restartLevel = useCallback(() => {
    soundEngine.unlock();
    soundEngine.stopDiaryNarration();
    setActiveDiary(null);
    sonarRipplesRef.current = [];
    sonarSpawnTimerRef.current = 0;
    joystickPointerIdRef.current = null;
    setJoystickKnob({ x: 0, y: 0 });
    setTouchCrouch(false);
    setTouchSprint(false);
    setRunResult(null);
    setHud(INITIAL_HUD);
    setGameState('PLAYING');
    setRunSeed((s) => s + 1);
  }, []);

  // Initialize engine & animation loop per level/runSeed
  useEffect(() => {
    const engine = new EcophonistEngine(
      level,
      {
        onTelemetry: (t) => setHud(t),
        onDiaryCollected: (diary) => {
          setActiveDiary(diary);
          onCollectDiaryRef.current(diary.id);
        },
        onVictory: (stats) => {
          const newlyUnlocked = stats.earnedRecords.filter(
            (id) => !unlockedRecordsRef.current.includes(id)
          );
          setRunResult({
            timeSec: stats.timeSec,
            crystals: stats.crystals,
            detections: stats.detections,
            harmony: stats.harmony,
            newlyUnlocked,
          });
          setGameState(hasNextLevel ? 'ROUND_SUMMARY' : 'VICTORY');
          onCompleteLevel(stats);
        },
        onGameOver: () => {
          setGameState('GAME_OVER');
        },
      },
      settingsRef.current,
      equippedRef.current,
      characterId,
      unlockedRecordsRef.current
    );
    engineRef.current = engine;
    sonarRipplesRef.current = [];
    heartbeatSamplesRef.current = new Array(74).fill(0);

    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetW = Math.max(320, Math.floor(rect.width));
        const targetH = Math.max(280, Math.floor(rect.height));

        if (
          canvas.width !== Math.floor(targetW * dpr) ||
          canvas.height !== Math.floor(targetH * dpr)
        ) {
          canvas.width = Math.floor(targetW * dpr);
          canvas.height = Math.floor(targetH * dpr);
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const isPlaying = gameStateRef.current === 'PLAYING';
          if (isPlaying) {
            engine.update(dt, targetW, targetH);
          }
          engine.render(ctx, targetW, targetH);

          // Real-time Visual Sonar concentric ripples spreading from player position (modulated by Namibe wind)
          const playerScreen = engine.getPlayerScreenPos();
          const windState = engine.getWindState();
          updateAndDrawVisualSonar(
            ctx,
            sonarRipplesRef.current,
            sonarSpawnTimerRef,
            playerScreen.x,
            playerScreen.y,
            engine.getAmbientVolume(),
            settingsRef.current,
            engine.hasGoldenTuning(),
            windState,
            dt,
            !isPlaying
          );

          // Real-time synchronized corner Heartbeat Indicator (ECG + vibration)
          const hb = engine.getHeartbeatState();
          updateAndDrawHeartbeatMonitor(
            heartbeatCanvasRef.current,
            heartbeatCardRef.current,
            heartbeatIconRef.current,
            heartbeatSamplesRef.current,
            hb,
            now,
            settingsRef.current.reducedEffects,
            isPlaying
          );
        }
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      engineRef.current = null;
    };
  }, [level, characterId, runSeed, hasNextLevel, onCompleteLevel]);

  // Keyboard bindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (captureOpenRef.current || externalModalOpenRef.current) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }
      soundEngine.unlock();
      if (e.code === 'KeyF') {
        e.preventDefault();
        captureScreenshot();
        return;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        setGameState((prev) =>
          prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev
        );
        return;
      }

      if (gameStateRef.current !== 'PLAYING' || !engineRef.current) return;

      if (e.code === 'Space') {
        e.preventDefault();
      }
      if (e.code === 'KeyQ') {
        engineRef.current.triggerThrowStone();
      } else if (e.code === 'KeyE') {
        engineRef.current.triggerLeafWhisper();
      } else if (e.code === 'KeyR') {
        engineRef.current.triggerSilenceChant();
      } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
        engineRef.current.triggerSonicLeap();
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        engineRef.current.triggerVorpalSlash();
      } else if (e.code === 'KeyH') {
        engineRef.current.triggerUseMedkit();
      } else {
        engineRef.current.setKey(e.code, true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      engineRef.current?.setKey(e.code, false);
    };

    const onBlur = () => {
      engineRef.current?.clearKeys();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [captureScreenshot]);

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    const rect = canvas.getBoundingClientRect();
    engineRef.current.setMouseScreen(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    soundEngine.unlock();
    if (gameState !== 'PLAYING' || !canvasRef.current || !engineRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    engineRef.current.setMouseScreen(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );
    engineRef.current.triggerThrowStone();
  };

  const alertText =
    hud.highestAlert === 'hunt'
      ? 'CAÇADA ATIVA'
      : hud.highestAlert === 'investigate'
        ? 'SUSPEITA'
        : 'SEGURO';

  const alertColor =
    hud.highestAlert === 'hunt'
      ? 'text-rose-400'
      : hud.highestAlert === 'investigate'
        ? 'text-amber-300'
        : 'text-emerald-300';

  return (
    <div className="h-dvh w-full bg-[#07090F] text-slate-100 flex flex-col overflow-hidden select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Top Tactical Acoustic HUD */}
      <header className="w-full border-b border-slate-800/90 bg-[#0A0E18] px-2.5 sm:px-6 py-1.5 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onExitToMenu}
            aria-label="Voltar ao Menu"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer shrink-0 py-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Menu</span>
          </button>
          <span className="text-slate-700" aria-hidden="true">
            |
          </span>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {!avatarError ? (
              <img
                src={activeCharacter.portrait}
                alt={activeCharacter.name}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-cover border border-slate-700 shrink-0 hidden sm:block"
              />
            ) : null}
            <div className="min-w-0">
              <h1 className="font-display text-sm sm:text-lg font-bold text-white leading-none truncate max-w-[140px] sm:max-w-none">
                {activeCharacter.name} · {level.title}
              </h1>
              <p className="hidden md:block text-xs text-slate-400 truncate mt-0.5">
                {level.objectiveHint}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-5 shrink-0 font-mono-tabular text-xs">
          {/* HP + Tactical Vest Shield (SAO/Free Fire) */}
          <div className="flex items-center gap-1.5 sm:gap-2" aria-label={`Vitalidade ${hud.hp} de ${hud.maxHp}`}>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {Array.from({ length: hud.maxHp }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    i < hud.hp ? 'text-rose-400 fill-rose-400' : 'text-slate-700'
                  }`}
                />
              ))}
              <span className="ml-0.5 text-slate-300 text-[11px] sm:text-xs">
                {hud.hp}/{hud.maxHp}
              </span>
            </div>
            {hud.armorShield > 0 && (
              <div
                className="flex items-center gap-0.5 text-sky-300"
                title="Colete Tático: absorve 1 ponto de dano antes da vida"
              >
                {Array.from({ length: hud.armorShield }).map((_, i) => (
                  <Shield key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-sky-400/40 text-sky-300" />
                ))}
              </div>
            )}
          </div>

          {/* Breath & Sword Skill Energy Meters */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5" title="Fôlego para segurar respiração">
              <span className="text-slate-400 hidden sm:inline">Fôlego</span>
              <div className="w-10 sm:w-14 h-2 bg-slate-800 rounded-sm overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    hud.breathGasping
                      ? 'bg-rose-500'
                      : hud.isHoldingBreath
                        ? 'bg-sky-400'
                        : 'bg-cyan-400'
                  }`}
                  style={{ width: `${hud.breath}%` }}
                />
              </div>
            </div>

            <div
              className="flex items-center gap-1"
              title="Energia Aincrad para Sword Skills [1] Sonic Leap e [2] Vorpal Strike"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div className="hidden sm:block w-14 h-2 bg-slate-800 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-purple-400 transition-all duration-100"
                  style={{ width: `${hud.swordEnergy}%` }}
                />
              </div>
              <span className="text-purple-200 text-[11px] sm:text-xs">{hud.swordEnergy}%</span>
            </div>
          </div>

          {/* Harmonia Sonora Meter */}
          <div
            className="hidden lg:flex items-center gap-2"
            title="Harmonia Sonora: ações silenciosas concedem bônus, ruídos excessivos penalizam e definem o final"
          >
            <span className="text-slate-400">Harmonia</span>
            <div className="w-16 h-2 bg-slate-800 rounded-sm overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  hud.soundHarmony >= 80
                    ? 'bg-emerald-400'
                    : hud.soundHarmony >= 45
                      ? 'bg-cyan-400'
                      : 'bg-rose-500'
                }`}
                style={{ width: `${hud.soundHarmony}%` }}
              />
            </div>
            <span
              className={`w-8 text-right font-semibold ${
                hud.soundHarmony >= 80
                  ? 'text-emerald-300'
                  : hud.soundHarmony >= 45
                    ? 'text-cyan-200'
                    : 'text-rose-300'
              }`}
            >
              {hud.soundHarmony}%
            </span>
            {hud.soundComboMultiplier > 1 && (
              <span className="text-amber-300 font-bold">
                {hud.soundComboMultiplier.toFixed(1)}x
              </span>
            )}
          </div>

          {/* Weather Event, Dynamic Namibe Wind, Ambient Sonar Volume, Decibels & Camouflage */}
          <div className="hidden xl:flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-200">
              {hud.weatherEvent === 'tempestade_kwanza' ? (
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              ) : hud.weatherEvent === 'neblina_namibe' ? (
                <CloudFog className="w-3.5 h-3.5 text-slate-300" />
              ) : hud.weatherEvent === 'cacimbo' ? (
                <Wind className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
              )}
              <span>{hud.weatherLabel}</span>
            </span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span
              className={`flex items-center gap-1.5 ${
                hud.windIntensityPct >= 72
                  ? 'text-amber-300 font-semibold'
                  : hud.windIntensityPct >= 45
                    ? 'text-cyan-200'
                    : 'text-slate-300'
              }`}
              title={`Direção do vento (${hud.windGustLabel}): som deriva para ${hud.windDirectionLabel} e sofre atenuação visual de ${hud.soundAttenuationPct}%`}
            >
              <Navigation
                className="w-3.5 h-3.5 transition-transform duration-300"
                style={{ transform: `rotate(${hud.windDirectionDeg + 90}deg)` }}
              />
              <span>
                Vento {hud.windSpeedKmh} km/h {hud.windDirectionLabel}
              </span>
              <span className="text-slate-400">(-{hud.soundAttenuationPct}% som)</span>
            </span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span className="text-cyan-300">Sonar {hud.ambientVolume}%</span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span className="text-slate-300">{hud.currentNoiseDb} dB</span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span className={hud.isCamouflaged ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
              {hud.isCamouflaged ? `Camuflado (${hud.camouflageSource})` : 'Exposto'}
            </span>
          </div>

          {/* Alert State, Crystals, Crates & Diaries */}
          <div className="hidden md:flex items-center gap-2.5">
            <span className={`font-semibold ${alertColor}`}>{alertText}</span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span className="text-emerald-300">
              Cristais {hud.crystalsCollected}/{hud.crystalsTotal}
            </span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span className="text-sky-300 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              {hud.cratesOpened}/{hud.cratesTotal}
            </span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span className="text-amber-200 hidden lg:inline">
              Diários {hud.diariesCollectedInLevel}/{hud.diariesTotalInLevel}
            </span>
            <span aria-hidden="true" className="text-slate-700 hidden lg:inline">
              ·
            </span>
            <span className="text-slate-300">{hud.elapsedSeconds}s</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                touchOverrideRef.current = true;
                setShowTouchControls((v) => !v);
              }}
              title={
                showTouchControls
                  ? 'Ocultar Joystick e Controles Táteis'
                  : 'Exibir Joystick e Controles Táteis (Celular/Tablet)'
              }
              aria-label="Alternar controles táteis"
              aria-pressed={showTouchControls}
              className={`p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer ${
                showTouchControls
                  ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-200'
                  : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={captureScreenshot}
              title="Modo Captura Sonora [F]: aplicar filtros sonoros visuais"
              aria-label="Modo Captura Sonora"
              className="p-1.5 sm:p-2 rounded-lg border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setGameState('PAUSED');
                onOpenSettings('settings');
              }}
              aria-label="Configurações e Loja"
              className="p-1.5 sm:p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={settings.muted ? 'Ativar áudio' : 'Silenciar áudio'}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 cursor-pointer"
            >
              {settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() =>
                setGameState((prev) =>
                  prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev
                )
              }
              aria-label={gameState === 'PAUSED' ? 'Continuar' : 'Pausar'}
              className="px-2 sm:px-3 py-1.5 rounded-lg border border-slate-800 text-slate-200 hover:border-slate-600 flex items-center gap-1.5 cursor-pointer"
            >
              {gameState === 'PAUSED' ? (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Continuar</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pausar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Playfield Canvas */}
      <div ref={containerRef} className="relative flex-1 w-full overflow-hidden bg-[#06080E]">
        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerMove}
          onPointerMove={handleCanvasPointerMove}
          onClick={handleCanvasClick}
          className="block w-full h-full cursor-crosshair touch-none select-none"
        />

        {/* Environmental Sound Diary Playback Subtitle Overlay */}
        {activeDiary && (
          <aside
            aria-live="polite"
            className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 max-w-[calc(100vw-154px)] sm:max-w-md bg-[#0A0E18]/92 border border-slate-700/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-xl space-y-1.5 sm:space-y-2"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p
                  className="text-[10px] sm:text-[11px] font-semibold truncate"
                  style={{ color: activeDiary.accentColor }}
                >
                  {activeDiary.chapter} · Diário (+1 Eco)
                </p>
                <h3 className="font-display text-base sm:text-lg font-bold text-white leading-tight flex items-center gap-1.5 sm:gap-2 mt-0.5">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: activeDiary.accentColor }} />
                  <span className="truncate">{activeDiary.title}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.stopDiaryNarration();
                  setActiveDiary(null);
                }}
                aria-label="Fechar narração do diário"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed line-clamp-3 sm:line-clamp-none">
              {activeDiary.transcript}
            </p>
          </aside>
        )}

        {/* Top-Left / Top-Center Stack: Safe Zone Warning + SAO Boss Bar (never overlaps Mini-Radar) */}
        <div className="pointer-events-none absolute top-2 left-2 right-[142px] sm:top-3 sm:left-4 sm:right-[184px] lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[min(44vw,420px)] z-10 flex flex-col items-stretch sm:items-center gap-1.5">
          {gameState === 'PLAYING' && hud.playerOutsideSafeZone && (
            <div className="bg-rose-950/92 border border-rose-400/80 px-2.5 sm:px-4 py-1 sm:py-1.5 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono-tabular font-bold text-rose-100 shadow-lg text-center">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-300 animate-pulse shrink-0" />
              <span className="truncate">
                FORA DA ZONA ({hud.safeZoneDistMeters}m) — RETORNE!
              </span>
            </div>
          )}

          {/* SAO Multi-Bar Floor Boss HUD */}
          {gameState === 'PLAYING' && hud.boss && !hud.boss.defeated && (() => {
            const boss = hud.boss;
            const barSize = boss.maxHp / Math.max(1, boss.bars);
            const remainingBars = Math.max(1, Math.ceil(boss.hp / barSize));
            const currentBarPct =
              boss.hp <= 0
                ? 0
                : ((boss.hp - (remainingBars - 1) * barSize) / barSize) * 100;
            const stancePct = Math.round((boss.stance / Math.max(1, boss.maxStance)) * 100);
            return (
              <div className="w-full bg-[#0A0E18]/92 border border-slate-700/90 sao-frame px-3 sm:px-4 py-1.5 sm:py-2.5 shadow-2xl space-y-1 sm:space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
                    <Skull className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: boss.accentColor }} />
                    <div className="min-w-0">
                      <p className="font-display text-xs sm:text-sm font-extrabold text-white leading-none truncate">
                        {boss.name}
                      </p>
                      <p className="hidden sm:block text-[10px] text-slate-400 truncate mt-0.5">
                        {boss.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 font-mono-tabular text-[11px] sm:text-xs shrink-0">
                    {boss.stunned ? (
                      <span className="text-sky-300 font-bold">ATORDOADO</span>
                    ) : boss.telegraphing ? (
                      <span className="text-rose-400 font-bold animate-pulse">AoE!</span>
                    ) : null}
                    <span className="text-amber-300 font-bold">×{remainingBars}</span>
                  </div>
                </div>

                {/* Active SAO HP Segment Bar */}
                <div className="w-full h-2 sm:h-2.5 bg-slate-900 border border-slate-700 overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: `${Math.max(0, Math.min(100, currentBarPct))}%`,
                      backgroundColor:
                        remainingBars >= 3
                          ? '#34D399'
                          : remainingBars === 2
                            ? '#FBBF24'
                            : '#F43F5E',
                    }}
                  />
                </div>

                {/* Stance / Guard Break Gauge */}
                <div className="flex items-center justify-between gap-2 text-[9px] sm:text-[10px] font-mono-tabular text-slate-400">
                  <span>Postura</span>
                  <div className="flex-1 h-1 bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-400 transition-all duration-100"
                      style={{ width: `${stancePct}%` }}
                    />
                  </div>
                  <span>
                    {boss.hp}/{boss.maxHp}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Supply Crate Loot Toast */}
        {gameState === 'PLAYING' && hud.recentLootToast && (
          <div
            aria-live="polite"
            className="pointer-events-none absolute top-20 sm:top-24 left-2 sm:left-4 z-10 bg-[#0A0E18]/94 border border-slate-700/90 sao-frame px-3 sm:px-4 py-2 sm:py-2.5 shadow-xl flex items-center gap-2.5 sm:gap-3 max-w-[calc(100vw-154px)] sm:max-w-xs"
          >
            <Package className="w-4 h-4 shrink-0" style={{ color: hud.recentLootToast.accentColor }} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{hud.recentLootToast.title}</p>
              <p
                className="text-[11px] font-mono-tabular truncate"
                style={{ color: hud.recentLootToast.accentColor }}
              >
                {hud.recentLootToast.detail}
              </p>
            </div>
          </div>
        )}

        {/* Top-Right Free Fire Tactical Mini-Radar + Sound Combo Stack */}
        <div className="pointer-events-none absolute top-2 right-2 sm:top-3 sm:right-4 z-10 flex flex-col items-end gap-1.5 sm:gap-2">
          {/* Free Fire Mini-Radar */}
          <div className="bg-[#0A0E18]/90 border border-slate-700/90 sao-frame p-1.5 sm:p-2 shadow-xl space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-mono-tabular">
              <span className="text-cyan-300 font-semibold truncate max-w-[54px] sm:max-w-none">
                {level.sectorTag}
              </span>
              <span
                className={
                  hud.safeZonePhase === 'fechando'
                    ? 'text-rose-400 font-bold animate-pulse'
                    : hud.safeZoneLockedFinal
                      ? 'text-amber-300 font-bold'
                      : 'text-slate-300'
                }
              >
                {hud.safeZoneLockedFinal
                  ? 'Final'
                  : hud.safeZonePhase === 'fechando'
                    ? `Fecha ${hud.safeZoneTimeRemaining}s`
                    : `Z${hud.safeZoneStage}/${hud.safeZoneTotalStages} · ${hud.safeZoneTimeRemaining}s`}
              </span>
            </div>
            <svg
              viewBox={`0 0 ${hud.radar.worldWidth} ${hud.radar.worldHeight}`}
              className="block w-[122px] h-[48px] sm:w-[156px] sm:h-[62px] md:w-[182px] md:h-[72px] bg-[#05070D] border border-slate-800 rounded-sm overflow-hidden"
            >
              {/* Crimson Storm Haze Outside Active Safe Zone */}
              <path
                d={`M -1200 -1200 H ${hud.radar.worldWidth + 1200} V ${hud.radar.worldHeight + 1200} H -1200 Z M ${hud.radar.safeX} ${hud.radar.safeY - hud.radar.safeRadius} A ${hud.radar.safeRadius} ${hud.radar.safeRadius} 0 1 0 ${hud.radar.safeX} ${hud.radar.safeY + hud.radar.safeRadius} A ${hud.radar.safeRadius} ${hud.radar.safeRadius} 0 1 0 ${hud.radar.safeX} ${hud.radar.safeY - hud.radar.safeRadius} Z`}
                fill="rgba(225, 29, 72, 0.32)"
                fillRule="evenodd"
              />
              {/* Active Safe Zone Border */}
              <circle
                cx={hud.radar.safeX}
                cy={hud.radar.safeY}
                r={hud.radar.safeRadius}
                fill="none"
                stroke="#FB7185"
                strokeWidth={24}
              />
              {/* Next Safe Zone Target Circle */}
              {!hud.safeZoneLockedFinal && (
                <circle
                  cx={hud.radar.targetSafeX}
                  cy={hud.radar.targetSafeY}
                  r={hud.radar.targetSafeRadius}
                  fill="none"
                  stroke="rgba(248, 250, 252, 0.55)"
                  strokeWidth={18}
                  strokeDasharray="65 45"
                />
              )}
              {/* Tactical Dotted Line to Safe Circle */}
              {(hud.playerOutsideSafeZone || hud.playerOutsideTargetZone) && (
                <line
                  x1={hud.radar.playerX}
                  y1={hud.radar.playerY}
                  x2={hud.playerOutsideSafeZone ? hud.radar.safeX : hud.radar.targetSafeX}
                  y2={hud.playerOutsideSafeZone ? hud.radar.safeY : hud.radar.targetSafeY}
                  stroke={hud.playerOutsideSafeZone ? '#FB7185' : 'rgba(248, 250, 252, 0.55)'}
                  strokeWidth={16}
                  strokeDasharray="50 40"
                />
              )}
              {/* Unopened Supply Crates */}
              {hud.radar.crates
                .filter((c) => !c.opened)
                .map((c, idx) => (
                  <rect
                    key={idx}
                    x={c.x - 28}
                    y={c.y - 28}
                    width={56}
                    height={56}
                    fill="#FBBF24"
                  />
                ))}
              {/* Alerted Enemies */}
              {hud.radar.enemies
                .filter((e) => e.alert !== 'patrol')
                .map((e, idx) => (
                  <circle key={idx} cx={e.x} cy={e.y} r={34} fill="#F43F5E" />
                ))}
              {/* Exit Portal */}
              <rect
                x={hud.radar.exitX - 42}
                y={hud.radar.exitY - 42}
                width={84}
                height={84}
                fill={hud.radar.boss && !hud.radar.boss.defeated ? '#F43F5E' : '#34D399'}
              />
              {/* Floor Boss */}
              {hud.radar.boss && !hud.radar.boss.defeated && (
                <circle cx={hud.radar.boss.x} cy={hud.radar.boss.y} r={54} fill="#F43F5E" />
              )}
              {/* Player */}
              <circle
                cx={hud.radar.playerX}
                cy={hud.radar.playerY}
                r={48}
                fill="#22D3EE"
                stroke="#F8FAFC"
                strokeWidth={18}
              />
            </svg>
            {(hud.playerOutsideSafeZone || hud.playerOutsideTargetZone) && (
              <p
                className={`text-[10px] font-mono-tabular text-right ${
                  hud.playerOutsideSafeZone ? 'text-rose-300 font-bold' : 'text-slate-300'
                }`}
              >
                {hud.playerOutsideSafeZone
                  ? `Tempestade: ${hud.safeZoneDistMeters}m até área segura`
                  : `Avance furtivo: ${hud.safeZoneTargetDistMeters}m p/ próx. círculo`}
              </p>
            )}
          </div>

          {/* Combos Sonoros Rhythm Multiplier Indicator */}
          {gameState === 'PLAYING' && hud.soundComboCount >= 1 && (
            <div
              aria-label={`Combo Sonoro ${hud.soundComboCount} manobras, multiplicador ${hud.soundComboMultiplier.toFixed(1)}x`}
              className="bg-[#0A0E18]/90 border border-slate-700/90 sao-frame px-2.5 sm:px-4 py-1.5 sm:py-2 min-w-[130px] sm:min-w-[185px] shadow-xl space-y-1"
            >
              <div className="flex items-baseline justify-between gap-2 font-mono-tabular">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Combo
                </span>
                <span
                  className={`text-sm sm:text-base font-extrabold leading-none ${
                    hud.soundComboMultiplier >= 2.5
                      ? 'text-emerald-300'
                      : hud.soundComboMultiplier >= 2.0
                        ? 'text-amber-300'
                        : hud.soundComboMultiplier > 1.0
                          ? 'text-cyan-300'
                          : 'text-slate-200'
                  }`}
                >
                  {hud.soundComboMultiplier.toFixed(1)}x
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
                <span className="text-white font-semibold truncate max-w-[90px] sm:max-w-none">
                  {hud.soundComboLabel}
                </span>
                <span className="font-mono-tabular text-slate-400 shrink-0">
                  {hud.soundComboCount}x
                </span>
              </div>
              <div className="w-full h-1 sm:h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    hud.soundComboMultiplier >= 2.5
                      ? 'bg-emerald-400'
                      : hud.soundComboMultiplier >= 2.0
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                  }`}
                  style={{ width: `${hud.soundComboTimerPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Environmental Camouflage Suggestion when stationary near a creature */}
        {gameState === 'PLAYING' && hud.camouflageHint && !hintDismissed && (
          <aside
            aria-live="polite"
            className={`absolute left-2.5 right-2.5 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-lg z-10 bg-[#0A0E18]/94 border border-slate-700/90 backdrop-blur-sm rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-2xl ${
              showTouchControls ? 'bottom-[168px] sm:bottom-[184px] lg:bottom-5' : 'bottom-4'
            }`}
            style={{ borderLeftWidth: '4px', borderLeftColor: hud.camouflageHint.accentColor }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
                  <span
                    className="flex items-center gap-1 font-semibold"
                    style={{ color: hud.camouflageHint.accentColor }}
                  >
                    <Ear className="w-3.5 h-3.5" />
                    Camuflagem Sonora
                  </span>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="text-slate-300">{hud.camouflageHint.environmentLabel}</span>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="font-mono-tabular font-semibold text-white">
                    {hud.camouflageHint.actionTag}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                  {hud.camouflageHint.title}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed">
                  {hud.camouflageHint.suggestion}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHintDismissed(true)}
                aria-label="Dispensar sugestão de camuflagem"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>
        )}

        {/* Mobile & Tablet Touch Controls: Quick Posture Toggles + 360 Analog Virtual Joystick */}
        {showTouchControls && gameState === 'PLAYING' && (
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-10 flex flex-col items-start gap-2 select-none">
            {/* Crouch & Sprint Toggle Row */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTouchCrouch}
                aria-pressed={touchCrouch}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold tracking-tight transition-colors touch-none select-none cursor-pointer ${
                  touchCrouch
                    ? 'bg-cyan-400/25 border-cyan-300 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.28)]'
                    : 'bg-[#0A0E18]/88 border-slate-700 text-slate-300'
                }`}
              >
                {touchCrouch ? 'Agachado ✓' : 'Agachar'}
              </button>
              <button
                type="button"
                onClick={toggleTouchSprint}
                aria-pressed={touchSprint}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold tracking-tight transition-colors touch-none select-none cursor-pointer ${
                  touchSprint
                    ? 'bg-amber-400/25 border-amber-300 text-amber-100 shadow-[0_0_10px_rgba(251,191,36,0.28)]'
                    : 'bg-[#0A0E18]/88 border-slate-700 text-slate-300'
                }`}
              >
                {touchSprint ? 'Correndo ✓' : 'Correr'}
              </button>
            </div>

            {/* 360° Analog Virtual Joystick */}
            <div
              ref={joystickBaseRef}
              role="application"
              aria-label="Joystick tátil de movimento"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                soundEngine.unlock();
                joystickPointerIdRef.current = e.pointerId;
                e.currentTarget.setPointerCapture(e.pointerId);
                updateJoystickFromClient(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (joystickPointerIdRef.current !== e.pointerId) return;
                e.preventDefault();
                updateJoystickFromClient(e.clientX, e.clientY);
              }}
              onPointerUp={(e) => {
                if (joystickPointerIdRef.current !== e.pointerId) return;
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
                resetJoystick();
              }}
              onPointerCancel={(e) => {
                if (joystickPointerIdRef.current !== e.pointerId) return;
                resetJoystick();
              }}
              onLostPointerCapture={() => {
                resetJoystick();
              }}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#070B14]/75 border border-cyan-400/40 backdrop-blur-sm touch-none select-none flex items-center justify-center shadow-2xl"
            >
              {/* Crosshair rings */}
              <div className="pointer-events-none absolute inset-3 rounded-full border border-slate-700/60" />
              <div className="pointer-events-none absolute inset-x-4 top-1/2 h-px bg-slate-700/40" />
              <div className="pointer-events-none absolute inset-y-4 left-1/2 w-px bg-slate-700/40" />
              {/* Draggable Thumb Puck */}
              <div
                className="pointer-events-none w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-cyan-400/25 border-2 border-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.45)] flex items-center justify-center"
                style={{
                  transform: `translate3d(${joystickKnob.x.toFixed(1)}px, ${joystickKnob.y.toFixed(1)}px, 0px)`,
                }}
              >
                <div className="w-3 h-3 rounded-full bg-cyan-200" />
              </div>
            </div>
          </div>
        )}

        {/* Synchronized Corner Heartbeat Indicator */}
        <div
          ref={heartbeatCardRef}
          aria-label={`Ritmo cardíaco: ${hud.heartRateBpm} batimentos por minuto`}
          className="pointer-events-none absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-10 bg-[#0A0E18]/88 border border-slate-800/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 will-change-transform"
        >
          <div ref={heartbeatIconRef} className="shrink-0 will-change-transform">
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 ${
                hud.heartRateBpm >= 136
                  ? 'text-rose-400 fill-rose-500/80'
                  : hud.heartRateBpm >= 104
                    ? 'text-amber-300 fill-amber-400/50'
                    : 'text-cyan-300 fill-cyan-400/30'
              }`}
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-2 sm:gap-3 font-mono-tabular">
              <span
                className={`text-xs sm:text-sm font-bold leading-none ${
                  hud.heartRateBpm >= 136
                    ? 'text-rose-300'
                    : hud.heartRateBpm >= 104
                      ? 'text-amber-200'
                      : 'text-cyan-200'
                }`}
              >
                {hud.heartRateBpm} BPM
              </span>
              <span className="hidden sm:inline text-[11px] font-sans font-medium text-slate-400 leading-none">
                {hud.heartRateBpm >= 136
                  ? 'Frenético'
                  : hud.heartRateBpm >= 104
                    ? 'Acelerado'
                    : 'Calmo'}
              </span>
            </div>
            <canvas
              ref={heartbeatCanvasRef}
              width={120}
              height={28}
              className="block w-[70px] h-[22px] sm:w-[120px] sm:h-[28px]"
            />
          </div>
        </div>

        {/* Pause / Game Over / Summary Modals */}
        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-[#07090F]/82 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-20">
            <div className="max-w-md w-full bg-[#0E1422] border border-slate-700 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[90dvh] overflow-y-auto">
              {gameState === 'PAUSED' && (
                <>
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                      Jogo Pausado
                    </h2>
                    <p className="text-sm text-cyan-300">
                      {activeCharacter.name} ({activeCharacter.specialty})
                    </p>
                    <p className="text-xs text-slate-400">{level.title}</p>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1.5 border-t border-b border-slate-800 py-3">
                    <p>Teclado: WASD/Setas mover · Shift correr · C agachar · Espaço fôlego</p>
                    <p>Celular/Tablet: Joystick analógico · Agachar/Correr · Toque no mapa p/ seixo</p>
                    <p>Habilidades: Q Pedra · 1 Sonic Leap · 2 Vorpal Strike · H Kit Médico</p>
                    {level.hasWhisperAbility && <p>E: Sussurro na Folha (cortina sonora)</p>}
                    {level.hasSilenceAbility && <p>R: Canto do Silêncio (bolha de vácuo)</p>}
                    <p>F: Modo Captura Sonora</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setGameState('PLAYING')}
                      className="flex-1 py-2.5 px-4 bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg hover:bg-cyan-300 cursor-pointer"
                    >
                      Continuar
                    </button>
                    <button
                      type="button"
                      onClick={captureScreenshot}
                      className="py-2.5 px-3.5 sm:px-4 border border-cyan-500/50 text-cyan-200 font-medium text-sm rounded-lg hover:bg-cyan-500/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Capturar Tela
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSettings('store')}
                      className="py-2.5 px-3.5 sm:px-4 border border-amber-500/50 text-amber-300 font-medium text-sm rounded-lg hover:bg-amber-500/10 cursor-pointer"
                    >
                      Arsenal
                    </button>
                    <button
                      type="button"
                      onClick={restartLevel}
                      className="py-2.5 px-3.5 sm:px-4 border border-slate-700 text-slate-200 font-medium text-sm rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      Reiniciar
                    </button>
                    <button
                      type="button"
                      onClick={onExitToMenu}
                      className="py-2.5 px-3.5 sm:px-4 border border-slate-700 text-slate-300 font-medium text-sm rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      Menu
                    </button>
                  </div>
                </>
              )}

              {gameState === 'GAME_OVER' && (
                <>
                  <div className="space-y-2">
                    <h2 className="font-display text-3xl font-extrabold text-rose-400">
                      Localizado pelo Som
                    </h2>
                    <p className="text-sm text-slate-300">
                      Os predadores cegos seguiram sua assinatura acústica na escuridão.
                      Sincronize seus passos com o vento ou use pedras de isca para desviar a
                      atenção.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={restartLevel}
                      className="flex-1 py-2.5 px-4 bg-amber-400 text-slate-950 font-bold text-sm rounded-lg hover:bg-amber-300 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Tentar Novamente
                    </button>
                    <button
                      type="button"
                      onClick={onExitToMenu}
                      className="py-2.5 px-4 border border-slate-700 text-slate-200 font-medium text-sm rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      Menu
                    </button>
                  </div>
                </>
              )}

              {(gameState === 'ROUND_SUMMARY' || gameState === 'VICTORY') && runResult && (() => {
                const ending = getHarmonyEnding(runResult.harmony);
                const headingColor =
                  ending.tier === 'harmonia_pura'
                    ? 'text-emerald-300'
                    : ending.tier === 'equilibrio_instavel'
                      ? 'text-cyan-300'
                      : 'text-rose-400';
                return (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-400">
                      {gameState === 'VICTORY'
                        ? `Desfecho da Campanha · ${ending.title}`
                        : `Ato Concluído · ${ending.title}`}
                    </p>
                    <h2 className={`font-display text-3xl font-extrabold leading-tight ${headingColor}`}>
                      {gameState === 'VICTORY' ? ending.finalTitle : 'Santuário Alcançado'}
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {gameState === 'VICTORY' ? ending.finalDescription : ending.description}
                    </p>
                    {ending.shardBonus > 0 && (
                      <p className="text-xs text-amber-300 font-mono-tabular">
                        +{ending.shardBonus} Fragmento{ending.shardBonus > 1 ? 's' : ''} de Eco
                        bônus por Harmonia Sonora
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3 border-t border-b border-slate-800 py-4 font-mono-tabular text-center">
                    <div>
                      <p className="text-xs text-slate-400">Tempo</p>
                      <p className="text-xl font-bold text-white">{runResult.timeSec}s</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Cristais</p>
                      <p className="text-xl font-bold text-emerald-300">
                        {runResult.crystals}/{hud.crystalsTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Alertas</p>
                      <p className="text-xl font-bold text-amber-300">{runResult.detections}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Harmonia</p>
                      <p className={`text-xl font-bold ${headingColor}`}>{runResult.harmony}%</p>
                    </div>
                  </div>
                  {hud.maxSoundCombo >= 2 && (
                    <p className="text-xs text-cyan-300 font-mono-tabular text-center -mt-2">
                      Melhor Sequência de Combo Sonoro: {hud.maxSoundCombo} manobras consecutivas
                    </p>
                  )}

                  {runResult.newlyUnlocked.length > 0 && (
                    <div className="space-y-1.5 border-b border-slate-800 pb-3">
                      <p className="text-xs font-semibold text-amber-300">
                        Novos Registros Sonoros Desbloqueados
                      </p>
                      <div className="space-y-1">
                        {runResult.newlyUnlocked.map((id) => {
                          const def = getSoundRecordById(id);
                          if (!def) return null;
                          return (
                            <p key={id} className="text-xs text-slate-200">
                              <span className="font-semibold" style={{ color: def.accentColor }}>
                                {def.title}
                              </span>{' '}
                              <span className="text-slate-400">· {def.rewardLabel}</span>
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {gameState === 'ROUND_SUMMARY' && hasNextLevel ? (
                      <button
                        type="button"
                        onClick={onGoNextLevel}
                        className="flex-1 py-2.5 px-4 bg-cyan-400 text-slate-950 font-bold text-sm rounded-lg hover:bg-cyan-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Próximo Ato
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={restartLevel}
                        className="flex-1 py-2.5 px-4 bg-cyan-400 text-slate-950 font-bold text-sm rounded-lg hover:bg-cyan-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Jogar Novamente
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={captureScreenshot}
                      className="py-2.5 px-4 border border-cyan-500/50 text-cyan-200 font-medium text-sm rounded-lg hover:bg-cyan-500/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Capturar
                    </button>
                    <button
                      type="button"
                      onClick={onExitToMenu}
                      className="py-2.5 px-4 border border-slate-700 text-slate-200 font-medium text-sm rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      Menu
                    </button>
                  </div>
                </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Interactive Acoustic Action Bar (Single-row scrollable on phones/tablets) */}
      <footer className="w-full border-t border-slate-800/90 bg-[#0A0E18] px-2.5 sm:px-6 py-1.5 sm:py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex flex-nowrap lg:flex-wrap items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full lg:w-auto">
          {/* Hold Breath */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              soundEngine.unlock();
              engineRef.current?.setHoldBreath(true);
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
              engineRef.current?.setHoldBreath(false);
            }}
            onPointerCancel={() => engineRef.current?.setHoldBreath(false)}
            onLostPointerCapture={() => engineRef.current?.setHoldBreath(false)}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 touch-none select-none ${
              hud.isHoldingBreath
                ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
            }`}
          >
            <EarOff className="w-3.5 h-3.5" />
            <span>Fôlego</span>
            <span className="hidden sm:inline">(Espaço)</span>
          </button>

          {/* Throw Stone */}
          <button
            type="button"
            disabled={hud.stones <= 0}
            onClick={() => {
              soundEngine.unlock();
              engineRef.current?.triggerThrowStone();
            }}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 font-mono-tabular ${
              hud.stones > 0
                ? 'bg-slate-900 border-amber-500/50 text-amber-300 hover:bg-amber-500/10 cursor-pointer'
                : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>Pedra [Q] · {hud.stones}/{hud.maxStones}</span>
          </button>

          {/* Leaf Whisper */}
          {hud.hasWhisperAbility && (
            <button
              type="button"
              disabled={!hud.whisperReady}
              onClick={() => {
                soundEngine.unlock();
                engineRef.current?.triggerLeafWhisper();
              }}
              className={`px-3 sm:px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 font-mono-tabular ${
                hud.whisperReady
                  ? 'bg-slate-900 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              {hud.whisperReady
                ? 'Sussurro [E]'
                : `Sussurro (${hud.whisperCooldown}s)`}
            </button>
          )}

          {/* Silence Chant */}
          {hud.hasSilenceAbility && (
            <button
              type="button"
              disabled={!hud.silenceReady}
              onClick={() => {
                soundEngine.unlock();
                engineRef.current?.triggerSilenceChant();
              }}
              className={`px-3 sm:px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 font-mono-tabular ${
                hud.silenceActiveRemaining > 0
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : hud.silenceReady
                    ? 'bg-slate-900 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 cursor-pointer'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {hud.silenceActiveRemaining > 0
                ? `Silêncio (${hud.silenceActiveRemaining}s)`
                : hud.silenceReady
                  ? 'Silêncio [R]'
                  : `Silêncio (${hud.silenceCooldown}s)`}
            </button>
          )}

          {/* Sword Skill [1] Sonic Leap */}
          <button
            type="button"
            disabled={!hud.sonicLeapReady}
            onClick={() => {
              soundEngine.unlock();
              engineRef.current?.triggerSonicLeap();
            }}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 font-mono-tabular ${
              hud.sonicLeapReady
                ? 'bg-slate-900 border-sky-500/55 text-sky-300 hover:bg-sky-500/10 cursor-pointer'
                : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Sword className="w-3.5 h-3.5" />
            {hud.sonicLeapCooldown > 0
              ? `Sonic (${hud.sonicLeapCooldown}s)`
              : 'Sonic Leap [1] · 25⚡'}
          </button>

          {/* Sword Skill [2] Vorpal Strike */}
          <button
            type="button"
            disabled={!hud.vorpalSlashReady}
            onClick={() => {
              soundEngine.unlock();
              engineRef.current?.triggerVorpalSlash();
            }}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 font-mono-tabular ${
              hud.vorpalSlashReady
                ? 'bg-slate-900 border-rose-500/55 text-rose-300 hover:bg-rose-500/10 cursor-pointer'
                : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {hud.vorpalSlashCooldown > 0
              ? `Vorpal (${hud.vorpalSlashCooldown}s)`
              : 'Vorpal [2] · 40⚡'}
          </button>

          {/* Medkit [H] */}
          <button
            type="button"
            disabled={hud.medkits <= 0 || hud.hp >= hud.maxHp}
            onClick={() => {
              soundEngine.unlock();
              engineRef.current?.triggerUseMedkit();
            }}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 font-mono-tabular ${
              hud.medkits > 0 && hud.hp < hud.maxHp
                ? 'bg-slate-900 border-emerald-500/55 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer'
                : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Cross className="w-3.5 h-3.5" />
            Kit [H] · {hud.medkits}
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
          {hud.windIntensityPct >= 72 ? (
            <span className="text-amber-300 font-medium">
              {hud.windGustLabel} ({hud.windSpeedKmh} km/h {hud.windDirectionLabel}): atenuação de{' '}
              {hud.soundAttenuationPct}% — avance a barlavento!
            </span>
          ) : hud.weatherEvent === 'tempestade_kwanza' ? (
            <span className="text-sky-300 font-medium">
              Tempestade do Kwanza: chuva mascara passos e atenua o som em {hud.soundAttenuationPct}%
            </span>
          ) : hud.weatherEvent === 'neblina_namibe' ? (
            <span className="text-slate-200 font-medium">
              Neblina do Namibe ({hud.windGustLabel}): vento a {hud.windSpeedKmh} km/h atenua ondas
              em {hud.soundAttenuationPct}%
            </span>
          ) : hud.weatherEvent === 'cacimbo' ? (
            <span className="text-amber-200 font-medium">
              Vento Cacimbo ({hud.windDirectionLabel}): atenuação de {hud.soundAttenuationPct}% ·
              ondas derivam a sotavento
            </span>
          ) : (
            <span className="text-slate-300">
              Calmaria ({hud.windSpeedKmh} km/h): atenuação mínima ({hud.soundAttenuationPct}%) —
              contenha passos e fôlego
            </span>
          )}
          <span aria-hidden="true" className="text-slate-700">
            ·
          </span>
          <span>Clique no mapa para arremessar seixo · F para Captura Sonora</span>
        </div>
      </footer>

      {captureSnapshot && (
        <AcousticPhotoModal
          snapshot={captureSnapshot}
          onClose={() => setCaptureSnapshot(null)}
        />
      )}
    </div>
  );
};
