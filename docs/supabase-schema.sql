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
--
--    event_day: el evento dura una semana y el ranking (y el premio) se
--    maneja POR DIA - quien va hoy compite solo contra quien jugo hoy y
--    puede reclamar su premio el mismo dia, sin tener que esperar a que
--    termine la semana. event_day convierte submitted_at (timestamptz, UTC)
--    a la fecha local del pais del evento - Colombia y Mexico estan en
--    zonas horarias distintas (America/Bogota vs America/Mexico_City), asi
--    que el "dia" de una participacion se calcula con el huso horario que
--    corresponda a su propio country, nunca UTC directo (eso correria el
--    corte de dia varias horas, cortando participaciones nocturnas al dia
--    equivocado). position se recalcula partition by (..., event_day): cada
--    dia arranca en position 1 de nuevo.
-- =========================================================================

create or replace view ranking_by_experience as
select
  participant_id,
  participant_name,
  country,
  experience,
  score,
  submitted_at,
  (submitted_at at time zone 'utc' at time zone (case when country = 'CO' then 'America/Bogota' else 'America/Mexico_City' end))::date as event_day,
  rank() over (
    partition by country, experience, (submitted_at at time zone 'utc' at time zone (case when country = 'CO' then 'America/Bogota' else 'America/Mexico_City' end))::date
    order by score desc, submitted_at asc
  ) as position
from participations;

comment on view ranking_by_experience is
  'Ranking dentro de una sola experiencia, POR DIA (event_day, huso horario del pais). El sync-server la consulta via PostgREST con ?country=eq.CO&experience=eq.catalogo&event_day=eq.YYYY-MM-DD&order=position.asc&limit=10.';

-- =========================================================================
-- 3. Ranking combinado (el que decide el premio): promedia catalogo +
--    memory_match por persona, tratando la experiencia no jugada como 0.
--    "Deberia participar en las dos pero si solo lo hace en una, sacaria
--    50 puntos en el mejor de los casos" - ver conversacion del brief.
--
--    Tambien POR DIA (ver comentario de event_day arriba): se agrupa por
--    (participant_id, country, event_day), no solo por persona+pais - si
--    alguien juega catalogo un dia y memory_match otro dia distinto, cuentan
--    como dos participaciones de dias distintos (cada una compite y puede
--    ganar el premio de SU dia), no se promedian entre si. El caso normal -
--    ambas experiencias el mismo dia de visita - sigue promediandose igual
--    que antes.
-- =========================================================================

create or replace view ranking_combined as
with tagged as (
  select
    *,
    (submitted_at at time zone 'utc' at time zone (case when country = 'CO' then 'America/Bogota' else 'America/Mexico_City' end))::date as event_day
  from participations
)
select
  participant_id,
  max(participant_name) as participant_name,
  country,
  event_day,
  coalesce(max(score) filter (where experience = 'catalogo'), 0)      as catalogo_score,
  coalesce(max(score) filter (where experience = 'memory_match'), 0)  as memory_match_score,
  (
    coalesce(max(score) filter (where experience = 'catalogo'), 0)
    + coalesce(max(score) filter (where experience = 'memory_match'), 0)
  ) / 2.0 as final_score,
  max(submitted_at) as last_submitted_at,
  rank() over (
    partition by country, event_day
    order by
      (
        coalesce(max(score) filter (where experience = 'catalogo'), 0)
        + coalesce(max(score) filter (where experience = 'memory_match'), 0)
      ) / 2.0 desc,
      max(submitted_at) asc
  ) as position
from tagged
group by participant_id, country, event_day;

comment on view ranking_combined is
  'Ranking final por persona (promedio de las dos experiencias, 0 si no jugo una), POR DIA (event_day, huso horario del pais). Es el que decide el premio del dia - se consulta por pais y dia via ?country=eq.CO&event_day=eq.YYYY-MM-DD&order=position.asc&limit=10.';

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

-- =========================================================================
-- 6. Registro rapido por codigo ("ingreso rapido")
--
--    Hasta ahora el codigo (ver generateId/generateParticipantCode en cada
--    proyecto) solo vivia en la sesion local del navegador/tablet - nunca
--    se guardaba en ningun lado consultable. Eso significaba que la
--    pantalla "ingresa tu ID" no podia recuperar nada: aceptaba cualquier
--    codigo sin validarlo y seguia con nombre/correo vacios. Esta tabla es
--    el registro real (codigo -> nombre/correo/etc), escrito apenas se
--    genera el codigo, para que "ingresa tu ID" lo pueda buscar despues
--    desde CUALQUIER dispositivo/pais.
-- =========================================================================

create table if not exists registrations (
  id         uuid primary key default gen_random_uuid(),
  code       text not null,
  country    text not null,
  experience text not null,
  name       text,
  email      text,
  company    text,
  phone      text,
  area       text,
  created_at timestamptz not null default now(),

  constraint registrations_experience_check check (experience in ('catalogo', 'memory_match')),

  -- Un mismo codigo no deberia repetirse dentro del mismo pais+experiencia -
  -- generateId/generateParticipantCode ya minimizan la chance de colision,
  -- esto es solo el respaldo a nivel de base de datos.
  constraint registrations_unique_code unique (code, country, experience)
);

comment on table registrations is
  'Registro (nombre/correo/etc) asociado a un codigo, escrito apenas se genera - permite que "ingresa tu ID" recupere los datos de la persona desde cualquier dispositivo. No confundir con `participations`, que es el resultado FINAL de una experiencia jugada.';

create index if not exists registrations_code_idx
  on registrations (code, country, experience);

alter table registrations enable row level security;

-- Escritura: tanto el sync-server de catalogo (service_role, bypassa RLS)
-- como los clientes de celular/memory-match (anon, insertando directo desde
-- el navegador) necesitan poder crear un registro - a diferencia de
-- `participations`, aca NO se restringe por experience porque catalogo
-- tambien se registra directo desde el celular (Mirage-Products-Mobile-*),
-- no solo via el sync-server de la tablet.
grant insert (code, country, experience, name, email, company, phone, area)
  on registrations to anon;

create policy "anon puede insertar registrations"
  on registrations
  for insert
  to anon
  with check (true);

-- Lectura: NADIE (ni siquiera anon) puede hacer SELECT directo sobre la
-- tabla base - mismo criterio que `participations`. La unica forma de leer
-- un registro desde el navegador es esta funcion RPC, acotada a devolver
-- solo la fila que coincide exactamente con code+country+experience (nunca
-- una lista, nunca un scan libre de la tabla).
create or replace function get_registration_by_code(p_code text, p_country text, p_experience text)
returns table(name text, email text, company text, phone text, area text)
language sql
security definer
set search_path = public
as $$
  select name, email, company, phone, area
  from registrations
  where code = p_code and country = p_country and experience = p_experience
  limit 1;
$$;

grant execute on function get_registration_by_code(text, text, text) to anon, authenticated;

-- =========================================================================
-- 6b. Como insertar/leer un registro desde el sync-server (tablet+pitch)
-- =========================================================================

-- POST {RANKING_DB_URL}/rest/v1/registrations
-- Headers:
--   apikey: <service_role key>
--   Authorization: Bearer <service_role key>
--   Content-Type: application/json
--   Prefer: resolution=merge-duplicates,return=minimal
-- Body:
--   { "code": "742913", "country": "CO", "experience": "catalogo",
--     "name": "Ana", "email": "ana@mail.com", "company": null,
--     "phone": null, "area": null }

-- GET {RANKING_DB_URL}/rest/v1/registrations?code=eq.742913&country=eq.CO&experience=eq.catalogo&select=name,email,company,phone,area&limit=1
-- Headers: apikey/Authorization: <service_role key> (el sync-server SI puede
-- leer la tabla base directo, a diferencia del navegador - por eso el
-- celular/memory-match usan la funcion RPC de arriba en vez de esto).
