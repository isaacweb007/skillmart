alter table skills add column trending_delta int not null default 0;

-- RLS 강화: 공개 읽기를 visible로 제한 (파이프라인은 service_role이라 무영향)
drop policy "public read" on skills;
create policy "public read visible" on skills for select using (status = 'visible');

drop policy "public read" on skill_translations;
create policy "public read visible" on skill_translations for select
  using (exists (select 1 from skills s where s.id = skill_id and s.status = 'visible'));
