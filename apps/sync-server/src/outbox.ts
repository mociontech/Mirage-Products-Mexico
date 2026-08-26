import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { log } from './logger.js';

export type OutboxDestination = 'dataHub' | 'rankingDb';

interface OutboxRecord {
  id: string;
  destination: OutboxDestination;
  idempotencyKey: string;
  payload: unknown;
  attempts: number;
  nextAttemptAt: number;
  status: 'pending' | 'delivered';
  createdAt: number;
}

type Deliverer = (payload: unknown) => Promise<boolean>;

const OUTBOX_DIR = join(process.cwd(), 'outbox');
const OUTBOX_FILE = join(OUTBOX_DIR, 'records.jsonl');
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 5 * 60_000;
const POLL_INTERVAL_MS = 3000;

/**
 * Patron outbox: el resultado se persiste en disco antes de intentar el
 * envio, reintentos con backoff exponencial, purga solo tras 2xx,
 * idempotencyKey por sesion para que un doble flush no duplique registros
 * (seccion 6 del brief). El archivo es un log de solo-apendice (WAL): cada
 * id conserva su ultima linea como estado vigente, asi que al reiniciar el
 * proceso se reconstruye sin perder nada pendiente.
 */
export class Outbox {
  private readonly records = new Map<string, OutboxRecord>();
  private readonly deliverers: Record<OutboxDestination, Deliverer>;

  constructor(deliverers: Record<OutboxDestination, Deliverer>) {
    this.deliverers = deliverers;
    this.loadFromDisk();
    setInterval(() => {
      this.tick().catch((error: unknown) => log({ event: 'outbox_tick_error', message: String(error) }));
    }, POLL_INTERVAL_MS);
  }

  private loadFromDisk(): void {
    if (!existsSync(OUTBOX_FILE)) return;
    const lines = readFileSync(OUTBOX_FILE, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      const record = JSON.parse(line) as OutboxRecord;
      this.records.set(record.id, record);
    }
  }

  private appendToDisk(record: OutboxRecord): void {
    if (!existsSync(OUTBOX_DIR)) mkdirSync(OUTBOX_DIR, { recursive: true });
    appendFileSync(OUTBOX_FILE, `${JSON.stringify(record)}\n`);
  }

  /** No-op si ya se encolo (o entrego) antes con el mismo idempotencyKey+destino. */
  enqueue(destination: OutboxDestination, idempotencyKey: string, payload: unknown): void {
    const id = `${idempotencyKey}:${destination}`;
    if (this.records.has(id)) {
      log({ event: 'outbox_duplicate_skipped', id });
      return;
    }

    const record: OutboxRecord = {
      id,
      destination,
      idempotencyKey,
      payload,
      attempts: 0,
      nextAttemptAt: Date.now(),
      status: 'pending',
      createdAt: Date.now(),
    };
    this.records.set(id, record);
    this.appendToDisk(record);
  }

  private async tick(): Promise<void> {
    const now = Date.now();
    for (const record of this.records.values()) {
      if (record.status !== 'pending' || record.nextAttemptAt > now) continue;

      const deliver = this.deliverers[record.destination];
      const delivered = await deliver(record.payload).catch(() => false);

      if (delivered) {
        record.status = 'delivered';
        this.appendToDisk(record);
        log({ event: 'outbox_delivered', id: record.id });
      } else {
        record.attempts += 1;
        record.nextAttemptAt = now + Math.min(BASE_DELAY_MS * 2 ** record.attempts, MAX_DELAY_MS);
        this.appendToDisk(record);
      }
    }
  }
}
