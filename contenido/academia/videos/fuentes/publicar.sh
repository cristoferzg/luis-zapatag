#!/bin/bash
# Uso: publicar.sh archivo.mp4 nombre_en_rama.mp4  → lo sube a la rama academia-videos
set -e
R=/home/claude/av
if [ ! -d $R/.git ]; then
  git clone -q --depth 1 --single-branch -b academia-videos "$(git -C /home/claude/luis-zapatag remote get-url origin)" $R
fi
cp "$1" "$R/$2"
cd $R && git add -f "$2" && git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -qm "Video $2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BsHkDop9PTnei1QNXQFAiK" && git -c push.negotiate=true push -q origin academia-videos
echo "https://raw.githubusercontent.com/cristoferzg/luis-zapatag/academia-videos/$2"
