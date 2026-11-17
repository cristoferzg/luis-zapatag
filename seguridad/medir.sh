#!/bin/bash
set -u
cd "$(dirname "$0")/.."
node seguridad/semilla.mjs || exit 1
(VITE_EMULADORES=1 npx vite --port 3001 --strictPort > /tmp/vite_medir.log 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null localhost:3001 && break; sleep 1; done
node seguridad/medir.mjs; R=$?
pkill -f "vite --port 3001" || true
exit $R
