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
 *
 * `experience=combined` lee `ranking_combined` (promedio catalogo+memory
 * match, ver docs/supabase-schema.sql) - es el ranking que decide el premio,
 * no el de esta experiencia sola. Antes se pedia `experience=catalogo`
 * (ranking_by_experience) y la pantalla de Ranking terminaba mostrando un
 * top 5 que no era el que en verdad definia el premio. La vista combinada
 * expone `final_score` en vez de `score`, se remapea aca para no tocar el
 * resto de la pantalla.
 */
export async function fetchTopRanking(): Promise<RankingEntry[]> {
  const config = getSyncConfig();
  if (!config) return [];

  try {
    const response = await fetch(`http://${config.host}:${config.port}/ranking?experience=combined`);
    if (!response.ok) return [];
    const rows = (await response.json()) as Array<{ participant_name: string | null; final_score: number; position: number }>;
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({ participant_name: row.participant_name, score: row.final_score, position: row.position }));
  } catch {
    return [];
  }
}

/**
 * Posicion y puntajes de una persona puntual en el ranking general
 * (combinado), consultada por email via el sync-server (GET
 * /my-position?email=..., ver gateway.ts#fetchMyCombinedPosition). Se usa en
 * ThankYou para dejar claro que el puntaje que se acaba de ver es solo de
 * esta experiencia, y mostrar por separado en que puesto va la persona en el
 * ranking general (el que decide el premio).
 */
export interface CombinedPositionEntry {
  position: number;
  finalScore: number;
  catalogoScore: number;
  memoryMatchScore: number;
}

export async function fetchMyCombinedPosition(email: string): Promise<CombinedPositionEntry | null> {
  const config = getSyncConfig();
  if (!config || !email) return null;

  try {
    const response = await fetch(`http://${config.host}:${config.port}/my-position?email=${encodeURIComponent(email)}`);
    if (!response.ok) return null;
    const body = (await response.json()) as { record: CombinedPositionEntry | null };
    return body.record;
  } catch {
    return null;
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
