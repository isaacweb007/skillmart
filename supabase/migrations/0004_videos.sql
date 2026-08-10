-- 유튜브 영상 큐레이션. YouTube API 약관상 저장 데이터는 30일 내 갱신 또는 삭제해야 하므로
-- 파이프라인이 매 런에서 fetched_at 30일 초과 행을 삭제한다(refresh.ts).
create table videos (
  video_id text primary key,
  locale text not null check (locale in ('ko','vi','en')),
  title text not null,
  channel_title text not null,
  thumbnail_url text not null,
  published_at timestamptz not null,
  views bigint not null default 0,
  duration_seconds int not null default 0,
  category text,
  fetched_at timestamptz not null default now()
);

create index videos_locale_idx on videos (locale, published_at desc);
create index videos_fetched_idx on videos (fetched_at);

alter table videos enable row level security;
create policy "public read videos" on videos for select using (true);
