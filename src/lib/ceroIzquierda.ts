// =============================================================================
// Campos numéricos de toda la plataforma: al borrar un número el campo queda en
// "0" y lo que se escribe después salía como "02.5". Aquí, para cualquier campo
// numérico (type=number o inputmode decimal/numeric):
//  • al entrar al campo, si dice 0 se selecciona para que lo escrito lo reemplace;
//  • al escribir, se quitan los ceros de la izquierda ("02.5" → "2.5", "007" → "7").
// "0.5" y "0" se respetan. Se instala una sola vez (main.tsx).
// =============================================================================
const esNumerico = (el: EventTarget | null): el is HTMLInputElement =>
  el instanceof HTMLInputElement && (el.type === 'number' || /^(decimal|numeric)$/.test(el.inputMode || ''));

const sinCeros = (v: string) => v.replace(/^(-?)0+(?=\d)/, '$1');

export function instalarCeroIzquierda() {
  if (typeof document === 'undefined') return;
  document.addEventListener('focusin', e => {
    const el = e.target;
    if (!esNumerico(el)) return;
    if (/^-?0([.,]0*)?$/.test(el.value)) { try { el.select(); } catch { /* algunos tipos no permiten select */ } }
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (!esNumerico(el)) return;
    const v = el.value, nv = sinCeros(v);
    if (nv === v) return;
    if (el.type === 'number') {
      // El estado de React ya tiene el mismo número (2.5 = 02.5): solo se corrige lo que se ve.
      el.value = nv;
    } else {
      // Campo de texto: se avisa a React con el valor corregido.
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      const pos = Math.max(0, (el.selectionStart ?? nv.length) - (v.length - nv.length));
      set?.call(el, nv);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      try { el.setSelectionRange(pos, pos); } catch { /* nada */ }
    }
  }, true);
}
