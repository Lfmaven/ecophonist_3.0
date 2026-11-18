import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Copy,
  Download,
  Share2,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

export type AcousticFilterId =
  | 'sonar_ciano'
  | 'palanca_dourada'
  | 'tempestade_kwanza'
  | 'neblina_namibe'
  | 'negativo_acustico';

interface AcousticFilterDef {
  id: AcousticFilterId;
  name: string;
  subtitle: string;
  accent: string;
}

const ACOUSTIC_FILTERS: AcousticFilterDef[] = [
  {
    id: 'sonar_ciano',
    name: 'Sonar Abissal',
    subtitle: 'Varredura ciano com anéis harmônicos e linhas de frequência',
    accent: '#22D3EE',
  },
  {
    id: 'palanca_dourada',
    name: 'Ressonância da Palanca',
    subtitle: 'Ouro e turquesa com ondas sagradas da kissange',
    accent: '#FBBF24',
  },
  {
    id: 'tempestade_kwanza',
    name: 'Tempestade do Kwanza',
    subtitle: 'Alto contraste estilizado com chuva diagonal e brilho elétrico',
    accent: '#60A5FA',
  },
  {
    id: 'neblina_namibe',
    name: 'Espectro do Namibe',
    subtitle: 'Duotone areia-neblina orientado pela direção real do vento',
    accent: '#F59E0B',
  },
  {
    id: 'negativo_acustico',
    name: 'Negativo Sísmico',
    subtitle: 'Estilo mangá invertido destacando silhuetas e ecos sonoros',
    accent: '#F43F5E',
  },
];

export interface AcousticCaptureSnapshot {
  sourceDataUrl: string;
  levelId: number;
  levelTitle: string;
  characterName: string;
  weatherLabel: string;
  windSpeedKmh: number;
  windDirectionLabel: string;
  windDirectionDeg: number;
  ambientVolume: number;
  currentNoiseDb: number;
  heartRateBpm: number;
  soundHarmony: number;
  crystalsCollected: number;
  crystalsTotal: number;
  diariesCollected: number;
  diariesTotal: number;
}

interface AcousticPhotoModalProps {
  snapshot: AcousticCaptureSnapshot;
  onClose: () => void;
}

export const AcousticPhotoModal: React.FC<AcousticPhotoModalProps> = ({ snapshot, onClose }) => {
  const [selectedFilter, setSelectedFilter] = useState<AcousticFilterId>('sonar_ciano');
  const [showSpectrum, setShowSpectrum] = useState(true);
  const [showEditorialCard, setShowEditorialCard] = useState(true);
  const [customCaption, setCustomCaption] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      sourceImgRef.current = img;
      setImgLoaded(true);
    };
    img.src = snapshot.sourceDataUrl;
  }, [snapshot.sourceDataUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 2600);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  const renderComposite = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const img = sourceImgRef.current;
    if (!canvas || !img) return;

    const w = 1280;
    const h = 720;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#05080F';
    ctx.fillRect(0, 0, w, h);

    // Fit captured gameplay canvas with cover framing
    const srcRatio = img.width / Math.max(1, img.height);
    const dstRatio = w / h;
    let drawW = w;
    let drawH = h;
    let offsetX = 0;
    let offsetY = 0;
    if (srcRatio > dstRatio) {
      drawH = h;
      drawW = h * srcRatio;
      offsetX = (w - drawW) / 2;
    } else {
      drawW = w;
      drawH = w / srcRatio;
      offsetY = (h - drawH) / 2;
    }

    // Apply stylized base filter pass
    ctx.save();
    if (selectedFilter === 'sonar_ciano') {
      ctx.filter = 'contrast(1.22) saturate(1.18) brightness(0.95)';
    } else if (selectedFilter === 'palanca_dourada') {
      ctx.filter = 'contrast(1.18) saturate(1.35) sepia(0.28) brightness(1.04)';
    } else if (selectedFilter === 'tempestade_kwanza') {
      ctx.filter = 'contrast(1.36) saturate(0.88) brightness(0.92)';
    } else if (selectedFilter === 'neblina_namibe') {
      ctx.filter = 'contrast(1.1) sepia(0.45) saturate(0.95) brightness(0.98)';
    } else if (selectedFilter === 'negativo_acustico') {
      ctx.filter = 'invert(0.92) hue-rotate(180deg) contrast(1.32) saturate(1.4)';
    }
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    ctx.restore();

    // Stylized acoustic post-processing overlays per filter
    ctx.save();
    if (selectedFilter === 'sonar_ciano') {
      // Subtle cyan atmospheric tint + CRT sonar scanlines
      ctx.fillStyle = 'rgba(8, 51, 68, 0.2)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
      for (let y = 0; y < h; y += 6) {
        ctx.fillRect(0, y, w, 1);
      }
      // Concentric harmonic radar arcs
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.24)';
      ctx.lineWidth = 1.4;
      for (const r of [120, 220, 330, 450]) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.48, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (selectedFilter === 'palanca_dourada') {
      // Golden & turquoise dual-halo vignette + kissange wave curves
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.48, 120, w * 0.5, h * 0.48, w * 0.68);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
      grad.addColorStop(0.6, 'rgba(251, 191, 36, 0.14)');
      grad.addColorStop(1, 'rgba(7, 9, 15, 0.58)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.34)';
      ctx.lineWidth = 1.6;
      for (let band = 0; band < 3; band++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 24) {
          const y =
            h * 0.5 +
            Math.sin(x * 0.012 + band * 1.1) * (24 + snapshot.ambientVolume * 0.45) +
            (band - 1) * 165;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (selectedFilter === 'tempestade_kwanza') {
      // Storm diagonal rain streaks + electric edge glow
      ctx.fillStyle = 'rgba(14, 116, 144, 0.16)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.28)';
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 85; i++) {
        const rx = ((i * 173) % (w + 200)) - 100;
        const ry = ((i * 97) % (h + 120)) - 60;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 22, ry + 54);
        ctx.stroke();
      }
      // Manga speed accent lines at corners
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.36)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.5 + Math.cos(angle) * 480, h * 0.5 + Math.sin(angle) * 300);
        ctx.lineTo(w * 0.5 + Math.cos(angle) * 760, h * 0.5 + Math.sin(angle) * 520);
        ctx.stroke();
      }
    } else if (selectedFilter === 'neblina_namibe') {
      // Warm desert haze + directional wind shear lines matching windDirectionDeg
      const hazeGrad = ctx.createLinearGradient(0, 0, w, h);
      hazeGrad.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
      hazeGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.08)');
      hazeGrad.addColorStop(1, 'rgba(217, 119, 6, 0.22)');
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, 0, w, h);

      const rad = (snapshot.windDirectionDeg * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.26)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 38; i++) {
        const sx = (i * 199) % w;
        const sy = (i * 131) % h;
        const len = 45 + (snapshot.windSpeedKmh / 65) * 90;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + dx * len, sy + dy * len);
        ctx.stroke();
      }
    } else if (selectedFilter === 'negativo_acustico') {
      // Inverted seismic graphic rings & crisp border lines
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 8]);
      for (const r of [160, 290, 420]) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Subtle universal film vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, w * 0.65);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(4,6,12,0.52)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Live Acoustic Frequency Spectrum & Sonar Reticle overlay
    if (showSpectrum) {
      ctx.save();
      const accentColor =
        ACOUSTIC_FILTERS.find((f) => f.id === selectedFilter)?.accent ?? '#22D3EE';

      // Top-right wind & BPM readout badge (clean ink style)
      ctx.fillStyle = 'rgba(7, 10, 18, 0.76)';
      ctx.fillRect(w - 284, 24, 260, 62);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(w - 284, 24, 260, 62);

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(
        `SONAR ${snapshot.ambientVolume}% · ${snapshot.currentNoiseDb} dB · ${snapshot.heartRateBpm} BPM`,
        w - 270,
        47
      );
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(
        `VENTO ${snapshot.windSpeedKmh} km/h ${snapshot.windDirectionLabel} · ${snapshot.weatherLabel.toUpperCase()}`,
        w - 270,
        69
      );

      // Equalizer spectrum bars at bottom edge above editorial strip
      const barCount = 44;
      const barW = 8;
      const gap = 5;
      const startX = w - 24 - barCount * (barW + gap);
      const baseY = showEditorialCard ? h - 98 : h - 28;
      const energy = Math.max(0.22, snapshot.ambientVolume / 100);
      for (let i = 0; i < barCount; i++) {
        const wave =
          0.35 +
          0.65 *
            Math.abs(
              Math.sin(i * 0.42 + snapshot.currentNoiseDb * 0.1) *
                Math.cos(i * 0.19 + snapshot.soundHarmony * 0.05)
            );
        const barH = Math.round(8 + wave * energy * 48);
        ctx.fillStyle = i % 5 === 0 ? '#FBBF24' : accentColor;
        ctx.globalAlpha = 0.78;
        ctx.fillRect(startX + i * (barW + gap), baseY - barH, barW, barH);
      }
      ctx.restore();
    }

    // Expedition Editorial Stamp & Framing
    if (showEditorialCard) {
      ctx.save();
      const accentColor =
        ACOUSTIC_FILTERS.find((f) => f.id === selectedFilter)?.accent ?? '#22D3EE';

      // Crisp inner gallery frame
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(16, 16, w - 32, h - 32);

      // Bottom editorial banner
      ctx.fillStyle = 'rgba(7, 10, 18, 0.86)';
      ctx.fillRect(16, h - 84, w - 32, 68);
      ctx.fillStyle = accentColor;
      ctx.fillRect(16, h - 84, 5, 68);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '800 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('ECOPHONIST', 34, h - 52);

      ctx.fillStyle = accentColor;
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${snapshot.characterName} · ${snapshot.levelTitle}`, 182, h - 53);

      const subtitleLine = customCaption.trim()
        ? `"${customCaption.trim()}"`
        : `Harmonia ${snapshot.soundHarmony}% · Cristais ${snapshot.crystalsCollected}/${snapshot.crystalsTotal} · Diários ${snapshot.diariesCollected}/${snapshot.diariesTotal}`;
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillText(subtitleLine, 34, h - 29);

      const filterDef = ACOUSTIC_FILTERS.find((f) => f.id === selectedFilter);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(
        `FILTRO: ${(filterDef?.name ?? '').toUpperCase()} · INSPIRADO EM LFMAVEN`,
        w - 34,
        h - 30
      );
      ctx.restore();
    }
  }, [imgLoaded, selectedFilter, showSpectrum, showEditorialCard, customCaption, snapshot]);

  useEffect(() => {
    renderComposite();
  }, [renderComposite]);

  const handleDownloadPng = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecophonist-ato-${snapshot.levelId}-${selectedFilter}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setFeedbackMsg('Captura PNG salva no dispositivo.');
  };

  const handleCopyImage = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setFeedbackMsg('Imagem copiada para a área de transferência!');
        return;
      }
      throw new Error('Clipboard image unavailable');
    } catch {
      const summary = `Ecophonist · ${snapshot.characterName} no ${snapshot.levelTitle} | Clima: ${snapshot.weatherLabel} (${snapshot.windSpeedKmh} km/h) | Harmonia: ${snapshot.soundHarmony}% | Cristais: ${snapshot.crystalsCollected}/${snapshot.crystalsTotal}`;
      await navigator.clipboard?.writeText(summary).catch(() => {});
      setFeedbackMsg('Resumo da descoberta copiado (use Baixar PNG para a imagem).');
    }
  };

  const handleNativeShare = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const shareText = `Minha descoberta em Ecophonist (${snapshot.levelTitle}) com ${snapshot.characterName}: Harmonia Sonora ${snapshot.soundHarmony}% sob ${snapshot.weatherLabel}!`;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob && navigator.share) {
        const file = new File([blob], `ecophonist-ato-${snapshot.levelId}.png`, {
          type: 'image/png',
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Ecophonist · Captura Sonora',
            text: shareText,
            files: [file],
          });
          setFeedbackMsg('Compartilhamento concluído!');
          return;
        }
        await navigator.share({
          title: 'Ecophonist · Captura Sonora',
          text: shareText,
        });
        setFeedbackMsg('Descoberta compartilhada!');
        return;
      }
    } catch {
      // User cancelled or Web Share unsupported; fall through to copy
    }
    await navigator.clipboard?.writeText(shareText).catch(() => {});
    setFeedbackMsg('Texto de compartilhamento copiado! Baixe o PNG para anexar.');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05070C]/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-mode-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-w-5xl w-full bg-[#0C1220] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2
              id="photo-mode-title"
              className="font-display text-2xl font-extrabold text-white flex items-center gap-2.5"
            >
              <Camera className="w-5 h-5 text-cyan-300" />
              Modo Captura Sonora
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Aplique filtros sonoros visuais à sua descoberta e compartilhe com outros exploradores
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Modo Captura Sonora"
            className="p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Studio Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Preview Canvas */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="relative rounded-xl overflow-hidden border border-slate-700/90 bg-[#05080F] aspect-video">
              <canvas
                ref={previewCanvasRef}
                width={1280}
                height={720}
                className="w-full h-full block object-contain"
              />
            </div>

            {/* Action & Share Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="py-2.5 px-4 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 hover:bg-cyan-300 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar PNG
                </button>
                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="py-2.5 px-4 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-semibold text-xs flex items-center gap-2 hover:border-cyan-400 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-cyan-300" />
                  Copiar
                </button>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2.5 px-4 rounded-lg bg-slate-900 border border-amber-500/50 text-amber-200 font-semibold text-xs flex items-center gap-2 hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-amber-300" />
                  Compartilhar
                </button>
              </div>

              {feedbackMsg && (
                <span className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {feedbackMsg}
                </span>
              )}
            </div>
          </div>

          {/* Filter & Overlay Controls */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Filtros Sonoros Visuais
              </div>
              <div className="space-y-2">
                {ACOUSTIC_FILTERS.map((f) => {
                  const active = selectedFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFilter(f.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        active
                          ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400/40'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white">{f.name}</span>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: f.accent }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{f.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Camadas da Captura
              </div>

              <label className="flex items-center justify-between gap-3 text-xs text-slate-200 cursor-pointer">
                <span>Espectro & Telemetria Sonora</span>
                <input
                  type="checkbox"
                  checked={showSpectrum}
                  onChange={(e) => setShowSpectrum(e.target.checked)}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 text-xs text-slate-200 cursor-pointer">
                <span>Cartão Editorial da Expedição</span>
                <input
                  type="checkbox"
                  checked={showEditorialCard}
                  onChange={(e) => setShowEditorialCard(e.target.checked)}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </label>

              <div className="space-y-1.5 pt-1">
                <label htmlFor="photo-caption-input" className="block text-xs text-slate-400">
                  Legenda da Descoberta (opcional)
                </label>
                <input
                  id="photo-caption-input"
                  type="text"
                  maxLength={70}
                  value={customCaption}
                  onChange={(e) => setCustomCaption(e.target.value)}
                  placeholder="Ex.: Silêncio absoluto sob neblina no Namibe"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
