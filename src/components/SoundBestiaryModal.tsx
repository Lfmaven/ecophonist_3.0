import React, { useEffect, useRef, useState } from 'react';
import { Volume2, X, Ear, ShieldAlert, Radio } from 'lucide-react';
import { BESTIARY_ENTRIES, BestiaryEntry } from '../game/bestiary';
import { soundEngine } from '../game/soundEngine';

interface SoundBestiaryModalProps {
  onClose: () => void;
}

export const SoundBestiaryModal: React.FC<SoundBestiaryModalProps> = ({ onClose }) => {
  const [selectedId, setSelectedId] = useState<BestiaryEntry['id']>('stalker');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [pulseBoost, setPulseBoost] = useState(0);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const boostRef = useRef(0);

  const entry = BESTIARY_ENTRIES.find((item) => item.id === selectedId) ?? BESTIARY_ENTRIES[0];

  useEffect(() => {
    boostRef.current = pulseBoost;
  }, [pulseBoost]);

  const handlePreviewSound = () => {
    soundEngine.unlock();
    if (entry.id === 'weavers') {
      soundEngine.playBirdFlock();
    } else {
      soundEngine.playEnemySonar(entry.id, true);
    }
    setPulseBoost(1);
  };

  // Decay visual boost when previewing creature sonar
  useEffect(() => {
    if (pulseBoost <= 0) return;
    const timer = window.setTimeout(() => setPulseBoost(0), 650);
    return () => window.clearTimeout(timer);
  }, [pulseBoost]);

  // Animated acoustic signature waveform canvas
  useEffect(() => {
    let rafId = 0;
    let phase = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      phase += dt * entry.soundSignature.baseFreq * 2.4;

      const canvas = waveCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Center axis
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();

          const boost = boostRef.current > 0 ? 1.38 : 1.0;
          const amp = (h * 0.34) * boost;

          ctx.strokeStyle = entry.accentColor;
          ctx.lineWidth = 2.2;
          ctx.beginPath();

          for (let x = 0; x <= w; x += 2) {
            const norm = x / w;
            const t = norm * Math.PI * 2 * entry.soundSignature.harmonics + phase;
            const envelope = Math.sin(norm * Math.PI);
            let yOffset = 0;

            if (entry.soundSignature.waveType === 'sawtooth') {
              const saw = 2 * ((t / (Math.PI * 2)) - Math.floor(0.5 + t / (Math.PI * 2)));
              yOffset = saw * amp * envelope;
            } else if (entry.soundSignature.waveType === 'triangle') {
              const tri = 2 * Math.abs(2 * ((t / (Math.PI * 2)) - Math.floor(t / (Math.PI * 2) + 0.5))) - 1;
              yOffset = tri * amp * envelope;
            } else if (entry.soundSignature.waveType === 'chorus') {
              yOffset =
                (Math.sin(t * 2.2) * 0.5 +
                  Math.sin(t * 3.7 + 1.1) * 0.35 +
                  Math.cos(t * 5.3) * 0.25) *
                amp *
                envelope;
            } else {
              yOffset = (Math.sin(t) * 0.72 + Math.sin(t * 2.1) * 0.28) * amp * envelope;
            }

            const y = h / 2 - yOffset;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(rafId);
  }, [entry]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05070C]/88 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bestiary-title"
    >
      <div className="max-w-5xl w-full bg-[#0C1220] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 id="bestiary-title" className="font-display text-2xl font-extrabold text-white">
              Bestiário Sonoro
            </h2>
            <p className="text-xs text-slate-400">
              Catálogo acústico das criaturas cegas e espécies reativas de Angola
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Bestiário Sonoro"
            className="p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Creature Selector List */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {BESTIARY_ENTRIES.map((item) => {
              const active = item.id === entry.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    active
                      ? 'bg-slate-900 border-cyan-400'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold text-white truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {item.soundSignature.frequencyHz} · {item.soundSignature.waveform}
                    </p>
                    <p
                      className="text-xs font-medium mt-1"
                      style={{ color: item.accentColor }}
                    >
                      {item.threatLabel}
                    </p>
                  </div>
                  <Radio
                    className="w-4 h-4 shrink-0"
                    style={{ color: active ? item.accentColor : '#64748B' }}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Detailed Acoustic Profile */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              <div className="md:col-span-6 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[210px]">
                {!imageErrors[entry.id] ? (
                  <img
                    src={entry.artwork}
                    alt={`${entry.name} — ilustração enfatizando sua assinatura sonora`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setImageErrors((prev) => ({ ...prev, [entry.id]: true }))
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full min-h-[210px] bg-gradient-to-br from-slate-900 via-[#07090F] to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <Ear className="w-10 h-10 mb-2" style={{ color: entry.accentColor }} />
                    <p className="font-display text-xl font-bold text-white">{entry.name}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1220] via-transparent to-transparent" />
              </div>

              <div className="md:col-span-6 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{entry.classification}</span>
                    <span aria-hidden="true">·</span>
                    <span>{entry.actsFound}</span>
                  </div>
                  <h3 className="font-display text-3xl font-extrabold text-white leading-tight">
                    {entry.name}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{entry.ecologySummary}</p>
                </div>

                {/* Live Acoustic Signature Waveform & Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-200">
                      Assinatura: {entry.soundSignature.waveform}
                    </span>
                    <button
                      type="button"
                      onClick={handlePreviewSound}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Ouvir Sonar
                    </button>
                  </div>
                  <canvas
                    ref={waveCanvasRef}
                    width={320}
                    height={56}
                    className="w-full h-14 rounded-lg bg-[#070A12] border border-slate-800/90"
                  />
                </div>
              </div>
            </div>

            {/* Acoustic Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 font-mono-tabular">
              <div>
                <p className="text-[11px] font-sans text-slate-400">Frequência</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {entry.soundSignature.frequencyHz}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-sans text-slate-400">Alcance Auditivo</p>
                <p className="text-sm font-bold text-cyan-300 mt-0.5">
                  {entry.soundSignature.hearingRadius}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-sans text-slate-400">Cadência / Pulso</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">
                  {entry.soundSignature.cadenceSec}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-sans text-slate-400">Velocidade Caçada</p>
                <p className="text-sm font-bold text-amber-300 mt-0.5">
                  {entry.soundSignature.speedHunt}
                </p>
              </div>
            </div>

            {/* Behavior & Counter-Tactics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-white">Comportamento Acústico</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{entry.acousticBehavior}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Contramedidas de Sobrevivência
                </h4>
                <ul className="space-y-1.5 text-sm text-slate-300">
                  {entry.survivalTactics.map((tip, idx) => (
                    <li key={idx} className="leading-snug">
                      · {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
