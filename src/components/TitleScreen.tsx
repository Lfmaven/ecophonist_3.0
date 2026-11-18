import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Lock,
  Check,
  Ear,
  Wind,
  Sparkles,
  Sliders,
  ShoppingBag,
  Radio,
  Award,
  BookOpen,
  BookMarked,
} from 'lucide-react';
import { CHARACTERS, getCharacterById } from '../game/characters';
import { SOUND_DIARIES } from '../game/diaries';
import { LEVELS } from '../game/levels';
import { SOUND_RECORDS } from '../game/records';
import { CharacterId, SaveProgress } from '../game/types';

interface TitleScreenProps {
  progress: SaveProgress;
  selectedLevelId: number;
  selectedCharacter: CharacterId;
  onSelectLevel: (id: number) => void;
  onSelectCharacter: (id: CharacterId) => void;
  onStartGame: (levelId: number) => void;
  muted: boolean;
  onToggleMute: () => void;
  onOpenSettings: (tab: 'settings' | 'store') => void;
  onOpenBestiary: () => void;
  onOpenRecords: () => void;
  onOpenDiaries: () => void;
  onOpenManual: (tab?: 'story' | 'manual') => void;
}

const HERO_IMG = '/src/assets/images/hero_nzinga_palanca_1794990072635.jpg';

export const TitleScreen: React.FC<TitleScreenProps> = ({
  progress,
  selectedLevelId,
  selectedCharacter,
  onSelectLevel,
  onSelectCharacter,
  onStartGame,
  muted,
  onToggleMute,
  onOpenSettings,
  onOpenBestiary,
  onOpenRecords,
  onOpenDiaries,
  onOpenManual,
}) => {
  const [heroError, setHeroError] = useState(false);
  const [portraitErrors, setPortraitErrors] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'campaign' | 'mechanics' | 'ecology'>('campaign');

  const selectedLevel = LEVELS.find((l) => l.id === selectedLevelId) ?? LEVELS[0];
  const activeChar = getCharacterById(selectedCharacter);

  const handlePortraitError = (id: string) => {
    setPortraitErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="min-h-screen bg-[#07090F] text-slate-100 flex flex-col">
      {/* Top Bar Contract: Brand — Nav Links — 1 Primary Action */}
      <header className="w-full border-b border-slate-800/80 bg-[#07090F]/95">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <span className="font-display text-2xl font-extrabold tracking-wide text-slate-50 whitespace-nowrap shrink-0">
            ECOPHONIST
          </span>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab('campaign')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'campaign'
                  ? 'text-cyan-300 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-100'
              }`}
            >
              Elenco & Atos
            </button>
            <button
              type="button"
              onClick={onOpenBestiary}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-rose-300 cursor-pointer flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              Bestiário
            </button>
            <button
              type="button"
              onClick={onOpenRecords}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-emerald-300 cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              Registros ({progress.unlockedRecords.length}/{SOUND_RECORDS.length})
            </button>
            <button
              type="button"
              onClick={() => onOpenSettings('store')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-amber-300 cursor-pointer flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Arsenal ({progress.echoShards})
            </button>
            <button
              type="button"
              onClick={() => onOpenSettings('settings')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              Configurações
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Ativar áudio' : 'Silenciar áudio'}
              className="p-2.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => onStartGame(selectedLevel.id)}
              className="px-5 py-2.5 bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Iniciar Missão
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-10">
        {/* Hero Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-between gap-6 py-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-cyan-300 font-medium tracking-wide">
                <span>Stealth Acústico</span>
                <span aria-hidden="true">·</span>
                <span>Angola Pós-Silêncio</span>
                <span aria-hidden="true">·</span>
                <span>5 Personagens</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.05] text-balance">
                Veja o som. Controle o silêncio. Sobreviva ao escuro.
              </h1>

              <p className="text-slate-300 text-base leading-relaxed">
                Lidere Nzinga e sua equipa angolana — incluindo a lendária Palanca Negra Kimbamba
                — do Maiombe à Tundavala. Sincronize passos com tempestades e neblinas para
                escapar de predadores cegos.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-slate-800/80">
              {!portraitErrors[activeChar.id] ? (
                <img
                  src={activeChar.portrait}
                  alt={`Retrato de ${activeChar.name}`}
                  referrerPolicy="no-referrer"
                  onError={() => handlePortraitError(activeChar.id)}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                  <Ear className="w-7 h-7 text-cyan-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {activeChar.name} · {activeChar.specialty}
                </p>
                <p className="text-xs text-cyan-300 truncate">{activeChar.archetype}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{selectedLevel.title}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[280px]">
            {!heroError ? (
              <img
                src={HERO_IMG}
                alt="Nzinga, protagonista angolana, ao lado da Palanca Negra Gigante iluminando a noite com ondas sonoras"
                referrerPolicy="no-referrer"
                onError={() => setHeroError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full min-h-[280px] bg-gradient-to-br from-slate-900 via-[#07090F] to-cyan-950/40 flex flex-col items-center justify-center p-8 text-center">
                <Ear className="w-12 h-12 text-cyan-400 mb-3" />
                <p className="font-display text-2xl font-bold text-white">ECOPHONIST</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090F] via-[#07090F]/20 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-200 max-w-md">
                Controles: WASD ou Setas para mover · Shift para correr · C para agachar · Espaço
                para segurar o fôlego · Clique ou Q para jogar pedra
              </div>
              <button
                type="button"
                onClick={() => onStartGame(selectedLevel.id)}
                className="px-6 py-3 bg-amber-400 text-slate-950 font-bold text-sm rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Jogar com {activeChar.name}
              </button>
            </div>
          </div>
        </section>

        {/* Sub-Navigation Section Tabs + Diários Sonoros Archive Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 max-w-md w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('campaign')}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'campaign' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Elenco & Atos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mechanics')}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'mechanics' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Habilidades
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ecology')}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ecology' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ecologia & Clima
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenManual('story')}
              className="py-2 px-4 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-2 hover:border-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookMarked className="w-3.5 h-3.5 text-amber-300" />
              História & Manual
            </button>
            <button
              type="button"
              onClick={onOpenDiaries}
              className="py-2 px-4 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-2 hover:border-cyan-400 transition-colors cursor-pointer whitespace-nowrap font-mono-tabular"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
              Diários Sonoros ({progress.collectedDiaries.length}/{SOUND_DIARIES.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:hidden gap-2">
          <button
            type="button"
            onClick={onOpenBestiary}
            className="py-2 px-3 rounded-lg bg-slate-900 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Radio className="w-3.5 h-3.5" />
            Bestiário
          </button>
          <button
            type="button"
            onClick={onOpenRecords}
            className="py-2 px-3 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Award className="w-3.5 h-3.5" />
            Registros ({progress.unlockedRecords.length}/{SOUND_RECORDS.length})
          </button>
          <button
            type="button"
            onClick={onOpenDiaries}
            className="py-2 px-3 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Diários ({progress.collectedDiaries.length}/{SOUND_DIARIES.length})
          </button>
          <button
            type="button"
            onClick={() => onOpenSettings('store')}
            className="py-2 px-3 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Arsenal ({progress.echoShards})
          </button>
          <button
            type="button"
            onClick={() => onOpenManual('story')}
            className="py-2 px-3 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <BookMarked className="w-3.5 h-3.5" />
            História & Manual
          </button>
          <button
            type="button"
            onClick={() => onOpenSettings('settings')}
            className="py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5" />
            Configurações
          </button>
        </div>

        {/* Lower Section Content */}
        {activeTab === 'campaign' && (
          <div className="space-y-10">
            {/* 5-Character Angolan Cast Selector */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl font-bold text-white">
                  01. Elenco da Expedição Angolana
                </h2>
                <span className="text-xs text-slate-400">
                  Protagonista Nzinga · 2 Aliadas · 1 Aliado · 1 Palanca Negra
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {CHARACTERS.map((char) => {
                  const isSelected = char.id === selectedCharacter;
                  const imgFailed = portraitErrors[char.id];

                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => onSelectCharacter(char.id)}
                      className={`text-left rounded-xl border p-3.5 transition-all flex flex-col gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                        {!imgFailed ? (
                          <img
                            src={char.portrait}
                            alt={`${char.name} — ${char.archetype}`}
                            referrerPolicy="no-referrer"
                            onError={() => handlePortraitError(char.id)}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900">
                            <Ear className="w-8 h-8 text-cyan-400" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-xl font-bold text-white leading-none">
                              {char.name}
                            </h3>
                            {isSelected && (
                              <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                            )}
                          </div>
                          <p
                            className="text-xs font-medium mt-1"
                            style={{ color: char.accentColor }}
                          >
                            {char.archetype}
                          </p>
                          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                            {char.description}
                          </p>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-800/80 text-[11px] font-mono-tabular text-slate-400">
                          {char.specialty} · {char.bonuses.maxHp} HP
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Campaign Acts Selector */}
            <section className="space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl font-bold text-white">
                  02. Escolha o Ato de Infiltração
                </h2>
                <span className="text-xs text-slate-400 font-mono-tabular">
                  Progresso: {progress.unlockedLevel}/3 atos desbloqueados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {LEVELS.map((lvl) => {
                  const unlocked = lvl.id <= progress.unlockedLevel;
                  const selected = lvl.id === selectedLevelId;
                  const record = progress.bestScores[lvl.id];

                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => onSelectLevel(lvl.id)}
                      className={`text-left p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                        !unlocked
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-55 cursor-not-allowed'
                          : selected
                            ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/30 cursor-pointer'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-600 cursor-pointer'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                          <span>
                            Ato {lvl.id} · {lvl.enemies.length} predadores
                          </span>
                          {!unlocked ? (
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          ) : record ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : null}
                        </div>
                        <h3 className="font-display text-xl font-bold text-white">
                          {lvl.title.split('·')[1]?.trim() ?? lvl.title}
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">{lvl.subtitle}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                        {record ? (
                          <span>
                            Melhor: {record.timeSec}s · {record.crystals}/3 cristais ·{' '}
                            {record.detections} alertas
                            {record.harmony !== undefined ? ` · ${record.harmony}% harmonia` : ''}
                          </span>
                        ) : unlocked ? (
                          <span className="text-cyan-300">
                            {selected ? 'Selecionado para missão' : 'Clique para selecionar'}
                          </span>
                        ) : (
                          <span>Complete o Ato {lvl.id - 1}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'mechanics' && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                <Ear className="w-4 h-4" />
                Visão de Som & Fôlego
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                O mapa é envolto em trevas até que ondas sonoras revelem paredes e criaturas.
                Andar emite anéis médios; correr gera ondas amplas e perigosas; agachar (C)
                reduz o impacto. Segure Espaço perto de inimigos para conter sua respiração.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                <Wind className="w-4 h-4" />
                Brisa dos Imbondeiros & Sussurro
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Atravesse clareiras enquanto os imbondeiros balançam com o vento para mascarar
                seus passos. A partir do Ato II, pressione E para sussurrar às folhas secas e
                erguer uma cortina sonora portátil.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                Seixos do Kwanza & Canto do Silêncio
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Clique no mapa ou pressione Q para lançar seixos e atrair predadores para longe da
                sua rota. No Ato III, pressione R para entoar o Canto do Silêncio e gerar uma
                bolha impenetrável de vácuo acústico.
              </p>
            </div>
          </section>
        )}

        {activeTab === 'ecology' && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h3 className="font-display text-xl font-bold text-rose-300">
                Predadores Cegos
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Rastreadores perseguem qualquer passo descuidado. Sereias Ressonantes soltam
                gritos de alarme que chamam aliados próximos. Colossos Tambor patrulham devagar,
                mas investem com força contra cacofonias altas.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h3 className="font-display text-xl font-bold text-pink-300">
                Bandos de Tecelões
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Aproxime-se correndo ou lance um seixo perto de aves pousadas para espantá-las. A
                revoada gera uma cacofonia massiva que revela metade do mapa e puxa predadores de
                longe — armadilha ou distração perfeita.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h3 className="font-display text-xl font-bold text-sky-300">
                Ventos do Namibe & Trovoadas
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                A intensidade e direção do vento no Namibe variam em tempo real: rajadas fortes
                atenuam e fragmentam o som visualizado, reduzindo sua Visão de Som enquanto mascaram
                passos e levam ecos a sotavento. Adapte a rota contra o vento!
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="max-w-6xl w-full mx-auto px-6 py-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>Ecophonist · Angola Pós-Silêncio · Ferramentas Grátis (0 Kz) via Conquista</span>
        <span>Ideia e referências inspiradas em códigos Lfmaven</span>
      </footer>
    </div>
  );
};
