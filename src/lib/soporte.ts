// Ayuda y soporte: un chat por usuario en `soporte_chats/<ws>`. El usuario escribe, el
// asistente responde (en el servidor) y con "Hablar con Innova" la conversación pasa al
// administrador. Asesorías y reportes del chat se guardan además como asesoría/ticket.
import { arrayUnion, collection, doc, increment, onSnapshot, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from './firebase';

export type DeMensaje = 'usuario' | 'asistente' | 'admin' | 'sistema';
export interface MensajeSoporte {
  id: string;
  de: DeMensaje;
  texto?: string;
  foto?: string;                 // imagen comprimida (data URL)
  tarjeta?: { tipo: 'asesoria' | 'reporte'; refId: string; titulo: string; detalle: string };
  ir?: string;                   // apartado al que lleva el botón del asistente
  fecha: string;
}
export interface ChatSoporte {
  ws: string;
  nombre?: string;
  mensajes?: MensajeSoporte[];
  conPersona?: boolean;
  sinLeerAdmin?: number;
  sinLeerUsuario?: number;
  ultimo?: string;
  ultimoDe?: DeMensaje;
  actualizado?: string;
  resuelto?: boolean;
  fijada?: boolean;              // el admin la dejó arriba de la bandeja
  pospuestaHasta?: string;       // ISO: oculta en "Pendientes" hasta esa fecha
}

export const wsDe = (id?: string) => String(id || '').replace(/^user_/, '');
const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const recortar = (t: string, n = 120) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

export function escucharChat(ws: string, cb: (c: ChatSoporte | null) => void): () => void {
  return onSnapshot(doc(db, 'soporte_chats', ws), s => cb(s.exists() ? (s.data() as ChatSoporte) : null), () => cb(null));
}
export function escucharBandeja(cb: (cs: ChatSoporte[]) => void): () => void {
  // Solo en el servidor local de pruebas (capturas): una bandeja simulada.
  if (import.meta.env.DEV && (window as any).__bandejaSimulada) { cb((window as any).__bandejaSimulada); return () => {}; }
  return onSnapshot(collection(db, 'soporte_chats'), s => {
    const l = s.docs.map(d => ({ ...(d.data() as ChatSoporte), ws: d.id }));
    l.sort((a, b) => String(b.actualizado || '').localeCompare(String(a.actualizado || '')));
    cb(l);
  }, () => cb([]));
}

/** Agrega un mensaje al chat de `ws`. Quién lo lee después lo marca como leído. */
export async function agregarMensaje(ws: string, m: Omit<MensajeSoporte, 'id' | 'fecha'>, extra: Partial<ChatSoporte> = {}, nombre?: string) {
  const msg: MensajeSoporte = { id: nuevoId(m.de[0]), fecha: new Date().toISOString(), ...m };
  const resumen = m.texto || (m.foto ? '📷 Foto' : m.tarjeta?.titulo || '');
  const avisa: Record<string, any> = {};
  // Si el usuario vuelve a escribir, la conversación se reabre y deja de estar pospuesta.
  if (m.de === 'usuario') { avisa.sinLeerAdmin = increment(1); avisa.resuelto = false; avisa.pospuestaHasta = null; }
  if (m.de === 'admin') avisa.sinLeerUsuario = increment(1);
  // Sin esperar al servidor: el mensaje aparece al instante (la base lo muestra localmente)
  // y se sincroniza en cuanto hay conexión.
  setDoc(doc(db, 'soporte_chats', ws), {
    ws, mensajes: arrayUnion(msg), ultimo: recortar(resumen), ultimoDe: m.de, actualizado: msg.fecha,
    ...(nombre ? { nombre } : {}), ...avisa, ...extra,
  }, { merge: true }).catch(e => console.warn('No se pudo guardar el mensaje de soporte:', e));
  return msg;
}
/** Cambia datos de la conversación sin agregar mensaje (fijar, posponer, resolver). */
export const ajustarChat = (ws: string, datos: Partial<ChatSoporte> | Record<string, any>) =>
  setDoc(doc(db, 'soporte_chats', ws), datos, { merge: true }).catch(() => {});
export const marcarLeido = (ws: string, quien: 'admin' | 'usuario') =>
  setDoc(doc(db, 'soporte_chats', ws), quien === 'admin' ? { sinLeerAdmin: 0 } : { sinLeerUsuario: 0 }, { merge: true }).catch(() => {});

/** Pide respuesta al asistente (servidor). Devuelve false si no está disponible. */
export async function preguntarAsistente(pregunta: string): Promise<'ok' | 'no' | 'tope'> {
  try {
    await httpsCallable(getFunctions(app, 'us-central1'), 'asistenteSoporte', { timeout: 25000 })({ pregunta });
    return 'ok';
  } catch (e: any) {
    return /TOPE_DIA/.test(String(e?.message || '')) ? 'tope' : 'no';
  }
}

// Respuestas sin conexión al asistente (o con la IA apagada): lo más preguntado.
const FAQ: [RegExp, string, string?][] = [
  [/losa|entrepiso/i, 'Para una losa: en Obra Civil elige "Losa" en la barra de abajo y toca dos esquinas opuestas. El metrado (concreto, acero, encofrado) sale solo.', 'concreto'],
  [/muro|pared|ladrillo/i, 'Para un muro: en Obra Civil elige "Muro" y toca el inicio y el final; sigue tocando para encadenar. El material se elige arriba.', 'concreto'],
  [/melamina|closet|ropero|repostero|mueble de cocina|despiece/i, 'En Melamina toca el tipo de mueble (closet, cocina, repostero…), pon sus medidas y en "Cortes" sale la lista en mm y el plano de cada tablero para llevar al local.', 'melamina'],
  [/electric|tomacorriente|interruptor|tablero|cuadro de cargas|pozo a tierra|cableado|luminaria/i, 'En Electricidad pon las luces, interruptores, tomacorrientes, el tablero y el pozo a tierra sobre el plano; toca "Sugerir circuitos" y luego "Trazar automáticamente": salen las tuberías, los cables, el cuadro de cargas, los materiales y el presupuesto por puntos.', 'electricidad'],
  [/gasfiter|tuber[ií]a|desag[uü]e|agua fr[ií]a|agua caliente|inodoro|ca[nñ]er[ií]a/i, 'En Gasfitería pon los aparatos (inodoro, lavatorio, ducha…) sobre el plano y toca "Trazar automáticamente": salen las tuberías, los codos y tees, los materiales y el presupuesto por puntos.', 'gasfiteria'],
  [/drywall|tabique|cielo/i, 'En Drywall elige "Tabique" y toca el inicio y el final. Con "Capas" ves u ocultas la obra y el techo de fondo.', 'drywall'],
  [/presupuesto|precio|costo|sin precio/i, 'El presupuesto usa los precios de tu catálogo. Si ves "sin precio", ponlo una vez en Precios y se usa siempre. El total con IGV está en Techos → Presupuesto → Presupuesto formal.', 'precios'],
  [/boceto|foto|plano a mano/i, 'Sube la foto de tu dibujo a mano en Techos → botón ? → "Foto de tu boceto". El techo se arma solo con tus medidas (10 créditos).', 'techos'],
  [/techo|tijeral|viga|columna|correa/i, 'En Techos toca el botón ? y elige "Asistente con medidas" (dos aguas, una agua, arco…) o "Dibujar libre". Con el dedo apoyado ves una lupa con la medida.', 'techos'],
  [/puerta|port[oó]n|reja|ventana|carpinter/i, 'En Carpintería Metálica toca ? → "Marco de puerta, ventana o reja" y toca dos esquinas: el marco se arma con cortes a 45°.', 'carpinteria'],
  [/cr[eé]dito|plan|recarga|membres/i, 'Los créditos se usan en las funciones inteligentes (boletas sin QR, planos a mano, redacción). Los planes y recargas están en Membresía Premium.', 'membresia'],
  [/boleta|gasto|factura/i, 'En Gastos toca "Escanear boleta": con QR es gratis, sin QR usa 1 crédito.', 'gastos'],
  [/moneda|d[oó]lar|sol(es)?\b/i, 'La moneda se cambia en Configuración → datos de la empresa. Se aplica en todo el sistema.', 'settings'],
];
export function respuestaLocal(pregunta: string): { texto: string; ir?: string } | null {
  const f = FAQ.find(([re]) => re.test(pregunta));
  return f ? { texto: f[1], ir: f[2] } : null;
}

/** Foto del usuario reducida (máx. 900 px, JPEG) para guardarla en el chat. */
export function comprimirFoto(file: File): Promise<string> {
  return new Promise((ok, mal) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.62));
    };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('imagen')); };
    img.src = url;
  });
}
