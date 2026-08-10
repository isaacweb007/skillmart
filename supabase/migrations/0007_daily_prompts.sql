-- 매일 조금씩 추가되는 프롬프트 문장. 기본 40개는 코드(lib/prompts.ts)에 큐레이션돼 있고,
-- 이 테이블은 그 위에 쌓이는 증분이다. cmd가 PK라 같은 이름이 두 번 들어가지 않는다.
create table daily_prompts (
  cmd text primary key,
  category text not null,
  ko_label text not null,
  ko_example text not null,
  vi_label text not null,
  vi_example text not null,
  en_label text not null,
  en_example text not null,
  created_at timestamptz not null default now()
);

create index daily_prompts_created_idx on daily_prompts (created_at desc);

alter table daily_prompts enable row level security;
create policy "public read daily_prompts" on daily_prompts for select using (true);
