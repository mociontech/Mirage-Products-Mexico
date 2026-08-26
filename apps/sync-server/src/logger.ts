import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'events.log');
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

function rotateIfNeeded(): void {
  if (!existsSync(LOG_FILE)) return;
  if (statSync(LOG_FILE).size < MAX_SIZE_BYTES) return;
  renameSync(LOG_FILE, join(LOG_DIR, `events-${Date.now()}.log`));
}

/** Log de eventos y conexiones para diagnostico en sitio. Rota a los 5 MB. */
export function log(entry: Record<string, unknown>): void {
  ensureLogDir();
  rotateIfNeeded();
  const line = JSON.stringify({ ...entry, loggedAt: new Date().toISOString() });
  appendFileSync(LOG_FILE, line + '\n');
  console.log(line);
}
