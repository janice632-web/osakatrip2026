-- Travel Companion V2：私人編輯連結 / 唯讀分享連結
-- 請在 Supabase SQL Editor 執行一次。

create extension if not exists pgcrypto;

create table if not exists public.private_trips (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Trip',
  payload jsonb not null default '{}'::jsonb,
  edit_token_hash text not null,
  read_token_hash text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.private_trips enable row level security;
-- 不建立 anon 直接資料表政策；所有存取皆經 Security Definer RPC。

create or replace function public.create_private_trip(
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
declare
  new_id uuid;
  final_payload jsonb;
begin
  final_payload := coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('shareToken', p_read_token);
  insert into public.private_trips(title,payload,edit_token_hash,read_token_hash)
  values(
    coalesce(nullif(p_title,''),'Untitled Trip'),
    final_payload,
    encode(digest(p_edit_token,'sha256'),'hex'),
    encode(digest(p_read_token,'sha256'),'hex')
  )
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.get_private_trip(
  p_trip_id uuid,
  p_token text
)
returns table(title text,payload jsonb,can_edit boolean,updated_at timestamptz)
language sql
security definer
set search_path = public, extensions
as $$
  select
    t.title,
    case
      when t.edit_token_hash = encode(digest(p_token,'sha256'),'hex')
        then t.payload
      else t.payload - 'shareToken'
    end,
    (t.edit_token_hash = encode(digest(p_token,'sha256'),'hex')) as can_edit,
    t.updated_at
  from public.private_trips t
  where t.id = p_trip_id
    and (
      t.edit_token_hash = encode(digest(p_token,'sha256'),'hex')
      or t.read_token_hash = encode(digest(p_token,'sha256'),'hex')
    );
$$;

create or replace function public.update_private_trip(
  p_trip_id uuid,
  p_edit_token text,
  p_payload jsonb
)
returns timestamptz
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ts timestamptz;
begin
  update public.private_trips
  set payload = p_payload,
      updated_at = now()
  where id = p_trip_id
    and edit_token_hash = encode(digest(p_edit_token,'sha256'),'hex')
  returning updated_at into ts;

  if ts is null then
    raise exception 'Invalid edit token';
  end if;
  return ts;
end;
$$;

grant execute on function public.create_private_trip(text,text,text,jsonb) to anon, authenticated;
grant execute on function public.get_private_trip(uuid,text) to anon, authenticated;
grant execute on function public.update_private_trip(uuid,text,jsonb) to anon, authenticated;

-- Realtime（若已加入會忽略）
do $$
begin
  alter publication supabase_realtime add table public.private_trips;
exception
  when duplicate_object then null;
end $$;
