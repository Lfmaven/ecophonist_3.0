import React, { useEffect, useRef, useState } from 'react';
import { CloudFog, CloudRain, Ear, Radio, Wind } from 'lucide-react';
import { getCharacterById } from '../game/characters';
import { soundEngine } from '../game/soundEngine';
import { CharacterId, LevelConfig } from '../game/types';

interface EcologyTheme {
  biomeLabel: string;
  tuningStatus: string;
  colors: [string, string, string];
  colorLabels: [string, string, string];
  waveFrequency: number;
  waveSpeed: number;
  windBias: string;
  ecologyTags: string[];
  tacticalTip: string;
  icon: 'wind' | 'fog' | 'storm';
}

const ECOLOGY_THEMES: Record<number, EcologyTheme> = {
  1: {
    biomeLabel: 'Ecologia Sonora · Floresta do Maiombe',
    tuningStatus: 'Sintonizando brisa nos imbondeiros e passos camuflados...',
    colors: ['#34D399', '#22D3EE', '#6EE7B7'],
    colorLabels: ['Brisa dos Imbondeiros', 'Sonar Eco Ciano', 'Vento Cacimbo'],
    waveFrequency: 0.016,
    waveSpeed: 2.2,
    windBias: 'Brisa Suave · Atenuação Baixa/Média',
    ecologyTags: ['Imbondeiros Cantantes', 'Rastreadores Cegos', 'Vento Cacimbo'],
    tacticalTip:
      'Atravesse as clareiras enquanto os anéis verdes dos imbondeiros pulsam para abafar seus passos.',
    icon: 'wind',
  },
  2: {
    biomeLabel: 'Ecologia Sonora · Falésias do Miradouro da Lua',
    tuningStatus: 'Calibrando atenuação da Neblina do Namibe e bandos de tecelões...',
    colors: ['#FBBF24', '#F472B6', '#94A3B8'],
    colorLabels: ['Neblina do Namibe', 'Bando de Tecelões', 'Eco das Falésias'],
    waveFrequency: 0.022,
    waveSpeed: 2.9,
    windBias: 'Rajadas do Namibe · Deriva a Sotavento',
    ecologyTags: ['Neblina do Namibe', 'Sereia Ressonante', 'Colosso Tambor', 'Tecelões'],
    tacticalTip:
      'Evite correr perto de tecelões rosas e use [E] Sussurro na Folha para cruzar entre a Sereia e o Colosso.',
    icon: 'fog',
  },
  3: {
    biomeLabel: 'Ecologia Sonora · Fenda da Tundavala',
    tuningStatus: 'Sincronizando trovoadas do Kwanza e frequências de caçada...',
    colors: ['#38BDF8', '#A78BFA', '#F43F5E'],
    colorLabels: ['Tempestade do Kwanza', 'Trovoada da Huíla', 'Alerta Carmesim'],
    waveFrequency: 0.029,
    waveSpeed: 3.7,
    windBias: 'Vendaval & Tempestade · Máscara Acústica Alta',
    ecologyTags: ['Tempestade do Kwanza', 'Rajadas da Huíla', 'Vácuo Acústico [R]'],
    tacticalTip:
      'Aproveite a chuva torrencial para avançar rápido e ative [R] Canto do Silêncio em corredores fechados.',
    icon: 'storm',
  },
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

interface AcousticLoadingScreenProps {
  level: LevelConfig;
  characterId: CharacterId;
  reducedEffects: boolean;
  onComplete: () => void;
}

const LOAD_DURATION_MS = 1950;

export const AcousticLoadingScreen: React.FC<AcousticLoadingScreenProps> = ({
  level,
  characterId,
  reducedEffects,
  onComplete,
}) => {
  const theme = ECOLOGY_THEMES[level.id] ?? ECOLOGY_THEMES[1];
  const character = getCharacterById(characterId);
  const [progress, setProgress] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [portraitError, setPortraitError] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    soundEngine.playLevelTuningChord(level.id);
  }, [level.id]);

  useEffect(() => {
    let rafId = 0;
    const startMs = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startMs;
      const pct = Math.min(1, elapsed / LOAD_DURATION_MS);
      setProgress(Math.round(pct * 100));

      const nextPhase = pct < 0.34 ? 0 : pct < 0.68 ? 1 : 2;
      setPhaseIdx(nextPhase);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Blend between the 3 Ecology colors smoothly as sound waves propagate
          const cycle = (elapsed * 0.00085) % 3;
          const idxA = Math.floor(cycle) % 3;
          const idxB = (idxA + 1) % 3;
          const blendT = cycle - Math.floor(cycle);
          const primaryColor = lerpColor(theme.colors[idxA], theme.colors[idxB], blendT);
          const secondaryColor = lerpColor(
            theme.colors[(idxA + 1) % 3],
            theme.colors[(idxB + 1) % 3],
            blendT
          );

          // Soft radial ambient glow matching current ecology wave color
          const glow = ctx.createRadialGradient(w / 2, h / 2, 12, w / 2, h / 2, w * 0.42);
          glow.addColorStop(0, primaryColor.replace('rgb(', 'rgba(').replace(')', ', 0.22)'));
          glow.addColorStop(0.55, secondaryColor.replace('rgb(', 'rgba(').replace(')', ', 0.08)'));
          glow.addColorStop(1, 'rgba(7, 9, 15, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, w, h);

          // Concentric Sonar Ecology Rings
          const ringCount = reducedEffects ? 2 : 4;
          for (let rIdx = 0; rIdx < ringCount; rIdx++) {
            const ringProgress = ((elapsed * 0.00065 + rIdx / ringCount) % 1);
            const radius = 26 + ringProgress * (Math.min(w, h) * 0.44);
            ctx.save();
            ctx.globalAlpha = (1 - ringProgress) * 0.42;
            ctx.strokeStyle = rIdx % 2 === 0 ? primaryColor : secondaryColor;
            ctx.lineWidth = 1.6;
            if (level.id >= 2 && rIdx % 2 === 1) {
              ctx.setLineDash([10, 8]);
            }
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Multi-layer Dynamic Sound Waves colored by level's Ecologia Sonora
          const waveLayers = reducedEffects ? 2 : 4;
          const timeSec = elapsed * 0.001;
          for (let layer = 0; layer < waveLayers; layer++) {
            const amp = (14 + layer * 9) * (reducedEffects ? 0.65 : 1);
            const freq = theme.waveFrequency * (1 + layer * 0.38);
            const speed = theme.waveSpeed * (layer % 2 === 0 ? 1 : -0.82);
            const layerColor =
              layer % 2 === 0
                ? primaryColor
                : lerpColor(theme.colors[layer % 3], secondaryColor, 0.5);

            ctx.save();
            ctx.strokeStyle = layerColor;
            ctx.globalAlpha = 0.85 - layer * 0.17;
            ctx.lineWidth = layer === 0 ? 2.6 : 1.5;
            ctx.beginPath();

            for (let x = 0; x <= w; x += 6) {
              const env = Math.sin((x / w) * Math.PI); // Smooth tapered ends
              const modulation =
                Math.sin(x * freq + timeSec * speed + layer * 1.3) +
                0.42 * Math.cos(x * freq * 1.9 - timeSec * speed * 1.4);
              const y = h / 2 + modulation * amp * env;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      if (elapsed >= LOAD_DURATION_MS && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
        return;
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [level.id, reducedEffects, theme]);

  const activeColor = theme.colors[phaseIdx];

  return (
    <div
      className="h-screen w-full bg-[#07090F] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none"
      role="status"
      aria-live="polite"
      aria-label={`Carregando ${level.title}`}
    >
      <div className="max-w-3xl w-full space-y-6 relative z-10">
        {/* Top Ecology Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5 text-xs font-semibold tracking-wide">
            {theme.icon === 'storm' ? (
              <CloudRain className="w-4 h-4" style={{ color: activeColor }} />
            ) : theme.icon === 'fog' ? (
              <CloudFog className="w-4 h-4" style={{ color: activeColor }} />
            ) : (
              <Wind className="w-4 h-4" style={{ color: activeColor }} />
            )}
            <span style={{ color: activeColor }}>{theme.biomeLabel}</span>
          </div>
          <span className="text-xs text-slate-400 font-mono-tabular">{theme.windBias}</span>
        </div>

        {/* Title & Active Character */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {level.title}
            </h1>
            <p className="text-sm text-slate-300">{level.subtitle}</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/75 border border-slate-800 rounded-xl px-3.5 py-2.5 shrink-0">
            {!portraitError ? (
              <img
                src={character.portrait}
                alt={character.name}
                referrerPolicy="no-referrer"
                onError={() => setPortraitError(true)}
                className="w-10 h-10 rounded-lg object-cover border border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <Ear className="w-5 h-5 text-cyan-300" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-white leading-tight">{character.name}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{character.specialty}</p>
            </div>
          </div>
        </div>

        {/* Live Color-Shifting Sound Wave Canvas */}
        <div className="relative rounded-xl border border-slate-800/90 bg-[#05070D] overflow-hidden p-4">
          <canvas
            ref={canvasRef}
            width={760}
            height={190}
            className="w-full h-[170px] sm:h-[190px] block"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/70 text-xs">
            <span className="flex items-center gap-2 text-slate-200">
              <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: activeColor }} />
              {theme.tuningStatus}
            </span>
            <span className="font-mono-tabular font-semibold" style={{ color: activeColor }}>
              {theme.colorLabels[phaseIdx]} · {progress}%
            </span>
          </div>
        </div>

        {/* Dynamic Ecology Color Legend & Progress Bar */}
        <div className="space-y-3">
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${theme.colors[0]}, ${theme.colors[1]}, ${theme.colors[2]})`,
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              {theme.ecologyTags.map((tag, i) => (
                <span key={tag} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: theme.colors[i % 3] }}
                  />
                  <span>{tag}</span>
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                if (!completedRef.current) {
                  completedRef.current = true;
                  onComplete();
                }
              }}
              className="text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-4 cursor-pointer shrink-0"
            >
              Entrar agora
            </button>
          </div>
        </div>

        {/* Ecological Field Tip */}
        <p className="text-xs text-slate-300 bg-slate-900/60 border border-slate-800/80 rounded-lg px-4 py-3">
          <span className="font-semibold" style={{ color: activeColor }}>
            Ecologia Sonora do Nível:
          </span>{' '}
          {theme.tacticalTip}
        </p>
      </div>
    </div>
  );
};
