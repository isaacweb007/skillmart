create table user_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null references skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create index user_favorites_user_idx on user_favorites (user_id, created_at desc);

alter table user_favorites enable row level security;

-- anon 키가 브라우저에 노출되므로 이 세 정책이 유일한 방어선이다
create policy "own favorites read" on user_favorites for select
  using (auth.uid() = user_id);
create policy "own favorites insert" on user_favorites for insert
  with check (auth.uid() = user_id);
create policy "own favorites delete" on user_favorites for delete
  using (auth.uid() = user_id);
