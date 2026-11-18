import React, { useState } from 'react';
import { X, Sliders, ShoppingBag, Check, Mic, Volume2, Sparkles } from 'lucide-react';
import { STORE_ITEMS } from '../game/storage';
import { GameSettings, StoreItemId } from '../game/types';

interface SettingsStoreModalProps {
  initialTab?: 'settings' | 'store';
  settings: GameSettings;
  echoShards: number;
  ownedItems: StoreItemId[];
  equippedItems: StoreItemId[];
  onUpdateSettings: (next: GameSettings) => Promise<void> | void;
  onBuyWithShards: (itemId: StoreItemId) => void;
  onToggleEquip: (itemId: StoreItemId) => void;
  onClose: () => void;
}

export const SettingsStoreModal: React.FC<SettingsStoreModalProps> = ({
  initialTab = 'settings',
  settings,
  echoShards,
  ownedItems,
  equippedItems,
  onUpdateSettings,
  onBuyWithShards,
  onToggleEquip,
  onClose,
}) => {
  const [tab, setTab] = useState<'settings' | 'store'>(initialTab);
  const [micStatus, setMicStatus] = useState<string | null>(null);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);

  const handleToggleMic = async () => {
    setMicStatus(null);
    const nextMic = !settings.useMicAmbient;
    if (nextMic) {
      try {
        await onUpdateSettings({ ...settings, useMicAmbient: true });
        setMicStatus('Microfone ambiente conectado ao Sonar Visual.');
      } catch {
        setMicStatus('Permissão de microfone indisponível; usando áudio simulado.');
      }
    } else {
      await onUpdateSettings({ ...settings, useMicAmbient: false });
      setMicStatus('Usando apenas acústica simulada do ambiente.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05070C]/85 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Configurações e Arsenal de Ressonância"
    >
      <div className="max-w-2xl w-full bg-[#0C111E] border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setTab('settings')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'settings'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Configurações
            </button>
            <button
              type="button"
              onClick={() => setTab('store')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'store'
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Arsenal Gratuito (0 Kz)
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-emerald-300 font-mono-tabular whitespace-nowrap">
              Fragmentos: {echoShards}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {tab === 'settings' && (
            <div className="space-y-6">
              {/* Volume Mestre */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="master-vol" className="font-medium text-slate-200 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    Volume Mestre dos Efeitos
                  </label>
                  <span className="font-mono-tabular text-xs text-cyan-300">
                    {settings.muted ? 'Silenciado' : `${Math.round(settings.masterVolume * 100)}%`}
                  </span>
                </div>
                <input
                  id="master-vol"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(settings.masterVolume * 100)}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      masterVolume: Number(e.target.value) / 100,
                      muted: Number(e.target.value) === 0,
                    })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Sensibilidade do Sonar Visual */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">
                  Sensibilidade do Sonar Visual (Ondas Concêntricas)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['baixa', 'normal', 'alta'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, sonarSensitivity: level })}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-colors cursor-pointer ${
                        settings.sonarSensitivity === level
                          ? 'bg-cyan-400/15 border-cyan-400 text-cyan-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dificuldade Acústica */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">Rigor Auditivo dos Predadores</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, difficulty: 'padrao' })}
                    className={`py-2.5 px-4 rounded-lg border text-xs font-semibold text-left transition-colors cursor-pointer ${
                      settings.difficulty === 'padrao'
                        ? 'bg-emerald-400/15 border-emerald-400 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Padrão · Alcance equilibrado
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, difficulty: 'implacavel' })}
                    className={`py-2.5 px-4 rounded-lg border text-xs font-semibold text-left transition-colors cursor-pointer ${
                      settings.difficulty === 'implacavel'
                        ? 'bg-rose-400/15 border-rose-400 text-rose-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Implacável · +22% audição e velocidade
                  </button>
                </div>
              </div>

              {/* Microfone Ambiente & Movimento Reduzido */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      <Mic className="w-4 h-4 text-amber-300" />
                      Sonar Reativo ao Microfone Real
                    </p>
                    <p className="text-xs text-slate-400">
                      Opcional: usa o volume real da sua sala para pulsar o Sonar Visual no canvas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`px-4 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                      settings.useMicAmbient
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {settings.useMicAmbient ? 'Ativado' : 'Ativar Microfone'}
                  </button>
                </div>
                {micStatus && <p className="text-xs text-cyan-300">{micStatus}</p>}

                <div className="flex items-center justify-between gap-4 pt-2">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Efeitos Visuais Reduzidos</p>
                    <p className="text-xs text-slate-400">
                      Diminui a densidade de anéis do sonar para máximo conforto visual.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, reducedEffects: !settings.reducedEffects })
                    }
                    className={`px-4 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                      settings.reducedEffects
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {settings.reducedEffects ? 'Reduzido' : 'Completo'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'store' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  Todas as ferramentas são 100% grátis (0 Kz), mas exigem batalhar em missão:
                  conquiste Fragmentos de Eco vencendo atos, coletando cristais, Diários Sonoros
                  e mantendo Harmonia Sonora.
                </span>
                {purchaseNotice && (
                  <span className="text-emerald-300 font-medium">{purchaseNotice}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {STORE_ITEMS.map((item) => {
                  const owned = ownedItems.includes(item.id);
                  const equipped = equippedItems.includes(item.id);
                  const canAffordShards = echoShards >= item.shardCost;
                  const missing = Math.max(0, item.shardCost - echoShards);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${
                        equipped
                          ? 'bg-slate-900 border-amber-400/70'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                          <span>{item.category}</span>
                          <span className="font-mono-tabular text-emerald-300">
                            {owned ? 'Conquistado' : `0 Kz · Requer ${item.shardCost} frag.`}
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
                          {item.id === 'golden_tuning' && (
                            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                          )}
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                      </div>

                      {owned ? (
                        <button
                          type="button"
                          onClick={() => onToggleEquip(item.id)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            equipped
                              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          }`}
                        >
                          {equipped && <Check className="w-3.5 h-3.5" />}
                          {equipped ? 'Equipado' : 'Equipar Ferramenta'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAffordShards}
                          onClick={() => {
                            onBuyWithShards(item.id);
                            setPurchaseNotice(`${item.name} conquistada com Fragmentos de Eco!`);
                          }}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold font-mono-tabular transition-colors ${
                            canAffordShards
                              ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 hover:bg-emerald-500/30 cursor-pointer'
                              : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {canAffordShards
                            ? `Desbloquear Grátis (${item.shardCost} Frag.)`
                            : `Batalhe por mais ${missing} Frag. (${echoShards}/${item.shardCost})`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#080B14] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>Conceito inspirado em códigos de referência Lfmaven</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-100 font-medium hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
