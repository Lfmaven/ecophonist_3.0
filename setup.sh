#!/usr/bin/env bash
set -euo pipefail

# Instalador rápido e seguro do Ecophonist (Linux / macOS / Git Bash / WSL)
if ! command -v node >/dev/null 2>&1; then
  echo "Erro: Node.js não encontrado. Instale Node.js 20+ LTS em https://nodejs.org/" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Erro: npm não encontrado. Reinstale o Node.js 20+ LTS." >&2
  exit 1
fi

node scripts/setup.mjs "$@"
