-- 자막 보유 여부. 자막 있는 영상을 위로 올리는 정렬에 쓴다(하드 필터가 아니라 우선순위).
-- 이후 되돌림: contentDetails.caption은 직접 올린 자막만 true라 신호로 쓸 수 없었다.
-- 목록은 조회수순으로 복귀했고 이 컬럼은 수집만 한다(아래 인덱스도 현재 미사용).
alter table videos add column has_caption boolean not null default false;
create index videos_locale_caption_idx on videos (locale, has_caption desc, views desc);
