import { existsSync } from 'node:fs';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { log } from './logger.js';

/**
 * Respaldo local en disco de cada participacion, escrito ADEMAS de (nunca en
 * vez de) el envio a Evius/Supabase - por si el sync-server pierde internet,
 * las credenciales de Evius vencen, o Supabase esta caido: el outbox
 * reintenta esos tres destinos pero solo mientras el proceso siga vivo (no
 * sobrevive un reinicio de la app durante el evento), asi que sin esto no
 * quedaba ningun registro local de que alguien participo. Un CSV simple, no
 * una base de datos - pensado para abrirse en Excel despues del evento, no
 * para consultarse en caliente.
 */
const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'participaciones.csv');
const HEADER = 'timestamp,name,email,code,productId,points\n';

let ready = false;

async function ensureLogFile(): Promise<void> {
  if (ready) return;
  await mkdir(LOG_DIR, { recursive: true });
  if (!existsSync(LOG_FILE)) await writeFile(LOG_FILE, HEADER, 'utf-8');
  ready = true;
}

/** Envuelve en comillas solo si hace falta (coma, comilla o salto de linea) - un CSV valido minimo. */
function csvField(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export interface ParticipationLogEntry {
  ts: number;
  name: string | null;
  email: string | null;
  code: string | null;
  productId: string | null;
  points: number;
}

/**
 * Nunca lanza ni bloquea el flujo de la participacion: si escribir a disco
 * falla (permisos, disco lleno), el peor caso es quedarse sin ESTA fila del
 * respaldo local, no tumbar el envio real a Evius/Supabase.
 */
export async function appendParticipationLog(entry: ParticipationLogEntry): Promise<void> {
  try {
    await ensureLogFile();
    const row =
      [
        new Date(entry.ts).toISOString(),
        csvField(entry.name),
        csvField(entry.email),
        csvField(entry.code),
        csvField(entry.productId),
        csvField(entry.points),
      ].join(',') + '\n';
    await appendFile(LOG_FILE, row, 'utf-8');
  } catch (error) {
    log({ event: 'local_log_write_failed', message: error instanceof Error ? error.message : String(error) });
  }
}
