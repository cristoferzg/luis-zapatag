// Campo numérico que SÍ se puede borrar.
//
// Problema que resuelve: un <input type="number" value={n}> cuyo onChange hace
// `Number(e.target.value) || 0` (o `|| valorPorDefecto`, `Math.max(min, …)`) convierte el
// campo vacío en 0/valor por defecto en cada tecla: el usuario nunca puede dejarlo en blanco
// para escribir otro número (y queda "070", o vuelve a aparecer el valor).
//
// Cómo funciona (reemplazo directo de <input>, mismas props y mismo onChange):
// - Mientras se escribe, guarda el TEXTO tal cual ('' , '-', '0.', '1,5').
// - Solo avisa al padre (onChange) cuando el texto es un número válido; el padre lo
//   interpreta igual que antes (mismo cálculo en vivo).
// - Lo que el padre haga con el valor (límites, mínimos, redondeo) no reescribe el texto
//   mientras el campo está activo: se ve recién al salir del campo (on blur).
// - Si al salir el campo quedó vacío o incompleto, se llama al onChange del padre con el
//   campo vacío, así aplica SU valor por defecto (el `|| 0` / `|| 1` de siempre) o lo deja
//   vacío si su modelo lo permite (p. ej. '' = "automático").
// - Acepta coma decimal: se envía al padre con punto.
import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent, type InputHTMLAttributes, type Ref } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value'> & {
  value?: number | string | null;
  ref?: Ref<HTMLInputElement>;
};

const aTexto = (v: Props['value']) =>
  v === undefined || v === null || (typeof v === 'number' && !Number.isFinite(v)) ? '' : String(v);

/** Texto que todavía no es un número (se está escribiendo). */
const incompleto = (s: string) => {
  const t = s.trim().replace(',', '.');
  return t === '' || t === '-' || t === '.' || t === '-.' || !Number.isFinite(Number(t));
};

export default function InputNumero({ value, onChange, onFocus, onBlur, ref, type, inputMode, ...rest }: Props) {
  const [texto, setTexto] = useState(() => aTexto(value));
  const [activo, setActivo] = useState(false);
  const activoRef = useRef(false);

  // Fuera de edición, el campo siempre muestra el valor del padre.
  useEffect(() => { if (!activoRef.current) setTexto(aTexto(value)); }, [value, activo]);

  /** Llama al onChange del padre con el valor indicado (coma → punto). */
  const avisar = (e: ChangeEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>, s: string) => {
    if (!onChange) return;
    const el = e.target as HTMLInputElement;
    const normal = s.replace(',', '.');
    if (normal === el.value) { onChange(e as ChangeEvent<HTMLInputElement>); return; }
    // Para inputs de texto con coma: el padre recibe el número con punto.
    const target = new Proxy(el, {
      get(t, p) { if (p === 'value') return normal; const v = Reflect.get(t, p, t); return typeof v === 'function' ? v.bind(t) : v; },
    });
    onChange({ ...e, target, currentTarget: target } as unknown as ChangeEvent<HTMLInputElement>);
  };

  return (
    <input
      {...rest}
      ref={ref}
      type={type}
      inputMode={inputMode ?? (type === 'number' ? undefined : 'decimal')}
      value={texto}
      onFocus={e => { activoRef.current = true; setActivo(true); onFocus?.(e); }}
      onChange={e => {
        const s = e.target.value;
        setTexto(s);
        if (!incompleto(s)) avisar(e, s);
      }}
      onBlur={e => {
        activoRef.current = false;
        // Vacío o incompleto al salir: el padre decide (su valor por defecto, o vacío).
        if (incompleto(texto) && texto.trim() !== aTexto(value)) avisar(e, '');
        setActivo(false);
        setTexto(aTexto(value));
        onBlur?.(e);
      }}
    />
  );
}
