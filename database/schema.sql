-- CodeClarity database schema
-- Run this file in the Supabase SQL Editor.
-- The backend uses the server-only service-role key and checks browser_id
-- on every history query. RLS blocks direct access from public client roles.

create extension if not exists pgcrypto;

create table if not exists public.code_explanations (
  id uuid primary key default gen_random_uuid(),
  browser_id uuid not null,
  language text not null check (language in ('c', 'cpp', 'java', 'python', 'javascript')),
  code text not null check (char_length(code) between 1 and 20000),
  title text not null check (char_length(title) between 1 and 200),
  summary text not null,
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists code_explanations_browser_created_idx
  on public.code_explanations (browser_id, created_at desc);

alter table public.code_explanations enable row level security;

-- No anon/authenticated policies are intentionally created. Direct browser
-- database access is denied. The backend's service-role key bypasses RLS,
-- so the backend must always filter by browser_id before reading/deleting.
revoke all on table public.code_explanations from anon, authenticated;
grant select, insert, delete on table public.code_explanations to service_role;
