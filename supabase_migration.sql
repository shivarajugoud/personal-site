-- Run this in your Supabase project → SQL Editor
-- Creates the todos table with Row Level Security (RLS) disabled for public access
-- (suitable for a personal site where you're the only user)

create table if not exists todos (
  id          bigint generated always as identity primary key,
  text        text        not null,
  done        boolean     not null default false,
  label       text        not null default 'personal',
  created_at  timestamptz not null default now()
);

-- Enable RLS but allow all operations for anon key
-- (fine for personal use — only you know the URL)
alter table todos enable row level security;

create policy "Allow all for anon" on todos
  for all
  using (true)
  with check (true);

-- Optional: index for ordering
create index todos_created_at_idx on todos (created_at desc);
