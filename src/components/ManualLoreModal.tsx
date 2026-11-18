import React, { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  BookMarked,
  BookOpen,
  Compass,
  Ear,
  Keyboard,
  Shield,
  ShoppingBag,
  Sparkles,
  Wind,
  X,
} from 'lucide-react';

interface ManualLoreModalProps {
  initialTab?: 'story' | 'manual';
  onClose: () => void;
}

export const ManualLoreModal: React.FC<ManualLoreModalProps> = ({
  initialTab = 'story',
  onClose,
}) => {
  const [tab, setTab] = useState<'story' | 'manual'>(initialTab);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05070C]/88 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-lore-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-w-4xl w-full bg-[#0C1220] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 id="manual-lore-title" className="font-display text-2xl font-extrabold text-white">
              Crónicas & Manual de Sobrevivência
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              História de Angola Pós-Silêncio e Guia Tático Completo de Ecophonist
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Manual e História"
            className="p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/70 flex gap-2 shrink-0 bg-[#090E1A]">
          <button
            type="button"
            onClick={() => setTab('story')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              tab === 'story'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            História do Jogo
          </button>
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              tab === 'manual'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            Manual de Utilização
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          {tab === 'story' ? (
            <>
              {/* Prólogo */}
              <section className="p-5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Prólogo · O Grande Silêncio
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  Quando os motores se calaram da Baía de Luanda ao Planalto da Huíla
                </h3>
                <p>
                  Num futuro próximo, uma anomalia geofísica despertou predadores subterrâneos sem
                  olhos por toda a África Austral. Incapazes de enxergar, essas criaturas caçam pela
                  menor vibração no ar e no solo. Em apenas quarenta e oito horas, o estrondo das
                  cidades tornou-se um farol fatal: as sirenes da Marginal de Luanda, os comboios e
                  as grandes máquinas foram silenciados para sempre.
                </p>
                <p>
                  A civilização angolana não desapareceu por falta de coragem, mas porque o barulho
                  passou a ser sentença de morte. Os sobreviventes aprenderam uma nova disciplina:
                  transformar a escuta em visão e o silêncio em escudo.
                </p>
              </section>

              {/* A Protagonista e a Expedição */}
              <section className="space-y-3">
                <h3 className="font-display text-lg font-bold text-white">
                  Nzinga, a Palanca Negra e a Última Expedição
                </h3>
                <p>
                  Antes do colapso, <strong className="text-cyan-300">Nzinga</strong> era engenheira
                  de frequências sísmicas na Floresta do Maiombe. Ao perder a família no êxodo das
                  cidades costeiras, descobriu como ler o ambiente através dos ecos — enxergando
                  paredes, abismos e ameaças no contorno de cada onda sonora.
                </p>
                <p>
                  Em Cangandala, Nzinga salvou <strong className="text-sky-300">Kimbamba</strong>,
                  uma majestosa <em>Palanca Negra Gigante</em> cujos chifres ressoam em harmonia
                  com as cordas da kissange. Ao lado da batedora do deserto{' '}
                  <strong className="text-emerald-300">Kandimba</strong>, da musicista{' '}
                  <strong className="text-amber-300">Lueji</strong> e do especialista acústico do
                  Kwanza <strong className="text-amber-400">Tchissola</strong>, elas cruzam três
                  biomas sagrados em busca de refúgio definitivo e da verdade deixada nos{' '}
                  <strong className="text-white">Diários Sonoros</strong>.
                </p>
              </section>

              {/* Os Três Atos */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-mono-tabular text-cyan-300 font-semibold">
                    ATO I · FLORESTA DO MAIOMBE
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Entre imbondeiros antigos e ruínas cobertas de neblina, a equipa aprende a
                    sincronizar passos com a brisa para alcançar o Santuário de Mbanza sem despertar
                    os primeiros Rastreadores Cegos.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-mono-tabular text-amber-300 font-semibold">
                    ATO II · MIRADOURO DA LUA
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cânions secos onde comboios blindados tombaram. Sereias Ressonantes, bandos de
                    tecelões e o temível Colosso Tambor exigem o domínio do Sussurro na Folha e dos
                    Seixos de Isca.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-mono-tabular text-rose-300 font-semibold">
                    ATO III · FENDA DA TUNDAVALA
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sob as trovoadas da Huíla e rajadas cortantes do Namibe, apenas o Canto do
                    Silêncio e o respeito ao ritmo da terra decidirão o destino sonoro de Angola.
                  </p>
                </div>
              </section>

              {/* Três Finais */}
              <section className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h3 className="font-display text-base font-bold text-white">
                  Os 3 Destinos da Harmonia Sonora
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li>
                    <span className="text-emerald-300 font-semibold">
                      Final Luminoso · Sinfonia do Silêncio (80%+ Harmonia):
                    </span>{' '}
                    As feras recuam em reverência diante da disciplina da expedição; a paz retorna
                    às serras angolanas.
                  </li>
                  <li>
                    <span className="text-amber-300 font-semibold">
                      Final Neutro · Eco Dividido (45%–79% Harmonia):
                    </span>{' '}
                    A equipa sobrevive ao refúgio da Tundavala, mas ecos residuais mantêm predadores
                    em vigília na fronteira.
                  </li>
                  <li>
                    <span className="text-rose-300 font-semibold">
                      Final Sombrio · Cacofonia Eterna (0%–44% Harmonia):
                    </span>{' '}
                    Ruídos excessivos e revoadas despertam os Colossos e Sereias, mergulhando a
                    região em caçada contínua.
                  </li>
                </ul>
              </section>
            </>
          ) : (
            <>
              {/* Controles */}
              <section className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <Keyboard className="w-4 h-4" />
                  1. Controles em Campo
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono-tabular text-white font-semibold">W A S D / Setas</span>
                    <span className="text-slate-400"> — Mover pelo cenário</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono-tabular text-white font-semibold">Shift</span>
                    <span className="text-slate-400"> — Correr (rápido, porém cria ondas largas)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono-tabular text-white font-semibold">C / Ctrl</span>
                    <span className="text-slate-400"> — Agachar (passos ultradiscretos)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono-tabular text-white font-semibold">Espaço</span>
                    <span className="text-slate-400"> — Segurar respiração perto de inimigos</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono-tabular text-white font-semibold">Q ou Clique</span>
                    <span className="text-slate-400"> — Lançar Seixo de Isca para desviar feras</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono-tabular text-white font-semibold">E / R / F / Esc</span>
                    <span className="text-slate-400">
                      {' '}
                      — Sussurro · Silêncio · Captura Sonora · Pausar
                    </span>
                  </div>
                </div>
              </section>

              {/* Leitura do HUD */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                    <Ear className="w-4 h-4" />
                    2. Sonar Visual & Camuflagem
                  </div>
                  <p className="text-xs text-slate-300">
                    O mundo permanece escuro até que um som ocorra. Seus passos geram anéis
                    concêntricos que iluminam paredes, cristais e predadores, mas também alertam
                    quem estiver no alcance. Caminhe dentro dos anéis verdes dos imbondeiros ou
                    durante trovoadas para mascarar seus passos.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                    <Activity className="w-4 h-4" />
                    3. Batimento Cardíaco & Fôlego
                  </div>
                  <p className="text-xs text-slate-300">
                    O monitor cardíaco no canto do ecrã acompanha seu BPM real. Ao correr ou chegar
                    perto de um predador, o pulso acelera e vibra. Segure <strong>Espaço</strong>{' '}
                    para conter a respiração sem zerar a barra de fôlego (se ela zerar, um ofego
                    alto denuncia sua posição).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-sky-300 font-semibold text-xs">
                    <Wind className="w-4 h-4" />
                    4. Clima Angolano & Vento do Namibe
                  </div>
                  <p className="text-xs text-slate-300">
                    Acompanhe a bússola de vento no topo. Ventos fortes do Namibe (em km/h)
                    atenuam ondas sonoras e sopram o som a <Compass className="w-3 h-3 inline" />{' '}
                    <strong>sotavento</strong>: predadores contra o vento (barlavento) têm muita
                    dificuldade de ouvir você. Na <strong>Tempestade do Kwanza</strong>, chuva e
                    raios abafam passos e revelam o mapa.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                    <Sparkles className="w-4 h-4" />
                    5. Harmonia, Cristais & Diários
                  </div>
                  <p className="text-xs text-slate-300">
                    Cada ato esconde <strong>3 Cristais de Ressonância</strong> (que também repõem
                    +1 Seixo de Isca) e <strong>2 Diários Sonoros</strong> (que narram a história
                    e rendem +1 Fragmento). Passos camuflados sobem a <strong>Harmonia</strong>;
                    alertas e aves espantadas a reduzem.
                  </p>
                </div>
              </section>

              {/* Progressão Gratuita e Inimigos */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                    <ShoppingBag className="w-4 h-4" />
                    6. Arsenal 100% Grátis (Conquista em Batalha)
                  </div>
                  <p className="text-xs text-slate-300">
                    Nenhuma ferramenta custa dinheiro (<strong>0 Kz</strong>). Você começa apenas
                    com 2 Fragmentos de Eco e precisa conquistá-los jogando: complete missões,
                    recupere cristais, encontre Diários Sonoros, alcance Harmonia alta e desbloqueie{' '}
                    <strong>Registros Sonoros</strong> para forjar os 4 equipamentos no Arsenal.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                    <Award className="w-4 h-4" />
                    7. Bestiário, Registros & Microfone
                  </div>
                  <p className="text-xs text-slate-300">
                    Consulte o <strong>Bestiário Sonoro</strong> no menu para ouvir a assinatura de
                    cada criatura antes da missão. Conclua proezas nos{' '}
                    <strong>Registros Sonoros</strong> para ganhar passivos permanentes em todos os
                    personagens. Em <strong>Configurações</strong>, você pode ativar o Sonar Reativo
                    ao seu microfone real!
                  </p>
                </div>
              </section>

              <section className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
                <Shield className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Dica de Ouro para Iniciantes:</strong> Evite correr
                  perto dos bandos de tecelões rosas. Se um predador bloquear o corredor, atire um
                  seixo (<span className="font-mono-tabular text-amber-300">Q</span>) na parede
                  oposta, espere a onda sonora atraí-lo e passe agachado (
                  <span className="font-mono-tabular text-cyan-300">C</span>) aproveitando a brisa.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
