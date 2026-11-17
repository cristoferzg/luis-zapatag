#!/bin/bash
# Uso: cola3.sh clase1 clase2 ... (renderiza en serie, esperando el candado)
cd /home/claude/video
for c in "$@"; do
  while [ ! -f $c.py ]; do sleep 60; done
  flock /tmp/render.lock bash -c "VEL=1.15 python3 $c.py > /tmp/$c.log 2>&1"
done
