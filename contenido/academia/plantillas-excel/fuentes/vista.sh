#!/bin/bash
# vista.sh archivo.xlsx salida.jpg : todas las hojas (menos Catálogo) en una imagen
set -e; o=$(realpath -m "$2"); d=$(mktemp -d); python3 - "$1" "$d/v.xlsx" <<'PY'
import sys
from openpyxl import load_workbook
from openpyxl.worksheet.properties import PageSetupProperties
wb=load_workbook(sys.argv[1])
for ws in wb.worksheets:
    ws.page_setup.orientation='landscape'; ws.sheet_properties.pageSetUpPr=PageSetupProperties(fitToPage=True); ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=1
wb['Catálogo'].sheet_state='hidden'; wb.save(sys.argv[2])
PY
cd $d && python3 /root/.claude/skills/synced/84fa8981-1fd1-406d-a118-24fa705fea0f_5800e50a-e222-4fed-8755-cdd6fe690d19/xlsx/scripts/recalc.py v.xlsx 60 >/dev/null && soffice --headless --convert-to pdf v.xlsx >/dev/null 2>&1 && pdftoppm -r 90 -png v.pdf q
python3 - "$d" "$o" <<'PY'
import sys,glob
from PIL import Image
ims=[]
for f in sorted(glob.glob(sys.argv[1]+'/q-*.png')):
    im=Image.open(f).convert('RGB'); bb=Image.eval(im.convert('L'),lambda v:255 if v<250 else 0).getbbox(); ims.append(im.crop(bb))
W=max(i.width for i in ims)+40; H=sum(i.height for i in ims)+20*(len(ims)+1)
out=Image.new('RGB',(W,H),'white'); y=20
for i in ims: out.paste(i,(20,y)); y+=i.height+20
out.save(sys.argv[2],quality=85); print(out.size)
PY
