# Manual de Instalação Segura

Este guia orienta como clonar, auditar, configurar e executar o **Ecophonist** localmente com total segurança após baixar o projeto pelo GitHub.

---

## 1. Pré-requisitos

Certifique-se de ter instalados no seu sistema operacional (Windows, macOS ou Linux):

- **Git** (`2.30+`)
- **Node.js** (`20.0.0 LTS` ou superior) — inclui o **npm** (`10+`)
- Navegador moderno com suporte a **HTML5 Canvas** e **Web Audio API** (Chrome, Firefox, Edge ou Safari)

Para conferir suas versões no terminal:

```bash
git --version
node -v
npm -v
```

---

## 2. Clonar o Repositório com Segurança

Clone o repositório diretamente do GitHub e entre na pasta do projeto:

```bash
git clone <URL_DO_REPOSITORIO_GITHUB>
cd ecophonist
```

> **Dica de Segurança:** Antes de instalar pacotes, confira sempre se o arquivo `.gitignore` está presente e se não há arquivos `.env` reais versionados (`git status`).

---

## 3. Setup Automático Seguro (Recomendado)

O projeto possui um instalador seguro que:
1. Verifica se o **Node.js >= 20** está ativo;
2. Confirma que `.env*` está bloqueado no `.gitignore` e gera um `.env` local limpo (sem credenciais, permissão `0600`);
3. Instala todas as dependências usando **`--ignore-scripts`**, impedindo a execução automática de scripts `postinstall` de terceiros;
4. Executa `npm audit --audit-level=high`;
5. Faz varredura estática no código-fonte contra `eval`, `innerHTML` e chaves vazadas;
6. Valida os tipos TypeScript e gera o build de produção.

### No Linux / macOS / Git Bash / WSL:
```bash
chmod +x setup.sh
./setup.sh
```

### Em qualquer sistema (incluindo Windows PowerShell / CMD):
```bash
npm run setup
```

---

## 4. Instalação Manual Passo a Passo (Alternativa)

Se preferir executar cada etapa manualmente:

1. **Instale as dependências com bloqueio de scripts externos:**
   ```bash
   npm install --ignore-scripts --no-audit --no-fund
   ```
2. **Audite vulnerabilidades conhecidas:**
   ```bash
   npm audit --audit-level=high
   ```
3. **Execute a verificação de segurança e compilação:**
   ```bash
   npm run security:check
   ```

---

## 5. Executar o Jogo Localmente

### Modo Desenvolvimento (porta `3000`)
```bash
npm run dev
```
Acesse no navegador: `http://localhost:3000`

### Modo Produção Local (Recomendado para jogar com cabeçalhos reforçados)
```bash
npm run build
npm run preview
```
Acesse no navegador: `http://localhost:3000`

> O servidor de preview aplica automaticamente cabeçalhos de segurança HTTP (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy: camera=(), geolocation=(), microphone=(self)`).

---

## 6. Variáveis de Ambiente & Privacidade

- O **Ecophonist** é executado **100% no cliente (navegador)**.
- **Não exige chaves de API**, login externo, nem banco de dados remoto para funcionar localmente.
- Todo o progresso (atos desbloqueados, Fragmentos de Eco, Registros Sonoros, Diários Sonoros e configurações) é armazenado apenas no `localStorage` do seu navegador, com validação rigorosa contra dados corrompidos.
- **Microfone (Opcional):** O recurso *Sonar Reativo ao Microfone* vem **desativado por padrão**. Caso você opte por ativá-lo em **Configurações**, o áudio é processado estritamente em memória pela Web Audio API (`AnalyserNode`) apenas para medir o volume ambiente — nada é gravado ou enviado pela rede.

---

## 7. Solução de Problemas Comuns

- **Porta `3000` já está em uso:** Encerre o processo que ocupa a porta `3000` ou rode `npx vite --port=3001` no modo desenvolvimento.
- **Jogo sem som ao abrir:** Navegadores modernos exigem interação do usuário antes de liberar áudio. Clique em **Iniciar Missão** ou no botão de som no menu para destravar a Web Audio API.
- **Erro de versão do Node.js:** Atualize para Node.js `20+ LTS` usando `nvm install 20 && nvm use 20` ou o instalador oficial em `nodejs.org`.
- **Reinstalação limpa:**
  ```bash
  npm run clean
  rm -rf node_modules
  npm run setup
  ```
