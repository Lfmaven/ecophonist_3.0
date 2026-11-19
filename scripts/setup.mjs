#!/usr/bin/env node
/**
 * Setup seguro e auditoria de integridade para o projeto Ecophonist.
 * - Verifica versão mínima do Node.js (>= 20)
 * - Confirma proteção de .env no .gitignore e prepara .env local sem segredos expostos
 * - Instala dependências com --ignore-scripts para bloquear scripts postinstall arbitrários
 * - Executa varredura estática de segurança em src/ e index.html
 * - Executa checagem de tipos (tsc --noEmit) e build de produção (vite build)
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const VERIFY_ONLY = process.argv.includes('--verify-only');
const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function logStep(step, msg) {
  console.log(`\n[${step}] ${msg}`);
}

function fail(msg) {
  console.error(`\n[ERRO DE SEGURANÇA / SETUP] ${msg}`);
  process.exit(1);
}

function runCmd(cmd, args, allowFailure = false) {
  try {
    execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
    return true;
  } catch (err) {
    if (allowFailure) return false;
    fail(`Falha ao executar: ${cmd} ${args.join(' ')}`);
    return false;
  }
}

// 1. Verificar Node.js >= 20
logStep('1/5', 'Verificando versão do Node.js...');
const major = Number(process.versions.node.split('.')[0]);
if (!Number.isFinite(major) || major < 20) {
  fail(`Node.js ${process.versions.node} detectado. Instale Node.js 20+ LTS antes de continuar.`);
}
console.log(`Node.js v${process.versions.node} compatível.`);

// 2. Verificar proteção .gitignore e arquivo .env
logStep('2/5', 'Verificando proteção de ambiente (.gitignore e .env)...');
const gitignorePath = path.join(ROOT, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  fail('.gitignore não encontrado na raiz do projeto.');
}
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
if (!gitignoreContent.includes('.env')) {
  fail('.gitignore precisa ignorar arquivos .env* para evitar vazamento de segredos.');
}

const envPath = path.join(ROOT, '.env');
if (!VERIFY_ONLY && !fs.existsSync(envPath)) {
  const safeLocalEnv = [
    '# Configuração local segura do Ecophonist (100% client-side, sem segredos)',
    '# Este arquivo é ignorado pelo Git (.gitignore). Nunca adicione chaves privadas aqui.',
    'VITE_APP_NAME="Ecophonist"',
    '',
  ].join('\n');
  fs.writeFileSync(envPath, safeLocalEnv, { encoding: 'utf8', mode: 0o600 });
  console.log('Arquivo .env local criado com permissão restrita (0600) e sem credenciais.');
} else {
  console.log('Proteção .gitignore confirmada (.env protegido).');
}

// 3. Instalação segura de dependências (--ignore-scripts)
if (!VERIFY_ONLY) {
  logStep('3/5', 'Instalando dependências com --ignore-scripts (proteção contra scripts maliciosos)...');
  const hasPackageLock = fs.existsSync(path.join(ROOT, 'package-lock.json'));
  const installArgs = hasPackageLock
    ? ['ci', '--ignore-scripts', '--no-audit', '--no-fund']
    : ['install', '--ignore-scripts', '--no-audit', '--no-fund'];
  runCmd(NPM_BIN, installArgs);

  console.log('Executando auditoria de vulnerabilidades (nível alto/crítico)...');
  const auditOk = runCmd(NPM_BIN, ['audit', '--audit-level=high'], true);
  if (!auditOk) {
    console.warn('Aviso: npm audit apontou alertas em dependências. Revise com "npm audit" antes de publicar.');
  }
} else {
  logStep('3/5', 'Modo verificação: pulando instalação de dependências.');
}

// 4. Varredura estática de segurança no código-fonte
logStep('4/5', 'Executando varredura estática de segurança em src/, index.html e vite.config.ts...');
const DANGEROUS_PATTERNS = [
  { name: 'eval()', regex: /\beval\s*\(/ },
  { name: 'new Function()', regex: /\bnew\s+Function\s*\(/ },
  { name: 'dangerouslySetInnerHTML', regex: /dangerouslySetInnerHTML/ },
  { name: 'innerHTML assignment', regex: /\.innerHTML\s*=/ },
  { name: 'outerHTML assignment', regex: /\.outerHTML\s*=/ },
  { name: 'insertAdjacentHTML()', regex: /\.insertAdjacentHTML\s*\(/ },
  { name: 'document.write()', regex: /document\.write\s*\(/ },
  { name: 'window.open()', regex: /window\.open\s*\(/ },
  { name: 'window.alert()', regex: /window\.alert\s*\(/ },
  { name: 'Hardcoded Google API Key', regex: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'Hardcoded OpenAI/Stripe-style Key', regex: /\bsk-[A-Za-z0-9]{20,}/ },
  { name: 'Hardcoded GitHub Token', regex: /\bgh[pousr]_[A-Za-z0-9]{24,}/ },
  { name: 'Private Key Block', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

function collectFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (/\.(ts|tsx|js|jsx|html)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const filesToScan = [
  ...collectFiles(path.join(ROOT, 'src')),
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'vite.config.ts'),
];

const findings = [];
for (const filePath of filesToScan) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rule of DANGEROUS_PATTERNS) {
    if (rule.regex.test(content)) {
      findings.push(`${path.relative(ROOT, filePath)} -> ${rule.name}`);
    }
  }
}

if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  if (/AIza[0-9A-Za-z_-]{35}|\bsk-[A-Za-z0-9]{20,}|\bgh[pousr]_[A-Za-z0-9]{24,}|PRIVATE KEY-----/.test(envText)) {
    findings.push('.env -> Possível chave privada ou token detectado');
  }
}

if (!fs.existsSync(path.join(ROOT, 'SECURITY.md'))) {
  findings.push('SECURITY.md -> Arquivo de política de segurança ausente');
}

const indexHtmlPath = path.join(ROOT, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  if (!indexHtml.includes('Content-Security-Policy')) {
    findings.push('index.html -> Meta tag Content-Security-Policy ausente');
  }
}

if (findings.length > 0) {
  fail(`Padrões inseguros detectados:\n - ${findings.join('\n - ')}`);
}
console.log(`Varredura limpa: ${filesToScan.length} arquivos verificados sem vulnerabilidades ou segredos.`);

// 5. Verificação de tipos e build final
logStep('5/5', 'Validando TypeScript (lint) e build de produção...');
runCmd(NPM_BIN, ['run', 'lint']);
runCmd(NPM_BIN, ['run', 'build']);

console.log('\n[SUCESSO] Setup seguro concluído! Para iniciar o jogo localmente execute:');
console.log('  npm run dev     -> http://localhost:3000 (Desenvolvimento)');
console.log('  npm run preview -> http://localhost:3000 (Produção com cabeçalhos de segurança)');
