# Ecophonist

**Ecophonist** é um jogo de aventura de sobrevivência e *stealth* acústico ambientado numa Angola pós-silêncio — da **Floresta do Maiombe** às falésias do **Miradouro da Lua** e da **Fenda da Tundavala** — onde criaturas cegas caçam por audição hiper-aguda e cada som ganha forma visual.

> **Crédito & Inspiração**: A arquitetura das mecânicas visuais e o conceito do sistema sonoro tiveram inspiração direta em códigos e ideias de **Lfmaven**.

---

## História do Jogo · Angola Pós-Silêncio

Num futuro próximo, uma anomalia geofísica despertou predadores subterrâneos cegos por toda a região. Incapazes de enxergar, essas criaturas detectam qualquer vibração no ar e no solo. Em quarenta e oito horas, as sirenes da Baía de Luanda, os comboios blindados e os motores das grandes cidades silenciaram para sempre: o ruído urbano tornou-se um farol mortal.

Antes do colapso, **Nzinga** mapeava frequências sísmicas na **Floresta do Maiombe**. Após perder sua família no êxodo costeiro, ela aprendeu a transformar a escuta em visão — usando cada eco para enxergar ruínas, abismos e ameaças na escuridão. Em Cangandala, Nzinga resgatou **Kimbamba**, uma lendária **Palanca Negra Gigante** cujos chifres ressoam em harmonia com as notas da *kissange*. Ao lado da batedora **Kandimba**, da musicista **Lueji** e do engenheiro **Tchissola**, a expedição atravessa três biomas angolanos em busca de refúgio e da verdade gravada nos **Diários Sonoros**:

- **Ato I · Floresta do Maiombe**: Aprender a ler o Sonar Visual e caminhar sincronizado com a brisa entre imbondeiros até o Santuário de Mbanza.
- **Ato II · Falésias do Miradouro da Lua**: Cruzar desfiladeiros marcados por comboios destruídos, evitando despertar bandos de tecelões e o temível *Colosso Tambor*.
- **Ato III · Fenda da Tundavala**: Enfrentar as trovoadas da Huíla e rajadas cortantes do Namibe dominando o *Canto do Silêncio* para selar o destino acústico de Angola em um de três finais (*Sinfonia do Silêncio*, *Eco Dividido* ou *Cacofonia Eterna*).

## Elenco da Expedição (5 Personagens)

- **Nzinga (Protagonista Principal · Mulher Angolana)**: Mestra Ecofonista que lidera a expedição — passos 10% mais silenciosos, +1 seixo de isca e bônus equilibrados.
- **Kandimba (Aliada · Mulher Angolana)**: Batedora do Namibe — 14% mais veloz e passos 20% mais discretos sob neblina e vento.
- **Lueji (Aliada · Mulher Angolana)**: Mestra da Kissange — recarga 28% mais rápida de *Sussurro na Folha* e *Canto do Silêncio*.
- **Tchissola (Aliado · Homem Angolano)**: Engenheiro do Kwanza — carrega +2 seixos extras e arremessa distrações 35% mais longe.
- **Kimbamba (Guardiã · Palanca Negra Gigante)**: Espírito de Cangandala — 4 de vitalidade, galope 18% mais rápido e chifres que pulsam ecos reveladores pelo mapa.

## Principais Mecânicas

- **Visão de Som & Sonar Visual em Tempo Real**: O cenário permanece escuro até que ondas sonoras revelem paredes, falésias e predadores. No `GameCanvasView`, um efeito de **Sonar Visual** via HTML5 Canvas API desenha ondulações concêntricas partindo da posição do jogador de acordo com o volume ambiente em tempo real (simulado ou captado pelo microfone opcional).
- **Indicador Cardíaco Sincronizado**: Monitor no canto do ecrã com traçado ECG e vibração em tempo real sincronizada com o ritmo cardíaco (BPM) da personagem — acelerando e vibrando de forma frenética ao correr, conter o fôlego ou estar próximo de predadores.
- **Bestiário Sonoro**: Catálogo acessível a partir do menu principal com artes estilizadas voltadas para a visualização sonora de cada criatura (*Rastreador Cego*, *Sereia Ressonante*, *Colosso Tambor* e *Bando de Tecelões*), gráfico de forma de onda em tempo real, audição prévia via Web Audio API e contramedidas táticas.
- **Harmonia Sonora & Finais Múltiplos**: Ações silenciosas (passos camuflados, andar agachado, segurar o fôlego perto de predadores, *Sussurro na Folha*, *Canto do Silêncio* e cristais) aumentam a Harmonia (`0–100%`), enquanto corridas expostas, fôlego esgotado, revoadas de aves e alertas de caçada a reduzem — concedendo Fragmentos de Eco bônus e determinando o final do jogo (*Final Luminoso · Sinfonia do Silêncio*, *Final Neutro · Eco Dividido* ou *Final Sombrio · Cacofonia Eterna*).
- **Registros Sonoros (Emblemas & Recompensas Permanentes)**: Proezas conquistadas nos níveis — como *Silêncio Absoluto* (0 alertas), *Ecos da Palanca* (3 cristais com Kimbamba), *Sinfonia do Maiombe* (`>= 85%` de Harmonia), *Filho da Tempestade*, *Maestro das Iscas* e *Voz da Tundavala* — desbloqueiam emblemas permanentes que concedem Fragmentos de Eco e passivos cumulativos em todas as futuras partidas.
- **Diários Sonoros Colecionáveis**: 6 gravações acústicas ocultas pelos três atos (*Floresta do Maiombe*, *Miradouro da Lua* e *Fenda da Tundavala*). Ao encontrá-las, tocam uma breve narração ambiental com trilha de *kissange* sobre a história de Nzinga e a queda da civilização angolana, concedem `+1 Fragmento de Eco` e ficam disponíveis para reouvir no arquivo de **Diários Sonoros**.
- **Camuflagem Sonora**: Sincronize seus passos com a brisa nos imbondeiros ou com as trovoadas da Huíla para mascarar suas pegadas. Segure `Espaço` perto de predadores para conter sua respiração.
- **Criação e Distorção de Som**:
  - `Q` ou clique no mapa: **Seixo de Isca** para atrair predadores para longe (reabastece naturalmente e ao coletar cristais).
  - `E` (Ato II+): **Sussurro na Folha** para criar uma cortina sonora sibilante.
  - `R` (Ato III): **Canto do Silêncio** para gerar uma bolha temporária de vácuo acústico.
- **Ecologia Sonora & Clima Angolano Dinâmico**:
  - **Ventos & Neblina do Namibe**: A intensidade (em `km/h`) e a direção do vento no Namibe oscilam dinamicamente entre *Calmarias* e *Rajadas do Namibe*. Quanto maior o vento, maior a atenuação visual e acústica das ondas sonoras (anéis fragmentados, menor raio de revelação e deriva a sotavento), forçando o jogador a adaptar sua rota a barlavento ou aproveitar as rajadas para se camuflar.
  - **Tempestade do Kwanza**: Chuva torrencial que mascara passos normais, reduz a audição inimiga em `38%` e dispara relâmpagos reveladores.
  - **Vento Cacimbo**: Brisa seca que acelera a dissipação sonora e reduz o ganho de suspeita dos monstros.
  - **Bandos de Tecelões**: Podem ser espantados para gerar uma cacofonia que distrai ou atrai predadores maiores.

## Configurações e Arsenal Gratuito (0 Kz · Conquista em Batalha)

No menu de **Configurações & Arsenal**, é possível ajustar:
- **Volume Mestre** e silenciamento rápido.
- **Sensibilidade do Sonar Visual** (`Baixa`, `Normal`, `Alta`) e modo de **Efeitos Reduzidos**.
- **Rigor Auditivo** (`Padrão` ou `Implacável`).
- **Sonar Reativo ao Microfone Real** (opt-in seguro via `MediaStream` + `AnalyserNode`).
- **Ferramentas Angolanas (100% Grátis / `0 Kz` — conquistadas apenas batalhando por Fragmentos de Eco)**:
  - *Seixos do Rio Kwanza* (`4 frag.`): capacidade para 7 pedras de isca e recarga 30% mais rápida.
  - *Manto Samakaka Abissal* (`6 frag.`): reduz em 25% o raio sonoro em passos normais/agachados.
  - *Fôlego da Welwítschia* (`5 frag.`): reduz em 35% o gasto de fôlego ao segurar a respiração.
  - *Kissange Dourada Imperial* (`7 frag.`): paleta dourada e turquesa para o cachecol e para o Sonar Visual.

## Manual de Utilização

### 1. Controles em Campo
- `W A S D` / `Setas`: Mover pelo cenário
- `Shift`: Correr (maior velocidade, porém gera ondas sonoras amplas)
- `C` / `Ctrl`: Agachar (passos ultradiscretos com raio sonoro mínimo)
- `Espaço`: Segurar a respiração perto de predadores (evite zerar a barra de fôlego para não ofegar alto)
- `Q` ou Clique no Canvas: Arremessar Seixo de Isca para atrair criaturas longe da sua rota
- `E`: Sussurro na Folha (Ato II+ · cortina sonora portátil)
- `R`: Canto do Silêncio (Ato III · bolha temporária de vácuo acústico)
- `F`: Modo Captura Sonora (estúdio de foto com 5 filtros visuais sonoros, telemetria, PNG e compartilhamento)
- `Esc` / `P`: Pausar a missão

### 2. Como Ler o Ecrã & Sobreviver
- **Sonar Visual & Escuridão**: Ondas sonoras revelam paredes, ruínas, cristais e predadores. Aproxime-se das zonas verdes de brisa nos imbondeiros ou aproveite trovoadas para mascarar seus passos.
- **Indicador Cardíaco (BPM)**: No canto do ecrã, vibra conforme o esforço físico e a proximidade de predadores; quanto mais frenético, maior a urgência de abrandar ou conter o fôlego.
- **Bússola de Vento do Namibe**: A direção e velocidade (`km/h`) do vento alteram a atenuação sonora em tempo real. Posicionar-se a **barlavento** (contra o vento em relação ao inimigo) dificulta que o predador ouça você.
- **Cristais & Diários Sonoros**: Colete os 3 **Cristais de Ressonância** (que também repõem `+1 Seixo de Isca`) e os 2 **Diários Sonoros** de cada ato antes de cruzar o Santuário de saída à direita.
- **Conquista de Ferramentas (`0 Kz`)**: Acumule **Fragmentos de Eco** vencendo atos, encontrando Diários, mantendo **Harmonia Sonora** elevada e completando **Registros Sonoros** para desbloquear gratuitamente as ferramentas no Arsenal.

## Stack Técnica

- React 19 + TypeScript + Vite
- HTML5 Canvas 2D API (Sonar Visual concêntrico e renderização estilizada)
- Web Audio API procedural (síntese de passos, vento, trovões, sonar inimigo e análise opcional de microfone)
- Tailwind CSS v4 + Lucide Icons

## Instalação Segura

Para clonar e executar localmente com proteção contra scripts de terceiros (`--ignore-scripts`), verificação estática de código e cabeçalhos HTTP reforçados:

```bash
npm run setup
npm run dev
```

- Consulte o passo a passo completo em [`INSTALL.md`](./INSTALL.md).
- Consulte as garantias de privacidade e endurecimento em [`SECURITY.md`](./SECURITY.md).

