import React from 'react';
import { Award, Check, CircleDot, CloudRain, EarOff, Lock, Sparkles, Wind, X } from 'lucide-react';
import { SOUND_RECORDS } from '../game/records';
import { SoundRecordDef, SoundRecordId } from '../game/types';

interface SoundRecordsModalProps {
  unlockedRecords: SoundRecordId[];
  onClose: () => void;
}

function renderRecordIcon(iconName: SoundRecordDef['iconName'], color: string) {
  const cls = 'w-6 h-6';
  switch (iconName) {
    case 'earOff':
      return <EarOff className={cls} style={{ color }} />;
    case 'sparkles':
      return <Sparkles className={cls} style={{ color }} />;
    case 'wind':
      return <Wind className={cls} style={{ color }} />;
    case 'cloudRain':
      return <CloudRain className={cls} style={{ color }} />;
    case 'circleDot':
      return <CircleDot className={cls} style={{ color }} />;
    default:
      return <Award className={cls} style={{ color }} />;
  }
}

export const SoundRecordsModal: React.FC<SoundRecordsModalProps> = ({
  unlockedRecords,
  onClose,
}) => {
  const unlockedCount = unlockedRecords.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05070C]/88 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="records-modal-title"
    >
      <div className="max-w-4xl w-full bg-[#0C1220] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 id="records-modal-title" className="font-display text-2xl font-extrabold text-white">
              Registros Sonoros · Emblemas & Passivos
            </h2>
            <p className="text-xs text-slate-400 font-mono-tabular mt-0.5">
              {unlockedCount}/{SOUND_RECORDS.length} emblemas desbloqueados · Todas as recompensas são
              permanentes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Registros Sonoros"
            className="p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Emblems Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOUND_RECORDS.map((rec) => {
            const isUnlocked = unlockedRecords.includes(rec.id);
            const iconColor = isUnlocked ? rec.accentColor : '#64748B';

            return (
              <div
                key={rec.id}
                className={`p-5 rounded-xl border flex gap-4 items-start transition-colors ${
                  isUnlocked
                    ? 'bg-slate-900/90 border-slate-700'
                    : 'bg-slate-900/40 border-slate-800/70 opacity-75'
                }`}
              >
                {/* Vector Emblem Medallion */}
                <div
                  className="w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 relative"
                  style={{
                    borderColor: isUnlocked ? rec.accentColor : '#334155',
                    backgroundColor: isUnlocked ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.5)',
                  }}
                >
                  {renderRecordIcon(rec.iconName, iconColor)}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-bold text-white truncate">
                      {rec.title}
                    </h3>
                    {isUnlocked ? (
                      <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1 whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        Conquistado
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 flex items-center gap-1 whitespace-nowrap shrink-0">
                        <Lock className="w-3.5 h-3.5" />
                        Bloqueado
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-300 leading-snug">{rec.condition}</p>

                  <div className="pt-2 border-t border-slate-800/80 space-y-0.5">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: isUnlocked ? rec.accentColor : '#94A3B8' }}
                    >
                      {rec.rewardLabel}
                    </p>
                    <p className="text-xs text-slate-400">{rec.passiveBonus}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
