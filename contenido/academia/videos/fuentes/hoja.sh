#!/bin/bash
# hoja.sh archivo [nombre_salida]
cd /home/claude/video
n=${2:-$1}
VEL=1.15 timeout 900 python3 $1.py prueba > /tmp/$1p.log 2>&1 || { tail -5 /tmp/$1p.log; exit 1; }
python3 montaje.py $n && rm -rf salida/$n && echo ok
