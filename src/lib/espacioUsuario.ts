// Trabajo guardado en el equipo, separado por usuario.
//
// Los apartados guardan lo que se está diseñando (techo abierto, plano de Obra Civil,
// cotización de Drywall, CarpiMetal, catálogo de precios, copias de la base…) en el
// almacenamiento del equipo. Si en el mismo celular o PC entra otra persona, NO debe ver
// eso: al entrar alguien distinto, lo del anterior se aparta en su propio cajón y se saca
// el cajón del que entra (vacío si es la primera vez: empieza en blanco). Cuando el
// anterior vuelve a entrar, recupera su trabajo tal como lo dejó.
const K_DUENO = 'innova_espacio_dueno';
const K_CAJON = (dueno: string) => `innova_espacio__${dueno}`;

// Claves que son trabajo o datos de un usuario. Las preferencias del equipo (sesión,
// avisos, calidad del 3D…) no se tocan.
const PREFIJOS = [
  'innova_techos_', 'techos', 'concreto_', 'drywall_', 'melamina_', 'gasfiteria_', 'obra_', 'catalogo_', 'carpi_',
  'innova_herreria_', 'innova_catalogo', 'innova_costs_catalog', 'innova_precios_mercado',
  'innova_client_', 'innova_cotizador_a_techos', 'innova_propuesta', 'innova_foto_propuesta',
  'innova_prop_', 'innova_ultima_impresion', 'innova_archivo_compartido', 'innova_vista_',
  'innova_logo_', 'innova_letterhead_', 'innova_watched_videos_', 'innova_ia_condiciones_ok',
  'sync_cache_', 'db_sync_queue', 'projects', 'herreria_',
];
const esDelUsuario = (k: string) => PREFIJOS.some(p => k.startsWith(p)) || k.endsWith('_backup_snapshot_data') || k.endsWith('_backup_snapshot_time');

function ls(): Storage | null { try { return window.localStorage; } catch { return null; } }

/** Primer arranque con esta versión: lo que hay en el equipo es de quien ya está adentro. */
export function fijarDuenoSiFalta(id?: string | null) {
  const s = ls(); if (!s || !id) return;
  try { if (!s.getItem(K_DUENO)) s.setItem(K_DUENO, id); } catch { /* sin almacenamiento */ }
}

/** Al entrar con PIN: si es otra persona, guarda lo del anterior y saca lo del que entra.
 *  Devuelve true si cambió de persona (conviene recargar para que todo se abra limpio). */
export function cambiarEspacioDeTrabajo(nuevo: string): boolean {
  const s = ls(); if (!s || !nuevo) return false;
  try {
    const anterior = s.getItem(K_DUENO);
    if (anterior === nuevo) return false;
    // Primera vez con esta versión: no se sabe de quién es lo guardado; se queda con quien entra.
    if (!anterior) { s.setItem(K_DUENO, nuevo); return false; }
    const claves: string[] = [];
    for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k && esDelUsuario(k)) claves.push(k); }
    {
      const cajon: Record<string, string> = {};
      claves.forEach(k => { const v = s.getItem(k); if (v !== null) cajon[k] = v; });
      try { s.setItem(K_CAJON(anterior), JSON.stringify(cajon)); }
      catch {
        // Equipo lleno: se guarda el trabajo sin las copias de la nube (se vuelven a bajar).
        Object.keys(cajon).forEach(k => { if (k.startsWith('sync_cache_') || k.endsWith('_backup_snapshot_data')) delete cajon[k]; });
        try { s.setItem(K_CAJON(anterior), JSON.stringify(cajon)); } catch { /* sin espacio */ }
      }
    }
    claves.forEach(k => s.removeItem(k));
    const propio = s.getItem(K_CAJON(nuevo));
    if (propio) {
      try { Object.entries(JSON.parse(propio) as Record<string, string>).forEach(([k, v]) => s.setItem(k, v)); } catch { /* cajón dañado */ }
      s.removeItem(K_CAJON(nuevo));
    }
    s.setItem(K_DUENO, nuevo);
    return true;
  } catch { return false; }
}
