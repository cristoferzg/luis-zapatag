// =============================================================================
// Campos numéricos de toda la plataforma. Muchos campos guardan "vacío" como 0,
// así que al borrar el número volvía a aparecer un 0 que no se podía quitar y lo
// escrito después salía "02.5". Aquí, para cualquier campo numérico (type=number
// o inputmode decimal/numeric):
//  • al entrar al campo, si dice 0 se selecciona para que lo escrito lo reemplace;
//  • al borrarlo todo el campo queda vacío (no reaparece el 0); al salir vuelve a 0;
//  • al escribir, se quitan los ceros de la izquierda ("02.5" → "2.5", "007" → "7").
// "0.5" y "0" se respetan. Se instala una sola vez (main.tsx).
// =============================================================================
const esNumerico = (el: EventTarget | null): el is HTMLInputElement =>
  el instanceof HTMLInputElement && (el.type === 'number' || /^(decimal|numeric)$/.test(el.inputMode || ''));

const sinCeros = (v: string) => v.replace(/^(-?)0+(?=\d)/, '$1');
const esCero = (v: string) => /^-?0([.,]0*)?$/.test(v);

// Setter del navegador: cambia lo que se ve sin tocar el registro interno de
// React, así React sigue detectando el cambio y actualiza su estado.
const setValor = (el: HTMLInputElement, v: string) =>
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, v);

/** Campos que el usuario dejó vacíos y que React rellenó con 0. */
const vaciados = new WeakSet<HTMLInputElement>();

export function instalarCeroIzquierda() {
  if (typeof document === 'undefined') return;
  document.addEventListener('focusin', e => {
    const el = e.target;
    if (!esNumerico(el)) return;
    if (esCero(el.value)) { try { el.select(); } catch { /* algunos tipos no permiten select */ } }
  });
  document.addEventListener('focusout', e => {
    const el = e.target;
    if (!esNumerico(el) || !vaciados.has(el)) return;
    vaciados.delete(el);
    if (el.value === '') setValor(el, '0'); // el estado guardado es 0
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (!esNumerico(el)) return;
    vaciados.delete(el);
    const v = el.value;
    if (v === '') {
      // React pondrá 0 al volver a dibujar: se deja el campo vacío para escribir.
      setTimeout(() => {
        if (document.activeElement === el && esCero(el.value)) { setValor(el, ''); vaciados.add(el); }
      }, 0);
      return;
    }
    const nv = sinCeros(v);
    if (nv === v) return;
    // Este listener corre antes que React: React verá el valor ya corregido.
    const pos = el.type === 'number' ? null : Math.max(0, (el.selectionStart ?? nv.length) - (v.length - nv.length));
    setValor(el, nv);
    if (pos != null) { try { el.setSelectionRange(pos, pos); } catch { /* nada */ } }
  }, true);
}
