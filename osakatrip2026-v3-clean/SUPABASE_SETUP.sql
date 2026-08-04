-- Travel Companion V2.0.1 私人連結同步
-- 在 Supabase SQL Editor 執行一次。

create extension if not exists pgcrypto;

create table if not exists public.tc_private_trips (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Trip',
  payload jsonb not null default '{}'::jsonb,
  edit_token_hash text not null,
  read_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tc_private_trips enable row level security;

create or replace function public.tc_create_private_trip(
  p_title text,
  p_edit_token text,
  p_read_token text,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare new_id uuid;
begin
  insert into public.tc_private_trips(title,payload,edit_token_hash,read_token_hash)
  values(
    coalesce(nullif(p_title,''),'Untitled Trip'),
    coalesce(p_payload,'{}'::jsonb) || jsonb_build_object('shareToken',p_read_token),
    encode(digest(p_edit_token,'sha256'),'hex'),
    encode(digest(p_read_token,'sha256'),'hex')
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.tc_get_private_trip(
  p_trip_id uuid,
  p_token text
)
returns table(payload jsonb,can_edit boolean,updated_at timestamptz)
language sql
security definer
set search_path = public, extensions
as $$
  select
    case when t.edit_token_hash=encode(digest(p_token,'sha256'),'hex')
      then t.payload else t.payload-'shareToken' end,
    t.edit_token_hash=encode(digest(p_token,'sha256'),'hex'),
    t.updated_at
  from public.tc_private_trips t
  where t.id=p_trip_id and (
    t.edit_token_hash=encode(digest(p_token,'sha256'),'hex')
    or t.read_token_hash=encode(digest(p_token,'sha256'),'hex')
  );
$$;

create or replace function public.tc_update_private_trip(
  p_trip_id uuid,
  p_edit_token text,
  p_payload jsonb
)
returns timestamptz
language plpgsql
security definer
set search_path = public, extensions
as $$
declare ts timestamptz;
begin
  update public.tc_private_trips
  set payload=p_payload,updated_at=now()
  where id=p_trip_id
    and edit_token_hash=encode(digest(p_edit_token,'sha256'),'hex')
  returning updated_at into ts;
  if ts is null then raise exception 'Invalid edit token'; end if;
  return ts;
end;
$$;

grant execute on function public.tc_create_private_trip(text,text,text,jsonb) to anon,authenticated;
grant execute on function public.tc_get_private_trip(uuid,text) to anon,authenticated;
grant execute on function public.tc_update_private_trip(uuid,text,jsonb) to anon,authenticated;
