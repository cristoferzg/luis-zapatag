import sys, glob
from PIL import Image
n = sys.argv[1]
fs = sorted(glob.glob(f'salida/{n}/prueba_e*_012.0.jpg'), key=lambda f: int(f.split('_e')[1].split('_')[0]))
W, H = 640, 360
im = Image.new('RGB', (W*3, H*((len(fs)+2)//3)))
for i, f in enumerate(fs): im.paste(Image.open(f).resize((W, H)), ((i % 3)*W, (i//3)*H))
im.save(f'/tmp/hoja_{n}.jpg', quality=85)
