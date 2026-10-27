// =============================================================================
// Texturas de los muros de Obra Civil y Drywall, a escala real:
//   • Cada modelo de ladrillo se ve distinto (King Kong, King Kong industrial,
//     pandereta, bloque de concreto) con su tamaño, color y junta reales.
//   • OSB con sus hojuelas orientadas, borde de plancha y tornillos.
//   • Drywall con las juntas de placa cada 1.22 m.
// Las texturas se dibujan una sola vez en alta resolución y se reutilizan.
// Coordenadas UV de los muros en metros: repeat = 1 / tamaño de la textura (m).
// =============================================================================
import * as THREE from 'three';

export type TipoLadrillo = 'kingkong' | 'industrial' | 'pandereta' | 'bloque';

/** Modelo de ladrillo según el id del catálogo (o su nombre, si es propio). */
export function tipoLadrillo(materialId?: string, nombre?: string): TipoLadrillo {
  const t = `${materialId || ''} ${nombre || ''}`.toLowerCase();
  if (/bloque|concreto|cemento/.test(t)) return 'bloque';
  if (/pandereta/.test(t)) return 'pandereta';
  if (/industrial|maquina|máquina/.test(t)) return 'industrial';
  return 'kingkong';
}

interface EstiloLadrillo {
  nombre: string;
  largo: number; alto: number; junta: number; // m (cara de soga)
  cols: number; filas: number;                // ladrillos que entran en la textura
  colores: string[]; mortero: string;
  // 2D (planta): color de la trama y del borde
  trama: string; fondo: string; borde: string;
}
export const ESTILO_LADRILLO: Record<TipoLadrillo, EstiloLadrillo> = {
  kingkong: { nombre: 'King Kong', largo: 0.24, alto: 0.09, junta: 0.015, cols: 4, filas: 10, colores: ['#b4542f', '#a94b29', '#c0603a', '#9f4524', '#b85a33'], mortero: '#d9cfc2', trama: '#c2410c', fondo: '#fed7aa', borde: '#c2410c' },
  industrial: { nombre: 'King Kong industrial', largo: 0.24, alto: 0.09, junta: 0.012, cols: 4, filas: 10, colores: ['#8f3a20', '#87351c', '#963f24', '#7f321a'], mortero: '#cfc6ba', trama: '#9a3412', fondo: '#fdba74', borde: '#9a3412' },
  pandereta: { nombre: 'Pandereta', largo: 0.23, alto: 0.09, junta: 0.015, cols: 4, filas: 10, colores: ['#d4804f', '#cc7646', '#dc8a59', '#c86f40'], mortero: '#e2d8cb', trama: '#ea580c', fondo: '#ffedd5', borde: '#ea580c' },
  bloque: { nombre: 'Bloque de concreto', largo: 0.39, alto: 0.19, junta: 0.01, cols: 3, filas: 6, colores: ['#9ea3a6', '#a7abad', '#969b9f', '#aeb2b4'], mortero: '#c9ccce', trama: '#64748b', fondo: '#e2e8f0', borde: '#475569' },
};

// Generador pseudoaleatorio con semilla (el mismo dibujo en cada render).
const rnd = (semilla: number) => { let s = semilla; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

const cache = new Map<string, { tex: THREE.CanvasTexture; ancho: number; alto: number }>();

function crear(clave: string, wPx: number, hPx: number, ancho: number, alto: number, dibujar: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = wPx; c.height = hPx;
  dibujar(c.getContext('2d')!);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const r = { tex, ancho, alto };
  cache.set(clave, r);
  return r;
}

/** Textura de ladrillo a escala: tamaño (m) que cubre y la textura. */
function baseLadrillo(tipo: TipoLadrillo) {
  const clave = `ladrillo:${tipo}`;
  const hecho = cache.get(clave);
  if (hecho) return hecho;
  const e = ESTILO_LADRILLO[tipo];
  const modU = e.largo + e.junta, modV = e.alto + e.junta;
  const ancho = e.cols * modU, alto = e.filas * modV;
  const PX = 1024 / Math.max(ancho, alto); // px por metro
  return crear(clave, Math.round(ancho * PX), Math.round(alto * PX), ancho, alto, g => {
    const r = rnd(tipo.length * 977 + 13);
    g.fillStyle = e.mortero; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    // Granos del mortero
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.06})`; g.fillRect(r() * g.canvas.width, r() * g.canvas.height, 1.5, 1.5); }
    const j = e.junta * PX, lw = e.largo * PX, lh = e.alto * PX;
    for (let f = 0; f < e.filas; f++) {
      const y = f * modV * PX + j / 2;
      const desfase = f % 2 ? (modU * PX) / 2 : 0; // aparejo de soga (trabado)
      for (let k = -1; k <= e.cols; k++) {
        const x = k * modU * PX + desfase + j / 2;
        g.fillStyle = e.colores[Math.floor(r() * e.colores.length)];
        g.fillRect(x, y, lw, lh);
        // Sombra inferior y luz superior: relieve
        g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x, y + lh - 3, lw, 3);
        g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, y, lw, 2);
        // Textura de la arcilla / del concreto
        const puntos = tipo === 'bloque' ? 160 : 70;
        for (let p = 0; p < puntos; p++) {
          g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.05 + r() * 0.08})` : `rgba(0,0,0,${0.05 + r() * 0.1})`;
          g.fillRect(x + r() * lw, y + r() * lh, tipo === 'bloque' ? 2 : 2.5, tipo === 'bloque' ? 2 : 1.5);
        }
        if (tipo === 'pandereta') {
          // Pandereta: cara rayada (estrías horizontales)
          g.strokeStyle = 'rgba(90,40,15,0.28)'; g.lineWidth = 1.2;
          for (let s = 1; s < 5; s++) { g.beginPath(); g.moveTo(x + 2, y + (lh * s) / 5); g.lineTo(x + lw - 2, y + (lh * s) / 5); g.stroke(); }
        }
        if (tipo === 'bloque') {
          // Bloque: bisel marcado en el contorno
          g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, lw - 2, lh - 2);
        }
      }
    }
  });
}

/** Material de muro de ladrillo con su textura (UV en metros). */
export function texturaLadrillo(tipo: TipoLadrillo, uvEnMetros = true, largo = 1, alto = 1): THREE.Texture {
  const b = baseLadrillo(tipo);
  const t = b.tex.clone();
  t.needsUpdate = true;
  if (uvEnMetros) t.repeat.set(1 / b.ancho, 1 / b.alto);
  else t.repeat.set(largo / b.ancho, alto / b.alto); // caja con UV 0..1 por cara
  return t;
}

/** Plancha de OSB (1.22 × 2.44 m): hojuelas orientadas, canto y tornillos. */
export function texturaOsb(uvEnMetros = true, largo = 1, alto = 1): THREE.Texture {
  const ancho = 1.22, altoP = 2.44;
  const b = cache.get('osb') || crear('osb', 512, 1024, ancho, altoP, g => {
    const W = g.canvas.width, H = g.canvas.height;
    const r = rnd(7);
    g.fillStyle = '#d6b27a'; g.fillRect(0, 0, W, H);
    const tonos = ['#c89b5c', '#e2c38e', '#b8874a', '#d9b375', '#a9773e', '#ebd2a4', '#c49256'];
    // Hojuelas: alargadas y orientadas a lo largo de la plancha (±25°)
    for (let i = 0; i < 2600; i++) {
      const l = 26 + r() * 46, a = 5 + r() * 9;
      g.save();
      g.translate(r() * W, r() * H);
      g.rotate(Math.PI / 2 + (r() - 0.5) * 0.9);
      g.fillStyle = tonos[Math.floor(r() * tonos.length)];
      g.globalAlpha = 0.55 + r() * 0.4;
      g.beginPath(); g.moveTo(-l / 2, -a / 2); g.lineTo(l / 2, -a / 3); g.lineTo(l / 2 - 3, a / 2); g.lineTo(-l / 2 + 2, a / 3); g.closePath(); g.fill();
      g.globalAlpha = 0.18; g.strokeStyle = '#6b4a20'; g.lineWidth = 0.8; g.stroke();
      g.restore();
    }
    g.globalAlpha = 1;
    // Canto de la plancha (junta entre planchas)
    g.strokeStyle = 'rgba(80,50,20,0.75)'; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4);
    // Tornillos cada ~30 cm en el contorno y en el parante del medio
    g.fillStyle = 'rgba(60,60,60,0.85)';
    const paso = H / 8;
    for (let y = paso / 2; y < H; y += paso) {
      [10, W / 2, W - 10].forEach(x => { g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill(); });
    }
    // Sello de fábrica
    g.fillStyle = 'rgba(30,64,175,0.35)'; g.font = 'bold 18px sans-serif'; g.fillText('OSB 3 · E1', W * 0.22, H * 0.52);
  });
  const t = b.tex.clone();
  t.needsUpdate = true;
  if (uvEnMetros) t.repeat.set(1 / ancho, 1 / altoP);
  else t.repeat.set(largo / ancho, alto / altoP);
  return t;
}

/** Drywall: placa blanca con juntas encintadas cada 1.22 m y tornillos. */
export function texturaDrywall(): THREE.Texture {
  const ancho = 1.22, alto = 2.44;
  const b = cache.get('drywall') || crear('drywall', 256, 512, ancho, alto, g => {
    const W = g.canvas.width, H = g.canvas.height;
    g.fillStyle = '#f3f3ef'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(203,213,225,0.55)'; g.fillRect(0, 0, 5, H); g.fillRect(W - 5, 0, 5, H); // cinta y masilla
    g.fillStyle = 'rgba(100,116,139,0.5)';
    for (let y = 16; y < H; y += H / 8) [8, W / 3, (2 * W) / 3, W - 8].forEach(x => { g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); });
  });
  const t = b.tex.clone();
  t.needsUpdate = true;
  t.repeat.set(1 / ancho, 1 / alto);
  return t;
}
