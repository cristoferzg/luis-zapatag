// Campo de medida para los editores (Obra Civil, Drywall…): se escribe libre y se
// aplica al terminar (Enter o al salir del campo), así el 3D no se recalcula con cada
// tecla. Acepta coma o punto decimal (teclado numérico en español de Windows), la rueda
// del mouse y las flechas ↑/↓ suben o bajan de a un paso cuando el campo está activo.
import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number | undefined;
  onCommit: (v: number | undefined) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Si se deja vacío: undefined (p. ej. "automático"). Si no, vuelve al valor anterior. */
  permitirVacio?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  title?: string;
}

const redondear = (v: number) => Math.round(v * 1000) / 1000;
const texto = (v: number | undefined) => (v === undefined || !Number.isFinite(v) ? '' : String(redondear(v)));

export default function CampoNumero({ value, onCommit, step = 0.05, min, max, permitirVacio, placeholder, disabled, className, title }: Props) {
  const [txt, setTxt] = useState(texto(value));
  const editando = useRef(false);
  const ref = useRef<HTMLInputElement>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimo = useRef(value);
  ultimo.current = value;

  // Si el valor cambia desde afuera (deshacer, otro elemento…) y no se está escribiendo.
  useEffect(() => { if (!editando.current) setTxt(texto(value)); }, [value]);

  const limitar = (v: number) => {
    let r = v;
    if (min !== undefined) r = Math.max(min, r);
    if (max !== undefined) r = Math.min(max, r);
    return redondear(r);
  };
  const leer = (s: string): number | null | undefined => {
    const t = s.trim().replace(',', '.');
    if (!t) return permitirVacio ? undefined : null;
    const v = parseFloat(t);
    return Number.isFinite(v) ? limitar(v) : null;
  };
  const aplicar = (s: string) => {
    if (espera.current) { clearTimeout(espera.current); espera.current = null; }
    const v = leer(s);
    if (v === null) { setTxt(texto(ultimo.current)); return; } // inválido: se deja como estaba
    setTxt(texto(v));
    if (v !== ultimo.current) onCommit(v);
  };
  const pasoDe = (dir: 1 | -1, grande: boolean) => {
    const base = leer(txt) ?? ultimo.current ?? min ?? 0;
    const nuevo = limitar((base ?? 0) + dir * step * (grande ? 10 : 1));
    setTxt(texto(nuevo));
    // Se aplica cuando se deja de girar la rueda / soltar la flecha (el 3D no se rehace con cada paso).
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(() => { espera.current = null; if (nuevo !== ultimo.current) onCommit(nuevo); }, 350);
  };

  // Rueda del mouse: solo con el campo activo; no hace zoom al plano ni mueve la página.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (document.activeElement !== el || disabled) return;
      e.preventDefault(); e.stopPropagation();
      pasoDe(e.deltaY < 0 ? 1 : -1, e.shiftKey);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });
  useEffect(() => () => { if (espera.current) clearTimeout(espera.current); }, []);

  return (
    <input ref={ref} type="text" inputMode="decimal" autoComplete="off" spellCheck={false}
      value={txt} placeholder={placeholder} disabled={disabled} title={title ?? 'Escribe la medida y presiona Enter · rueda del mouse o ↑/↓ para ajustar'}
      onFocus={e => { editando.current = true; e.target.select(); }}
      onChange={e => { if (/^-?[0-9]*[.,]?[0-9]*$/.test(e.target.value)) setTxt(e.target.value); }}
      onBlur={() => { editando.current = false; aplicar(txt); }}
      onKeyDown={e => {
        e.stopPropagation(); // que no dispare atajos del plano (borrar, mover, herramientas)
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); // al salir se aplica
        else if (e.key === 'Escape') { setTxt(texto(ultimo.current)); editando.current = false; (e.target as HTMLInputElement).blur(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); pasoDe(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey); }
      }}
      className={className} />
  );
}
