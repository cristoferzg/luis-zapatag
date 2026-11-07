// Red de seguridad: si el navegador traduce la página a la fuerza (Google Translate),
// cambia nodos de texto por <font> y React falla al quitarlos o insertar junto a ellos
// ("NotFoundError: Failed to execute 'removeChild' on 'Node'"). En vez de romper la
// app, se ignora la operación sobre un nodo que ya no es hijo.
export function tolerarTraductor(): void {
  if (typeof Node !== 'function' || !Node.prototype) return;
  const quitar = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, hijo: T): T {
    if (hijo.parentNode !== this) return hijo;
    return quitar.call(this, hijo) as T;
  };
  const insertar = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, nuevo: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return insertar.call(this, nuevo, null) as T;
    return insertar.call(this, nuevo, ref) as T;
  };
}
