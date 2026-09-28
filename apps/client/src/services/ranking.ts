import { getSyncConfig } from '../sync/connection.config';

export interface RankingEntry {
  participant_name: string | null;
  score: number;
  position: number;
}

/**
 * Lee el top 10 compartido desde el sync-server local (GET /ranking, ver
 * gateway.ts#fetchRanking) - nunca directo contra Supabase desde la tablet,
 * porque el sync-server es quien tiene la service_role key. Usa el mismo
 * host/puerto que la conexion de sync (connection.config.ts): si la tablet
 * no esta configurada (Settings) o el server no responde, no hay ranking
 * que mostrar y la pantalla debe manejarlo como lista vacia, no como error.
 */
export async function fetchTopRanking(): Promise<RankingEntry[]> {
  const config = getSyncConfig();
  if (!config) return [];

  try {
    const response = await fetch(`http://${config.host}:${config.port}/ranking?experience=catalogo`);
    if (!response.ok) return [];
    const rows = (await response.json()) as RankingEntry[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

/**
 * Cache en memoria del ultimo Top 10 pedido - permite que Ranking.tsx pinte
 * la lista de inmediato al montar (sin esperar el round-trip al sync-server)
 * si alguien ya disparo prefetchTopRanking() antes, en vez de arrancar
 * siempre en [] mientras carga. Ranking.tsx sigue haciendo su propio fetch
 * al montar - esto solo evita el parpadeo inicial, no lo reemplaza.
 */
let cachedTopRanking: RankingEntry[] | null = null;

/** Lee el cache sin disparar ningun fetch - null si nunca se prefeteo. */
export function getCachedTopRanking(): RankingEntry[] | null {
  return cachedTopRanking;
}

/**
 * Dispara el fetch del ranking por adelantado (apenas se confirma el
 * producto, antes de ThankYou) para que el round-trip al sync-server ya
 * este en curso o resuelto cuando el visitante llegue a Ranking.
 */
export function prefetchTopRanking(): void {
  fetchTopRanking().then((rows) => {
    cachedTopRanking = rows;
  });
}
