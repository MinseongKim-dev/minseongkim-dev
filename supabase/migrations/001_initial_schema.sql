-- Node AI Life Manager — initial schema
-- Single generic records table mirrors the DynamoDB single-table design.
-- Row Level Security enforces per-user isolation at the DB layer.

create extension if not exists "uuid-ossp";

-- ── Generic records ──────────────────────────────────────────────────────────
create table if not exists records (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users on delete cascade,
  entity_type   text        not null,
  sort_key      text        not null default '',
  custom_sort_key text      not null default '',
  data          jsonb       not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index records_user_type_idx      on records (user_id, entity_type);
create index records_user_type_sort_idx on records (user_id, entity_type, sort_key);
create index records_data_gin           on records using gin (data);

alter table records enable row level security;

create policy "users own their records"
  on records for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── AI chat messages ─────────────────────────────────────────────────────────
create table if not exists messages (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  role       text        not null check (role in ('user', 'assistant')),
  content    text        not null,
  created_at timestamptz not null default now()
);

create index messages_user_created_idx on messages (user_id, created_at desc);

alter table messages enable row level security;

create policy "users own their messages"
  on messages for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── Auto-update updated_at ───────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger records_updated_at
  before update on records
  for each row execute function update_updated_at();
