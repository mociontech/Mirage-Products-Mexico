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
