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
  Skull,
  Package,
  ShieldCheck,
  Keyboard,
  Crosshair,
  Camera,
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
  const [activeTab, setActiveTab] = useState<'campaign' | 'manual' | 'mechanics' | 'ecology'>('campaign');

  const selectedLevel = LEVELS.find((l) => l.id === selectedLevelId) ?? LEVELS[0];
  const activeChar = getCharacterById(selectedCharacter);

  const handlePortraitError = (id: string) => {
    setPortraitErrors((prev) => ({ ...prev, [id]: true }));
  };

  const openInlineManual = () => {
    setActiveTab('manual');
    window.setTimeout(() => {
      document.getElementById('menu-manual-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  return (
    <div className="min-h-dvh bg-[#07090F] text-slate-100 flex flex-col">
      {/* Top Bar Contract: Brand — Nav Links — 1 Primary Action */}
      <header className="w-full border-b border-slate-800/80 bg-[#07090F]/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-6">
          <span className="font-display text-xl sm:text-2xl font-extrabold tracking-wide text-slate-50 whitespace-nowrap shrink-0">
            ECOPHONIST
          </span>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-400">
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
              onClick={openInlineManual}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'text-amber-300 underline underline-offset-8 decoration-2'
                  : 'text-amber-200/90 hover:text-amber-200'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              Manual
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

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Ativar áudio' : 'Silenciar áudio'}
              className="p-2 sm:p-2.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => onStartGame(selectedLevel.id)}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm rounded-lg hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              Iniciar Missão
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8 sm:gap-10">
        {/* Hero Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-between gap-6 py-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-cyan-300 font-medium tracking-wide">
                <span>Stealth Acústico</span>
                <span aria-hidden="true">·</span>
                <span>Aincrad × Free Fire</span>
                <span aria-hidden="true">·</span>
                <span>6 Cenários 2800px</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.05] text-balance">
                Veja o som. Rompa o andar. Sobreviva à Zona Segura.
              </h1>

              <p className="text-slate-300 text-base leading-relaxed">
                Lidere Nzinga e sua equipa angolana — incluindo a lendária Palanca Negra Kimbamba
                — por 6 cenários estendidos de 2800px, do Maiombe ao Pináculo Aincrad-Kalahari.
                Saqueie caixas táticas, use Sword Skills e derrote Chefes de Andar enquanto a Zona
                Segura se fecha.
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
                Controles: WASD mover · Shift correr · C agachar · Espaço fôlego · Q/Clique pedra ·
                [1]/[2] Sword Skills · [H] Kit Médico
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

        {/* Always-Visible Quick User Manual Strip in Menu */}
        <section
          aria-label="Manual de Utilização Rápido"
          className="rounded-xl bg-slate-900/75 border border-cyan-500/30 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BookMarked className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <h2 className="font-display text-xl font-bold text-white leading-none">
                  Manual de Utilização Rápido
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Guia essencial de campo visível no menu · Domine o stealth, Sword Skills e Zona Segura
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openInlineManual}
                className="px-3.5 py-2 rounded-lg bg-amber-400/15 border border-amber-400/60 text-amber-200 text-xs font-semibold hover:bg-amber-400/25 transition-colors cursor-pointer whitespace-nowrap"
              >
                Abrir Manual Completo no Menu
              </button>
              <button
                type="button"
                onClick={() => onOpenManual('story')}
                className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold hover:border-cyan-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                História & Crónicas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5" />
                1. Movimento & Stealth
              </p>
              <p className="text-slate-300 leading-relaxed">
                <span className="font-mono-tabular text-white font-semibold">WASD / Joystick</span> mover ·{' '}
                <span className="font-mono-tabular text-white font-semibold">C</span> agachar ·{' '}
                <span className="font-mono-tabular text-white font-semibold">Shift</span> correr ·{' '}
                <span className="font-mono-tabular text-white font-semibold">Espaço / Fôlego</span>.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <p className="font-semibold text-sky-300 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                2. Sword Skills & Cura
              </p>
              <p className="text-slate-300 leading-relaxed">
                <span className="font-mono-tabular text-sky-200 font-semibold">[1] Sonic Leap</span> dash evasivo ·{' '}
                <span className="font-mono-tabular text-rose-200 font-semibold">[2] Vorpal Strike</span> quebra postura ·{' '}
                <span className="font-mono-tabular text-emerald-300 font-semibold">[H] Kit Médico</span>.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                3. Iscas, Camuflagem & Foto
              </p>
              <p className="text-slate-300 leading-relaxed">
                <span className="font-mono-tabular text-white font-semibold">[Q]/Clique</span> pedra de isca ·{' '}
                <span className="font-mono-tabular text-white font-semibold">[E]</span> Sussurro ·{' '}
                <span className="font-mono-tabular text-white font-semibold">[R]</span> Silêncio ·{' '}
                <span className="font-mono-tabular text-white font-semibold">[F]</span> Captura Sonora.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <p className="font-semibold text-rose-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                4. Zona Segura & Chefe
              </p>
              <p className="text-slate-300 leading-relaxed">
                Siga o <span className="text-white font-semibold">Mini-Radar</span> para não ficar na tempestade, saqueie{' '}
                <span className="text-amber-300 font-semibold">Caixas</span> e vença o Chefe do andar.
              </p>
            </div>
          </div>
        </section>

        {/* Sub-Navigation Section Tabs + Diários Sonoros Archive Button */}
        <div id="menu-manual-section" className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('campaign')}
              className={`py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'campaign' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Elenco & Atos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'manual' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40' : 'text-amber-200/80 hover:text-amber-200'
              }`}
            >
              Manual de Utilização
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mechanics')}
              className={`py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'mechanics' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Habilidades
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ecology')}
              className={`py-2 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ecology' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ecologia & Clima
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenManual('manual')}
              className="py-2 px-4 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-2 hover:border-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookMarked className="w-3.5 h-3.5 text-amber-300" />
              História & Manual (Janela)
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:hidden gap-2">
          <button
            type="button"
            onClick={onOpenBestiary}
            className="py-2.5 px-3 rounded-lg bg-slate-900 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            Bestiário
          </button>
          <button
            type="button"
            onClick={onOpenRecords}
            className="py-2.5 px-3 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            Registros ({progress.unlockedRecords.length}/{SOUND_RECORDS.length})
          </button>
          <button
            type="button"
            onClick={onOpenDiaries}
            className="py-2.5 px-3 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Diários ({progress.collectedDiaries.length}/{SOUND_DIARIES.length})
          </button>
          <button
            type="button"
            onClick={() => onOpenSettings('store')}
            className="py-2.5 px-3 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Arsenal ({progress.echoShards})
          </button>
          <button
            type="button"
            onClick={() => onOpenManual('story')}
            className="py-2.5 px-3 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <BookMarked className="w-3.5 h-3.5" />
            História & Manual
          </button>
          <button
            type="button"
            onClick={() => onOpenSettings('settings')}
            className="py-2.5 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
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
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl font-bold text-white">
                  02. Escolha o Ato & Andar de Infiltração (6 Cenários · 2800px)
                </h2>
                <span className="text-xs text-slate-400 font-mono-tabular">
                  Progresso: {progress.unlockedLevel}/{LEVELS.length} cenários desbloqueados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular text-cyan-300">
                          <span>{lvl.sectorTag}</span>
                          {!unlocked ? (
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          ) : record ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : null}
                        </div>
                        <h3 className="font-display text-xl font-bold text-white">
                          {lvl.title}
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">{lvl.subtitle}</p>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono-tabular text-slate-400">
                          <span>{lvl.worldWidth}px</span>
                          <span>·</span>
                          <span>{lvl.enemies.length} predadores</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-amber-300">
                            <Package className="w-3 h-3" />
                            {lvl.supplyCrates.length} caixas
                          </span>
                        </div>
                        {lvl.boss && (
                          <p className="text-[11px] font-mono-tabular text-rose-300 flex items-center gap-1.5">
                            <Skull className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              Chefe ({lvl.boss.bars} barras): {lvl.boss.name}
                            </span>
                          </p>
                        )}
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

        {activeTab === 'manual' && (
          <section className="space-y-6" aria-label="Manual de Utilização Completo">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Manual de Utilização Completo — Guia do Jogador
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tudo o que precisa saber para infiltrar os 6 andares de 2800px, dominar o stealth e proteger seus dados
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenManual('story')}
                className="px-4 py-2 rounded-lg bg-cyan-400/15 border border-cyan-400/50 text-cyan-200 text-xs font-semibold hover:bg-cyan-400/25 transition-colors cursor-pointer"
              >
                Ler História Completa
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tabela de Comandos */}
              <div className="p-5 rounded-xl bg-slate-900/75 border border-slate-800 space-y-3">
                <h3 className="font-display text-xl font-bold text-cyan-300 flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  1. Controles & Atalhos em Campo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="font-mono-tabular text-white font-bold">W A S D / Setas</span>
                    <p className="text-slate-400 mt-0.5">Mover pelo mapa tático de 2800px</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="font-mono-tabular text-white font-bold">C / Ctrl</span>
                    <p className="text-slate-400 mt-0.5">Agachar para passos silenciosos</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="font-mono-tabular text-white font-bold">Shift</span>
                    <p className="text-slate-400 mt-0.5">Correr (rápido, porém gera ecos altos)</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="font-mono-tabular text-white font-bold">Espaço</span>
                    <p className="text-slate-400 mt-0.5">Prender respiração perto de feras</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="font-mono-tabular text-amber-300 font-bold">Q ou Clique</span>
                    <p className="text-slate-400 mt-0.5">Arremessar Seixo de Isca / postura</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="font-mono-tabular text-emerald-300 font-bold">E / R</span>
                    <p className="text-slate-400 mt-0.5">Sussurro na Folha / Canto do Silêncio</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="font-mono-tabular text-sky-300 font-bold">1 · Sonic Leap</span>
                    <p className="text-slate-400 mt-0.5">Avanço evasivo com corte (25 Energia)</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="font-mono-tabular text-rose-300 font-bold">2 · Vorpal Strike</span>
                    <p className="text-slate-400 mt-0.5">Golpe em arco que atordoa (40 Energia)</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="font-mono-tabular text-emerald-300 font-bold">H · Kit Médico</span>
                    <p className="text-slate-400 mt-0.5">Recupera +1 HP usando kit saqueado</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800">
                    <span className="font-mono-tabular text-slate-200 font-bold">F / P / Esc</span>
                    <p className="text-slate-400 mt-0.5">Captura Sonora / Pausar missão</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-950/35 border border-cyan-500/35 sm:col-span-2">
                    <span className="font-mono-tabular text-cyan-300 font-bold">
                      Celular & Tablet (Touch)
                    </span>
                    <p className="text-slate-300 mt-0.5">
                      Joystick analógico 360°, botões Agachar/Correr, barra tátil deslizável e
                      toque direto no mapa para arremessar seixo
                    </p>
                  </div>
                </div>
              </div>

              {/* Fluxo da Missão & Zona Segura */}
              <div className="p-5 rounded-xl bg-slate-900/75 border border-slate-800 space-y-3">
                <h3 className="font-display text-xl font-bold text-amber-300 flex items-center gap-2">
                  <Crosshair className="w-4 h-4" />
                  2. Como Jogar Passo a Passo
                </h3>
                <ol className="space-y-2 text-xs text-slate-300 leading-relaxed list-decimal list-inside">
                  <li>
                    <strong className="text-white">Leia o Ambiente pelos Ecos:</strong> o mapa revela
                    paredes e perigos sempre que um som se propaga. Aproveite o verde dos imbondeiros,
                    o vento do Namibe e a Tempestade do Kwanza para mascarar seus passos.
                  </li>
                  <li>
                    <strong className="text-white">Antecipe a Zona Segura:</strong> observe o
                    Mini-Radar no topo direito e a linha pontilhada branca no chão. Mova-se em stealth
                    (<span className="font-mono-tabular text-cyan-300">[C]</span>) antes do fechamento
                    para ganhar o bônus <em>Rotação Furtiva</em> e evitar dano e estática na tempestade.
                  </li>
                  <li>
                    <strong className="text-white">Saqueie Caixas de Suprimento:</strong> aproxime-se
                    das caixas douradas para receber Coletes Táticos (escudo extra), Kits Médicos{' '}
                    <span className="font-mono-tabular text-emerald-300">[H]</span>, Seixos e Energia
                    Aincrad.
                  </li>
                  <li>
                    <strong className="text-white">Quebre o Chefe de Andar:</strong> ao final de cada
                    cenário de 2800px, desvie do círculo vermelho de ataque AoE usando{' '}
                    <span className="font-mono-tabular text-sky-300">[1]</span> e quebre a Postura do
                    Chefe com <span className="font-mono-tabular text-rose-300">[2]</span> ou seixos{' '}
                    <span className="font-mono-tabular text-amber-300">[Q]</span> para liberar o Portal.
                  </li>
                </ol>
              </div>

              {/* Combos, Captura e Arsenal */}
              <div className="p-5 rounded-xl bg-slate-900/75 border border-slate-800 space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <h3 className="font-display text-xl font-bold text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  3. Combos Sonoros, Diários & Arsenal (0 Kz)
                </h3>
                <p>
                  Realizar manobras de stealth em sequência (passos camuflados, distrair feras com
                  seixos, rotação furtiva na Zona Segura e fôlego contido) eleva seu multiplicador de{' '}
                  <strong className="text-white">Harmonia Sonora</strong> até 3.0x.
                </p>
                <p>
                  Todas as ferramentas no <strong className="text-amber-300">Arsenal</strong> custam{' '}
                  <strong>0 Kz</strong>: colete Fragmentos de Eco completando atos, achando os 3
                  Cristais e os Diários Sonoros ocultos em cada fase. Pressione{' '}
                  <span className="font-mono-tabular text-cyan-300">[F]</span> a qualquer momento para
                  abrir o estúdio de <strong className="text-white">Captura Sonora</strong> e baixar
                  PNGs estilizados da partida.
                </p>
              </div>

              {/* Segurança & Privacidade */}
              <div className="p-5 rounded-xl bg-slate-900/75 border border-emerald-500/30 space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <h3 className="font-display text-xl font-bold text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  4. Segurança, Privacidade & Execução Local
                </h3>
                <p>
                  O <strong className="text-white">Ecophonist</strong> funciona 100% no seu navegador,
                  sem rastreadores externos, sem envio de dados em rede e com validação rígida de
                  integridade no salvamento local.
                </p>
                <p>
                  O suporte ao microfone ambiente nas <strong>Configurações</strong> é desativado por
                  padrão e opcional: quando ligado, apenas lê decibéis em memória local para animar o
                  Sonar Visual — nunca grava nem transmite áudio.
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'mechanics' && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                <Ear className="w-4 h-4" />
                Visão de Som & Sword Skills [1] / [2]
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Ande em sigilo com [C] e [Espaço], ou gaste Energia Aincrad em [1] Sonic Leap (dash
                evasivo com corte) e [2] Vorpal Strike (golpe em arco que atordoa predadores e
                quebra a postura dos Chefes de Andar).
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                <Wind className="w-4 h-4" />
                Zona Segura & Caixas de Suprimento
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Acompanhe o Mini-Radar no canto direito: a Zona Segura retrátil fecha em estágios e
                causa dano fora do anel. Abra Caixas Táticas e Airdrops para ganhar Coletes de
                Escudo, Kits Médicos [H], Seixos e Energia.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                Iscas, Sussurro [E] & Silêncio [R]
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Lance seixos [Q] para desviar feras ou causar dano de postura ao Chefe. Combine [E]
                Sussurro na Folha e [R] Canto do Silêncio para atravessar setores vigiados com
                Combo Sonoro máximo.
              </p>
            </div>
          </section>
        )}

        {activeTab === 'ecology' && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h3 className="font-display text-xl font-bold text-rose-300">
                Chefes de Andar SAO
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Cada cenário de 2800px termina com um Guardião multi-barra (de Kagachi a Gleam-Eyes
                e o Arquiteto Carmesim). Desvie dos golpes AoE vermelhos, quebre a Postura e libere
                o Portal do Santuário.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h3 className="font-display text-xl font-bold text-pink-300">
                Bandos & Predadores Cegos
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Rastreadores, Sereias Ressonantes e Colossos Tambor caçam pelo som. Espantar bandos
                de tecelões gera uma onda massiva que atrai toda a vizinhança — use como armadilha
                ou desvio.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h3 className="font-display text-xl font-bold text-sky-300">
                Ventos do Namibe & Trovoadas
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                A intensidade e direção do vento variam em tempo real: rajadas fortes atenuam ondas
                e carregam ecos a sotavento, enquanto a Tempestade do Kwanza mascara passos em
                corredores abertos.
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
