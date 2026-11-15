#!/bin/bash
# Espera hasta que haya N videos nuevos listos (de la lista) y los sube a la rama; imprime los nombres.
cd /home/claude/video
N=$1; shift
declare -A NOMBRE=( [sold]=soldadura [est]=estructuras [carp]=carpinteria [plan]=planos [naves]=naves )
hechos=0
while [ $hechos -lt $N ]; do
  for c in "$@"; do
    [ -f /tmp/pub_$c ] && continue
    if grep -q listo /tmp/$c.log 2>/dev/null && [ -f salida/$c.mp4 ]; then
      p=${c%_c*}; n=${c#*_c}; dest=${NOMBRE[$p]}-clase-$n.mp4
      [ -n "$REV" ] && dest=${NOMBRE[$p]}-clase-$n-v2.mp4
      ./publicar.sh salida/$c.mp4 $dest > /dev/null && touch /tmp/pub_$c && echo "$c -> $dest" && hechos=$((hechos+1))
      [ $hechos -ge $N ] && break
    fi
  done
  [ $hechos -lt $N ] && sleep 30
done
