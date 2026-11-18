# Política e Arquitetura de Segurança — Ecophonist

## Garantias de Segurança do Projeto

1. **Execução 100% Local (Client-Side Only):**
   - Nenhuma telemetria, rastreador externo ou envio de dados do jogador para servidores de terceiros.
   - Todo o progresso é salvo localmente via `window.localStorage` (`ecophonist_progress_v2`), passando por sanitização rígida de tipos, intervalos numéricos e listas permitidas (`src/game/storage.ts`).
2. **Privacidade do Microfone (Opt-in):**
   - O modo *Sonar Reativo ao Microfone* é desligado por padrão.
   - Quando autorizado explicitamente pelo usuário nas configurações, utiliza apenas `navigator.mediaDevices.getUserMedia({ audio: true, video: false })` conectado a um `AnalyserNode` em memória para calcular decibéis locais — sem gravação de áudio, câmera ou transmissão em rede.
   - O stream é encerrado imediatamente ao desativar a opção ou sair da tela.
3. **Instalação Protegida contra Ataques de Cadeia de Suprimentos:**
   - O script `npm run setup` instala pacotes com `--ignore-scripts`, bloqueando hooks `preinstall`/`postinstall` maliciosos de pacotes transitivos.
   - O comando `npm run security:check` verifica ausência de `eval`, `new Function`, `dangerouslySetInnerHTML`, `innerHTML`, `document.write` e chaves privadas no código.
4. **Cabeçalhos HTTP e Meta Tags de Proteção:**
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), geolocation=(), microphone=(self)` no servidor de preview (`vite.config.ts`)

## Reportando Vulnerabilidades

Caso identifique qualquer falha de segurança neste repositório, abra uma *Security Advisory* privada na aba **Security** do repositório no GitHub ou descreva os passos para reprodução sem expor credenciais.
