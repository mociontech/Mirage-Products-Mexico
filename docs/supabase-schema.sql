-- Mirage - esquema de Supabase para el ranking compartido.
--
-- Un solo proyecto Supabase para las dos experiencias (catalogo, memory_match)
-- y los dos paises (Colombia, Mexico) - la diferenciacion es por columnas
-- (country, experience), nunca por proyectos/DBs separadas.
--
-- Corres esto una sola vez en el SQL editor de Supabase (o via `supabase db push`
-- si migran a CLI mas adelante). Pensado para pegarse tal cual.

-- =========================================================================
-- 1. Tabla base: una fila por (persona, pais, experiencia)
-- =========================================================================

create table if not exists participations (
  id             uuid primary key default gen_random_uuid(),
  participant_id text not null,                 -- email normalizado (trim + lowercase), ver nota abajo
  participant_name text,                        -- nombre tal cual lo registro la persona, nullable
  country        text not null,                  -- 'CO' | 'MX' (o el nombre completo, ver nota de convencion)
  experience     text not null,                  -- 'catalogo' | 'memory_match'
  score          numeric not null,
  submitted_at   timestamptz not null,
  created_at     timestamptz not null default now(),

  constraint participations_experience_check check (experience in ('catalogo', 'memory_match')),
  constraint participations_score_check check (score >= 0 and score <= 100),

  -- Regla de negocio central: una persona no puede participar dos veces en
  -- la misma experiencia, en el mismo pais. Esto es lo que de verdad impide
  -- que alguien duplique puntos - el guard del lado del cliente (localStorage)
  -- solo evita descubrir el rechazo tarde.
  constraint participations_unique_entry unique (participant_id, country, experience)
);

comment on table participations is
  'Una fila por persona+pais+experiencia. participant_id es el email normalizado (trim+lowercase) - misma llave que usa Evius para deduplicar attendees por (email, eventId).';

create index if not exists participations_country_experience_idx
  on participations (country, experience);

create index if not exists participations_participant_idx
  on participations (participant_id, country);

-- =========================================================================
-- 2. Ranking por experiencia individual (top N tal cual lo pide
--    GET /ranking?experience=catalogo en el sync-server)
-- =========================================================================

create or replace view ranking_by_experience as
select
  participant_id,
  participant_name,
  country,
  experience,
  score,
  submitted_at,
  rank() over (
    partition by country, experience
    order by score desc, submitted_at asc
  ) as position
from participations;

comment on view ranking_by_experience is
  'Ranking dentro de una sola experiencia. El sync-server la consulta via PostgREST con ?country=eq.CO&experience=eq.catalogo&order=position.asc&limit=10.';

-- =========================================================================
-- 3. Ranking combinado (el que decide el premio): promedia catalogo +
--    memory_match por persona, tratando la experiencia no jugada como 0.
--    "Deberia participar en las dos pero si solo lo hace en una, sacaria
--    50 puntos en el mejor de los casos" - ver conversacion del brief.
-- =========================================================================

create or replace view ranking_combined as
select
  participant_id,
  max(participant_name) as participant_name,
  country,
  coalesce(max(score) filter (where experience = 'catalogo'), 0)      as catalogo_score,
  coalesce(max(score) filter (where experience = 'memory_match'), 0)  as memory_match_score,
  (
    coalesce(max(score) filter (where experience = 'catalogo'), 0)
    + coalesce(max(score) filter (where experience = 'memory_match'), 0)
  ) / 2.0 as final_score,
  max(submitted_at) as last_submitted_at,
  rank() over (
    partition by country
    order by
      (
        coalesce(max(score) filter (where experience = 'catalogo'), 0)
        + coalesce(max(score) filter (where experience = 'memory_match'), 0)
      ) / 2.0 desc,
      max(submitted_at) asc
  ) as position
from participations
group by participant_id, country;

comment on view ranking_combined is
  'Ranking final por persona (promedio de las dos experiencias, 0 si no jugo una). Es el que decide el premio - se consulta por pais via ?country=eq.CO&order=position.asc&limit=10.';

-- =========================================================================
-- 4. Row Level Security
--
--    Catalogo escribe via su sync-server con la service_role key (bypassa
--    RLS por diseno de Supabase). Memory Match no tiene backend propio: el
--    cliente (navegador) inserta directo contra Supabase con la publishable
--    (anon) key, asi que SI necesita una policy de insert explicita - ver
--    4b abajo. Las vistas de ranking siguen siendo publicas de solo lectura
--    (la pantalla de ranking en el pitch/celular las lee sin autenticacion).
-- =========================================================================

alter table participations enable row level security;

-- Nadie por fuera de la service_role key puede leer la tabla base
-- directamente - solo las vistas de ranking, mas abajo, quedan expuestas de
-- forma publica y de solo lectura. Escritura: service_role (catalogo) y,
-- via la policy 4b, anon restringido a memory_match (Memory Match).

-- =========================================================================
-- 4b. Insert acotado para anon (solo Memory Match)
--
--    Memory Match inserta desde el navegador con la anon key, por lo que no
--    puede usar service_role. Esta policy le permite insertar en
--    `participations` pero SOLO filas con experience = 'memory_match' - las
--    de catalogo siguen exclusivamente a cargo del sync-server con
--    service_role. El grant de columnas evita que anon pueda escribir
--    `id` o `created_at` directamente.
-- =========================================================================

grant insert (participant_id, participant_name, country, experience, score, submitted_at)
  on participations to anon;

create policy "anon puede insertar participaciones de memory_match"
  on participations
  for insert
  to anon
  with check (experience = 'memory_match');

-- El cliente de Memory Match (src/services/api.ts) manda un insert simple
-- (`Prefer: return=minimal`), nunca `resolution=merge-duplicates`: ese
-- header hace que PostgREST arme un `INSERT ... ON CONFLICT DO UPDATE`, y
-- Postgres exige privilegio de UPDATE (y, segun las pruebas, tambien
-- termina exigiendo SELECT) para planear esa consulta aunque nunca haya
-- conflicto real - con anon solo autorizado a INSERT, eso tumbaba TODO
-- insert con 401/42501, no solo el caso de reintento real. Un reintento
-- genuino de la misma participacion cae en la restriccion unique de mas
-- arriba y responde 409, lo cual esta bien: el cliente ya evita el reintento
-- con `hasEmailPlayedLocally`.

-- Las vistas heredan RLS de la tabla base en Postgres >= 15 salvo que se
-- creen como `security_invoker = false` (comportamiento por defecto de
-- Supabase para vistas: corren con los privilegios del dueno). Confirmar
-- en el dashboard de Supabase que ranking_by_experience y ranking_combined
-- tengan grant de SELECT para el rol `anon`:

grant select on ranking_by_experience to anon, authenticated;
grant select on ranking_combined to anon, authenticated;

-- =========================================================================
-- 5. Como insertar desde el sync-server (referencia, no se ejecuta aca)
-- =========================================================================

-- POST {RANKING_DB_URL}/rest/v1/participations
-- Headers:
--   apikey: <service_role key>
--   Authorization: Bearer <service_role key>
--   Content-Type: application/json
--   Prefer: resolution=merge-duplicates,return=minimal
-- Body:
--   {
--     "participant_id": "ana@mail.com",
--     "participant_name": "Ana",
--     "country": "CO",
--     "experience": "catalogo",
--     "score": 100,
--     "submitted_at": "2026-09-03T15:30:00.000Z"
--   }
--
-- El header Prefer: resolution=merge-duplicates hace que un reintento del
-- outbox (mismo participant_id+country+experience) actualice la fila en vez
-- de fallar con 409 - el outbox ya deduplica por idempotencyKey antes de
-- reintentar, asi que en la practica esto solo protege contra una carrera
-- rara entre dos intentos casi simultaneos.

-- Lectura de ranking (top 10 combinado de Colombia):
-- GET {RANKING_DB_URL}/rest/v1/ranking_combined?country=eq.CO&order=position.asc&limit=10
-- Headers: apikey: <anon key>

-- =========================================================================
-- Nota sobre el valor de `country`
-- =========================================================================
-- Definir UNA convencion y usarla igual en los 3 lugares que escriben esta
-- columna (sync-server de catalogo, sync-server/backend de memory match, y
-- cualquier version celular futura): o siempre 'CO'/'MX', o siempre
-- 'Colombia'/'Mexico', nunca mezclado - de lo contrario ranking_combined
-- particiona mal y aparecen "paises" duplicados con distinta capitalizacion.
-- Recomendado: ISO 3166-1 alpha-2 ('CO', 'MX') por ser el formato mas dificil
-- de escribir con typos.
