#!/bin/bash
# Corre dentro de `firebase emulators:exec` (base, ingreso y funciones en emuladores).
set -u
cd "$(dirname "$0")/.."
node seguridad/semilla.mjs || exit 1
(VITE_EMULADORES=1 npx vite --port 3001 --strictPort > /tmp/vite_e2e.log 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null localhost:3001 && break; sleep 1; done
node seguridad/app.e2e.mjs; R=$?
node seguridad/verificar.mjs || R=1
pkill -f "vite --port 3001" || true
exit $R
