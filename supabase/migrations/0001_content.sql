create table skills (
  id uuid primary key default gen_random_uuid(),
  repo_full_name text not null,
  path text not null,
  slug text unique not null,
  source_url text not null,
  license text,
  stars int not null default 0,
  forks int not null default 0,
  last_commit_at timestamptz,
  content_hash text not null,
  category text,
  tags text[] not null default '{}',
  difficulty text,
  ai_score numeric,
  ai_review_ko text,
  ai_review_vi text,
  ai_review_en text,
  install_command text,
  rank_score numeric not null default 0,
  status text not null default 'pending_analysis'
    check (status in ('visible','hidden','pending_analysis','failed')),
  analysis_attempts int not null default 0,
  is_official boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (repo_full_name, path)
);
create index skills_status_idx on skills (status);
create index skills_category_idx on skills (category);
create index skills_rank_idx on skills (rank_score desc);

create table skill_translations (
  skill_id uuid not null references skills(id) on delete cascade,
  locale text not null check (locale in ('ko','vi','en')),
  name text not null,
  one_liner text not null,
  description_md text not null,
  install_guide_md text not null,
  primary key (skill_id, locale)
);

create table skill_metrics_daily (
  skill_id uuid not null references skills(id) on delete cascade,
  date date not null,
  stars int not null,
  primary key (skill_id, date)
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  is_pinned boolean not null default false,
  skill_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table collection_translations (
  collection_id uuid not null references collections(id) on delete cascade,
  locale text not null check (locale in ('ko','vi','en')),
  title text not null,
  description text not null,
  primary key (collection_id, locale)
);

create table pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  discovered int not null default 0,
  analyzed int not null default 0,
  published int not null default 0,
  errors int not null default 0,
  cost_usd numeric not null default 0,
  notes text
);

-- RLS: 콘텐츠는 공개 읽기(민감정보 없음, 전부 공개 GitHub 데이터),
-- 쓰기 정책은 없으므로 anon은 쓰기 불가. 파이프라인은 service_role로 우회.
alter table skills enable row level security;
alter table skill_translations enable row level security;
alter table skill_metrics_daily enable row level security;
alter table collections enable row level security;
alter table collection_translations enable row level security;
alter table pipeline_runs enable row level security;

create policy "public read" on skills for select using (true);
create policy "public read" on skill_translations for select using (true);
create policy "public read" on collections for select using (true);
create policy "public read" on collection_translations for select using (true);
-- skill_metrics_daily, pipeline_runs는 읽기 정책 없음(운영용, service_role만)
