#!/bin/bash
# Publica las clases ampliadas de Naves a medida que terminan: naves_xN -> naves-clase-N-v4.mp4
cd /home/claude/video
hechos=0
while [ $hechos -lt 13 ]; do
  hechos=0
  for n in $(seq 1 13); do
    c=naves_x$n
    if [ -f /tmp/pub_$c ]; then hechos=$((hechos+1)); continue; fi
    if grep -q listo /tmp/$c.log 2>/dev/null && [ -f salida/$c.mp4 ]; then
      ./publicar.sh salida/$c.mp4 naves-clase-$n-v4.mp4 > /dev/null && touch /tmp/pub_$c && echo "$c -> naves-clase-$n-v4.mp4" && hechos=$((hechos+1))
    fi
  done
  [ $hechos -lt 13 ] && sleep 30
done
