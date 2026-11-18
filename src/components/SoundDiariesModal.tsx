import React, { useEffect, useState } from 'react';
import { BookOpen, Disc3, Lock, Play, Square, X } from 'lucide-react';
import { SOUND_DIARIES } from '../game/diaries';
import { soundEngine } from '../game/soundEngine';
import { SoundDiaryDef, SoundDiaryId } from '../game/types';

interface SoundDiariesModalProps {
  collectedDiaries: SoundDiaryId[];
  onClose: () => void;
}

export const SoundDiariesModal: React.FC<SoundDiariesModalProps> = ({
  collectedDiaries,
  onClose,
}) => {
  const [playingId, setPlayingId] = useState<SoundDiaryId | null>(null);

  useEffect(() => {
    return () => {
      soundEngine.stopDiaryNarration();
    };
  }, []);

  useEffect(() => {
    if (!playingId) return;
    const diary = SOUND_DIARIES.find((d) => d.id === playingId);
    const ms = (diary?.durationSec ?? 10) * 1000;
    const timer = window.setTimeout(() => {
      setPlayingId((curr) => (curr === playingId ? null : curr));
    }, ms);
    return () => window.clearTimeout(timer);
  }, [playingId]);

  const handleTogglePlay = (diary: SoundDiaryDef) => {
    soundEngine.unlock();
    if (playingId === diary.id) {
      soundEngine.stopDiaryNarration();
      setPlayingId(null);
      return;
    }
    setPlayingId(diary.id);
    soundEngine.playDiaryNarrationAudio(diary);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05070C]/88 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diaries-modal-title"
    >
      <div className="max-w-4xl w-full bg-[#0C1220] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 id="diaries-modal-title" className="font-display text-2xl font-extrabold text-white">
              Diários Sonoros · Memórias de Nzinga & Angola
            </h2>
            <p className="text-xs text-slate-400 font-mono-tabular mt-0.5">
              {collectedDiaries.length}/{SOUND_DIARIES.length} gravações recuperadas no terreno ·
              Cada diário descoberto concede +1 Fragmento de Eco
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.stopDiaryNarration();
              onClose();
            }}
            aria-label="Fechar Diários Sonoros"
            className="p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diary Cards */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOUND_DIARIES.map((diary) => {
            const unlocked = collectedDiaries.includes(diary.id);
            const isPlaying = playingId === diary.id;

            return (
              <div
                key={diary.id}
                className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-colors ${
                  unlocked
                    ? 'bg-slate-900/90 border-slate-700'
                    : 'bg-slate-900/40 border-slate-800/70 opacity-75'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 font-mono-tabular">
                      Ato {diary.levelId} · {diary.chapter}
                    </span>
                    {unlocked ? (
                      <span
                        className="font-semibold flex items-center gap-1 whitespace-nowrap"
                        style={{ color: diary.accentColor }}
                      >
                        <Disc3 className="w-3.5 h-3.5" />
                        Recuperado
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1 whitespace-nowrap">
                        <Lock className="w-3.5 h-3.5" />
                        Oculto no Ato {diary.levelId}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen
                      className="w-4 h-4 shrink-0"
                      style={{ color: unlocked ? diary.accentColor : '#64748B' }}
                    />
                    <span>{diary.title}</span>
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {unlocked
                      ? diary.transcript
                      : `Siga os ecos turquesa e dourados espalhados pelo Ato ${diary.levelId} para recuperar esta gravação ambiental.`}
                  </p>
                </div>

                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => handleTogglePlay(diary)}
                    className={`w-full py-2 px-4 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isPlaying
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                        : 'bg-slate-800 text-slate-100 border-slate-700 hover:border-cyan-400/70'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        Parar Narração ({diary.durationSec}s)
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Ouvir Diário Sonoro ({diary.durationSec}s)
                      </>
                    )}
                  </button>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-500">
                    Recompensa ao encontrar: +1 Fragmento de Eco + Registro de Voz
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
