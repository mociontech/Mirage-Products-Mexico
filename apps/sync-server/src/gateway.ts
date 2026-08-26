import { log } from './logger.js';

/**
 * Destinos de internet, configurados por variable de entorno - nunca
 * hardcodeados. Ninguno esta configurado todavia (el data hub y la DB de
 * rankings los define la empresa/el equipo, ver README); mientras tanto
 * cualquier intento de entrega falla limpio y el outbox sigue reintentando,
 * exactamente igual que si no hubiera internet.
 */
const DATA_HUB_URL = process.env.DATA_HUB_URL;
const DATA_HUB_API_KEY = process.env.DATA_HUB_API_KEY;
const RANKING_DB_URL = process.env.RANKING_DB_URL;
const RANKING_DB_API_KEY = process.env.RANKING_DB_API_KEY;

async function postJson(url: string, body: unknown, apiKey?: string): Promise<boolean> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return response.ok;
}

/** Solo escritura: participaciones hacia el data hub de la empresa. */
export async function deliverToDataHub(payload: unknown): Promise<boolean> {
  if (!DATA_HUB_URL) {
    log({ event: 'gateway_not_configured', destination: 'dataHub' });
    return false;
  }
  return postJson(DATA_HUB_URL, payload, DATA_HUB_API_KEY);
}

/** Escritura hacia la DB propia (Supabase/Firebase, a definir) para poder construir rankings. */
export async function deliverToRankingDb(payload: unknown): Promise<boolean> {
  if (!RANKING_DB_URL) {
    log({ event: 'gateway_not_configured', destination: 'rankingDb' });
    return false;
  }
  return postJson(RANKING_DB_URL, payload, RANKING_DB_API_KEY);
}

export type RankingResult = { status: 'not_configured' } | { status: 'unavailable' } | { status: 'ok'; data: unknown };

/** Lectura del ranking compartido (Top 10 por experiencia + vista global). */
export async function fetchRanking(experience: string): Promise<RankingResult> {
  if (!RANKING_DB_URL) return { status: 'not_configured' };
  try {
    const response = await fetch(`${RANKING_DB_URL}/ranking?experience=${encodeURIComponent(experience)}`, {
      headers: RANKING_DB_API_KEY ? { Authorization: `Bearer ${RANKING_DB_API_KEY}` } : undefined,
    });
    if (!response.ok) return { status: 'unavailable' };
    return { status: 'ok', data: await response.json() };
  } catch {
    return { status: 'unavailable' };
  }
}
